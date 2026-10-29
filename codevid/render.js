#!/usr/bin/env node
/* Render a code-video scene to a finished vertical MP4 (picture + voice + captions + sound effects).
 *
 *   node render.js scenes/rubber.js                      full video -> out/rubber.mp4
 *   node render.js scenes/rubber.js --preview 2,6.5,12   a few stills -> out/rubber_preview/
 *   node render.js scenes/rubber.js --fps 24 --no-voice
 *
 * Voice (optional, first one that works):
 *   1. your own recordings: voice/<scene>/01.wav, 02.wav ... (one file per narration line, any audio format)
 *   2. VOICE_API=http://localhost:3900 (VoiceStudio or any OpenAI-compatible /v1/audio/speech server)
 *      with VOICE_MODEL and VOICE_NAME
 *   3. the free Edge voice, if the `edge-tts` command is installed (pip install edge-tts)
 *   Otherwise the video has captions + sound effects and no narration.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const sceneFile = args.find(a => !a.startsWith('--') && /\.js$/.test(a));
if (!sceneFile) { console.log('usage: node render.js scenes/<name>.js [--preview 1,2,3] [--fps 30] [--no-voice]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = k => args.includes(k);
const NAME = path.basename(sceneFile, '.js');
const ROOT = __dirname;
const OUT = path.join(ROOT, 'out'); fs.mkdirSync(OUT, { recursive: true });
const FPS = +opt('--fps', 30);
const ff = (a) => { const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...a], { encoding: 'utf8' }); if (r.status) throw new Error('ffmpeg: ' + r.stderr.slice(-1500)); };
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }));

async function openScene() {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(ROOT, 'page.html') + '?scene=' + encodeURIComponent(path.resolve(sceneFile)));
  await page.waitForFunction('window.ready === true || !!window.bootError', null, { timeout: 120000 });
  const err = await page.evaluate('window.bootError');
  if (err) throw new Error(err);
  return { browser, page };
}

async function frames(page, times, dir, name) {
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < times.length; i++) {
    const data = await page.evaluate(t => { window.render(t); return document.querySelector('canvas').toDataURL('image/jpeg', 0.92); }, times[i]);
    fs.writeFileSync(path.join(dir, name(i, times[i])), Buffer.from(data.split(',')[1], 'base64'));
    if (i % 90 === 0) console.log(`  frame ${i}/${times.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}

// ---------------------------------------------------------------- voice
async function makeVoice(lines, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const own = path.join(ROOT, 'voice', NAME);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const n = String(i + 1).padStart(2, '0'), wav = path.join(dir, `${n}.wav`);
    const mine = fs.existsSync(own) && fs.readdirSync(own).find(f => f.startsWith(n + '.'));
    try {
      if (mine) ff(['-i', path.join(own, mine), '-ar', '44100', '-ac', '2', wav]);
      else if (process.env.VOICE_API) {
        const r = await fetch(process.env.VOICE_API.replace(/\/$/, '') + '/v1/audio/speech', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: process.env.VOICE_MODEL || 'omnivoice', voice: process.env.VOICE_NAME || 'default', input: lines[i].say || lines[i].text, response_format: 'wav' }),
        });
        if (!r.ok) throw new Error('voice API ' + r.status + ' ' + (await r.text()).slice(0, 200));
        const raw = path.join(dir, `${n}.raw`); fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
        ff(['-i', raw, '-ar', '44100', '-ac', '2', wav]);
      } else {
        const mp3 = path.join(dir, `${n}.mp3`);
        const r = spawnSync('edge-tts', ['--voice', process.env.EDGE_VOICE || 'en-US-AndrewNeural', '--rate', '+8%', '--text', lines[i].say || lines[i].text, '--write-media', mp3], { encoding: 'utf8' });
        if (r.status || !fs.existsSync(mp3) || fs.statSync(mp3).size < 1000) throw new Error('no voice provider available');
        ff(['-i', mp3, '-ar', '44100', '-ac', '2', wav]);
      }
      out.push({ wav, at: lines[i].t, len: dur(wav) });
    } catch (e) {
      console.log(`  voice line ${n}: ${e.message} - continuing without narration`);
      return [];
    }
  }
  out.forEach((v, i) => {
    const next = i + 1 < lines.length ? lines[i + 1].t : Infinity;
    if (v.at + v.len > next + 0.15) console.log(`  ! line ${i + 1} is ${v.len.toFixed(1)}s but its slot is ${(next - v.at).toFixed(1)}s - move the next line later`);
  });
  return out;
}

// ---------------------------------------------------------------- sound effect library (synthesized, no downloads)
const SFX = {
  whoomp: "aevalsrc='0.9*sin(2*PI*(380*exp(-4*t))*t)*exp(-3*t)':s=44100:d=0.8",
  scrape: 'anoisesrc=d=1.9:c=pink:a=0.8,bandpass=f=2600:w=900,tremolo=f=28:d=0.7,afade=t=out:st=0.6:d=1.3,volume=1.4',
  crackle: 'anoisesrc=d=1.7:c=white:a=0.9,highpass=f=4000,tremolo=f=55:d=0.95,afade=t=out:st=0.4:d=1.3,volume=0.6',
  whoosh: 'anoisesrc=d=0.55:c=pink:a=0.7,highpass=f=400,lowpass=f=4500,afade=t=in:d=0.3:curve=exp,afade=t=out:st=0.3:d=0.25',
  thud: "aevalsrc='1.0*sin(2*PI*70*t)*exp(-9*t)':s=44100:d=0.6",
  water: 'anoisesrc=d=5.2:c=white:a=0.6,highpass=f=2500,lowpass=f=9000,tremolo=f=7:d=0.3,afade=t=in:d=0.4,afade=t=out:st=4.4:d=0.8,volume=0.35',
  boing: "aevalsrc='0.8*sin(2*PI*(180+500*t)*t)*exp(-4*t)':s=44100:d=0.7",
  pop: "aevalsrc='0.7*sin(2*PI*900*t)*exp(-30*t)':s=44100:d=0.25",
  ding: "aevalsrc='0.5*sin(2*PI*1320*t)*exp(-5*t)+0.3*sin(2*PI*1980*t)*exp(-7*t)':s=44100:d=1.0",
  tick: "aevalsrc='0.6*sin(2*PI*2400*t)*exp(-60*t)':s=44100:d=0.08",
  rumble: 'anoisesrc=d=3:c=brown:a=0.9,lowpass=f=120,afade=t=in:d=0.3,afade=t=out:st=2:d=1,volume=2',
  crash: 'anoisesrc=d=1.2:c=white:a=1,lowpass=f=3000,afade=t=out:st=0.05:d=1.1,volume=1.2',
  zap: "aevalsrc='0.6*sin(2*PI*(1800-1500*t)*t)*exp(-6*t)':s=44100:d=0.5",
  splash: 'anoisesrc=d=1.0:c=white:a=0.9,bandpass=f=1800:w=2500,afade=t=out:st=0.1:d=0.9,volume=0.9',
};
const BEDS = {
  city: d => `anoisesrc=d=${d}:c=brown:a=0.5,lowpass=f=500,volume=0.5`,
  nature: d => `anoisesrc=d=${d}:c=pink:a=0.25,highpass=f=1500,lowpass=f=6000,tremolo=f=0.3:d=0.5,volume=0.25`,
  studio: d => `anoisesrc=d=${d}:c=brown:a=0.2,lowpass=f=200,volume=0.3`,
};
const pad = d => `aevalsrc='0.12*sin(2*PI*110*t)*(0.6+0.4*sin(2*PI*0.07*t))+0.1*sin(2*PI*164.8*t)+0.08*sin(2*PI*220*t)':s=44100:d=${d},lowpass=f=900,afade=t=in:d=1.5,afade=t=out:st=${Math.max(0, d - 2.5)}:d=2.5,volume=0.8`;

function audioMix(meta, D, voice, dir) {
  const lib = path.join(ROOT, 'out', 'sfx'); fs.mkdirSync(lib, { recursive: true });
  const src = n => { const f = path.join(lib, n + '.wav'); if (!fs.existsSync(f)) ff(['-f', 'lavfi', '-i', SFX[n], '-ac', '2', '-ar', '44100', f]); return f; };
  const bedF = path.join(dir, 'bed.wav'); ff(['-f', 'lavfi', '-i', (BEDS[meta.bed || 'city'] || BEDS.city)(D), '-ac', '2', '-ar', '44100', bedF]);
  const padF = path.join(dir, 'pad.wav'); ff(['-f', 'lavfi', '-i', pad(D), '-ac', '2', '-ar', '44100', padF]);
  const ins = [bedF, padF, ...(meta.sfx || []).map(([n]) => src(n))];
  const fc = ['[0:a]apad[b0]', '[1:a]apad[b1]'];
  (meta.sfx || []).forEach(([, at, vol = 1], k) => { const ms = Math.round(at * 1000); fc.push(`[${k + 2}:a]volume=${vol},adelay=${ms}|${ms},apad[s${k}]`); });
  const fx = ['[b0]', '[b1]', ...(meta.sfx || []).map((_, k) => `[s${k}]`)];
  fc.push(fx.join('') + `amix=inputs=${fx.length}:normalize=0:duration=longest,atrim=0:${D}[fx]`);
  let last = '[fx]';
  if (voice.length) {
    const base = ins.length;
    voice.forEach((v, k) => { ins.push(v.wav); const ms = Math.round(v.at * 1000); fc.push(`[${base + k}:a]adelay=${ms}|${ms},apad[v${k}]`); });
    fc.push(voice.map((_, k) => `[v${k}]`).join('') + `amix=inputs=${voice.length}:normalize=0:duration=longest,atrim=0:${D},asplit=2[vo][sc]`);
    fc.push('[fx][sc]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=300[duck]');   // effects dip under the voice
    fc.push('[vo][duck]amix=inputs=2:normalize=0:duration=first[mix]');
    last = '[mix]';
  }
  fc.push(`${last}loudnorm=I=-14:TP=-1.5[a]`);
  const out = path.join(dir, 'mix.wav');
  ff([...ins.flatMap(f => ['-i', f]), '-filter_complex', fc.join(';'), '-map', '[a]', '-ar', '44100', out]);
  return out;
}

// ---------------------------------------------------------------- captions, badges, end card (ASS)
const ts = t => `0:${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
function captions(meta, D, voice, file) {
  const font = meta.font || 'DejaVu Sans';
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n\n[V4+ Styles]\n` +
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n' +
    `Style: Cap,${font},78,&H0036C8FF,&H0036C8FF,&H00141414,&H96000000,-1,0,0,0,100,100,0,0,1,7,3,2,70,70,520,1\n` +
    `Style: Badge,${font},44,&H00FFFFFF,&H00FFFFFF,&H00000000,&HA0301010,-1,0,0,0,100,100,2,0,3,16,0,8,60,60,170,1\n` +
    `Style: Big,${font},96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,2,0,1,8,4,8,60,60,250,1\n` +
    `Style: Btn,${font},64,&H00141414,&H00141414,&H0036C8FF,&H0036C8FF,-1,0,0,0,100,100,1,0,3,20,0,5,80,80,0,1\n` +
    `Style: Mark,${font},30,&H4DFFFFFF,&H4DFFFFFF,&H80000000,&H00000000,-1,0,0,0,100,100,3,0,1,2,0,9,50,60,120,1\n\n[Events]\n` +
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
  const esc = s => String(s).replace(/[{}]/g, '');
  const ev = [`Dialogue: 4,${ts(0)},${ts(D)},Mark,,0,0,0,,${esc(meta.watermark || 'VERSE FILMS')}`];
  const lines = meta.lines || [];
  lines.forEach((l, i) => {
    const end = l.end || Math.min(i + 1 < lines.length ? lines[i + 1].t : D, voice[i] ? voice[i].at + voice[i].len + 0.25 : Infinity);
    // long lines are shown in 2-4 word chunks timed across the line
    const words = l.text.split(/\s+/), size = l.chunk || 4, chunks = [];
    for (let k = 0; k < words.length; k += size) chunks.push(words.slice(k, k + size).join(' '));
    const span = (end - l.t) / chunks.length;
    chunks.forEach((c, k) => ev.push(`Dialogue: 1,${ts(l.t + k * span)},${ts(l.t + (k + 1) * span)},Cap,,0,0,0,,{\\fscx85\\fscy85\\t(0,120,\\fscx100\\fscy100)}${esc(c)}`));
  });
  for (const b of meta.badges || []) ev.push(`Dialogue: 2,${ts(b.t)},${ts(b.end)},Badge,,0,0,0,,${esc(b.text)}`);
  for (const b of meta.big || []) ev.push(`Dialogue: 3,${ts(b.t)},${ts(b.end)},Big,,0,0,0,,{\\c${b.color || '&H7BDC8A&'}\\fscx40\\fscy40\\t(0,150,\\fscx110\\fscy110)\\t(150,260,\\fscx100\\fscy100)}${esc(b.text)}`);
  if (meta.countdown) {
    const c = meta.countdown;
    for (let k = c.t; k < c.end - 1e-6; k += 0.1) {
      const left = c.from * (c.end - k) / (c.end - c.t);
      ev.push(`Dialogue: 2,${ts(k)},${ts(Math.min(c.end, k + 0.1))},Badge,,0,0,0,,${esc(c.label)}   ${left.toFixed(1)}s${c.note ? `  {\\fs30}${esc(c.note)}` : ''}`);
    }
  }
  if (meta.endCard !== false) {
    const st = Math.max(0, D - 2.4);
    ev.push(`Dialogue: 5,${ts(st)},${ts(D)},Btn,,0,0,0,,{\\pos(540,1010)\\fscx40\\fscy40\\t(0,160,\\fscx112\\fscy112)\\t(160,260,\\fscx100\\fscy100)}  ${esc(meta.endCard || 'FOLLOW FOR MORE')}  `);
  }
  fs.writeFileSync(file, head + ev.join('\n') + '\n');
}

// ---------------------------------------------------------------- main
(async () => {
  const { browser, page } = await openScene();
  const meta = await page.evaluate('window.meta()');
  const D = await page.evaluate('window.SCENE.duration');
  if (flag('--preview')) {
    const times = opt('--preview', '1').split(',').map(Number);
    const dir = path.join(OUT, NAME + '_preview');
    await frames(page, times, dir, (i, t) => `t_${t.toFixed(2)}.jpg`);
    await browser.close();
    console.log('preview stills in', dir);
    return;
  }
  const work = path.join(OUT, NAME + '_work'); fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(work, { recursive: true });
  console.log(`rendering ${NAME}: ${D}s at ${FPS} fps`);
  const times = Array.from({ length: Math.round(D * FPS) }, (_, i) => i / FPS);
  await frames(page, times, path.join(work, 'frames'), i => `f_${String(i).padStart(5, '0')}.jpg`);
  await browser.close();
  const voice = flag('--no-voice') || !(meta.lines || []).length ? [] : await makeVoice(meta.lines, path.join(work, 'voice'));
  const mix = audioMix(meta, D, voice, work);
  const ass = path.join(work, 'caps.ass'); captions(meta, D, voice, ass);
  const out = path.join(OUT, NAME + '.mp4');
  ff(['-framerate', String(FPS), '-i', path.join(work, 'frames', 'f_%05d.jpg'), '-i', mix,
      '-vf', `subtitles=${ass.replace(/:/g, '\\:')},format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
      '-maxrate', '7M', '-bufsize', '14M', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('done:', out, voice.length ? '(with narration)' : '(no narration - captions + sound effects)');
})().catch(e => { console.error(e.message || e); process.exit(1); });
