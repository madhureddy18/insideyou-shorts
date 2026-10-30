#!/usr/bin/env node
/* Render a code-video scene to a finished vertical MP4: picture + character voices + captions + SFX + music.
 *
 *   node render.js scenes/rupee_doubling.js                    -> out/rupee_doubling.mp4
 *   node render.js scenes/rupee_doubling.js --preview 2,9.5    -> stills in out/rupee_doubling_preview/
 *   options: --fps 30   --no-music
 *
 * Voices: free Kokoro voices (tts.py) by default. Your own recordings win if present:
 *   voice/<scene>/01.wav, 02.wav ... one file per dialogue line.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync, spawnSync } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const sceneFile = args.find(a => !a.startsWith('--') && /\.js$/.test(a));
if (!sceneFile) { console.log('usage: node render.js scenes/<name>.js [--preview 1,2,3] [--fps 30] [--no-music]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = k => args.includes(k);
const ROOT = __dirname, NAME = path.basename(sceneFile, '.js');
const OUT = path.join(ROOT, 'out'); fs.mkdirSync(OUT, { recursive: true });
const WORK = path.join(OUT, NAME + '_work'); fs.mkdirSync(WORK, { recursive: true });
const FPS = +opt('--fps', 30);
const PY = process.env.PYTHON || 'python3';
const ff = a => { const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...a], { encoding: 'utf8', maxBuffer: 1 << 26 }); if (r.status) throw new Error('ffmpeg: ' + r.stderr.slice(-2000)); };
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }));

// ---------------------------------------------------------------- tiny static server (ES modules don't load from file://)
function serve() {
  const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.mjs': 'text/javascript' };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const f = u.startsWith('/@scene/') ? path.resolve(u.slice(8)) : path.join(ROOT, u);
    if (!f.startsWith(ROOT) && !u.startsWith('/@scene/')) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

// ---------------------------------------------------------------- voices -> real line timings
function voices(lines) {
  const dir = path.join(WORK, 'voice'); fs.mkdirSync(dir, { recursive: true });
  const own = path.join(ROOT, 'voice', NAME);
  const key = JSON.stringify(lines.map(l => [l.who, l.say || l.text, l.speed || 0]));
  const cache = path.join(dir, 'key.json');
  let durs;
  const mine = i => fs.existsSync(own) && fs.readdirSync(own).find(f => f.startsWith(String(i + 1).padStart(2, '0') + '.'));
  if (fs.existsSync(cache) && fs.readFileSync(cache, 'utf8') === key && lines.every((_, i) => fs.existsSync(path.join(dir, String(i + 1).padStart(2, '0') + '.wav')))) {
    durs = lines.map((_, i) => dur(path.join(dir, String(i + 1).padStart(2, '0') + '.wav')));
  } else {
    const lf = path.join(dir, 'lines.json'); fs.writeFileSync(lf, JSON.stringify(lines));
    const r = spawnSync(PY, [path.join(ROOT, 'tts.py'), lf, dir], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status) throw new Error('voice generation failed: ' + r.stderr.slice(-1500));
    durs = JSON.parse(r.stdout.trim().split('\n').pop());
    fs.writeFileSync(cache, key);
  }
  lines.forEach((_, i) => {             // your own recording replaces the AI line
    const m = mine(i); if (!m) return;
    const wav = path.join(dir, String(i + 1).padStart(2, '0') + '.wav');
    ff(['-i', path.join(own, m), '-ar', '24000', '-ac', '1', wav]); durs[i] = dur(wav);
  });
  let t = 0.45;
  const T = { lines: lines.map((l, i) => { t += i ? (l.gap ?? 0.2) : 0; const o = { who: l.who, text: l.text, t: +t.toFixed(3), end: +(t + durs[i]).toFixed(3), wav: path.join(dir, String(i + 1).padStart(2, '0') + '.wav') }; t = o.end; return o; }) };
  return T;
}

// ---------------------------------------------------------------- sound effects + music (all synthesized)
const SFX = {
  pop: "aevalsrc='0.7*sin(2*PI*(500+900*exp(-t*40))*t)*exp(-t*28)':s=44100:d=0.25",
  ding: "aevalsrc='0.45*sin(2*PI*1320*t)*exp(-4*t)+0.25*sin(2*PI*1980*t)*exp(-6*t)':s=44100:d=1.2",
  whoosh: 'anoisesrc=d=0.6:c=pink:a=0.8,highpass=f=350,lowpass=f=5000,afade=t=in:d=0.32:curve=exp,afade=t=out:st=0.32:d=0.28',
  coin: "aevalsrc='0.45*sin(2*PI*2900*t)*exp(-28*t)+0.35*sin(2*PI*4200*t)*exp(-36*t)+0.2*sin(2*PI*6100*t)*exp(-50*t)':s=44100:d=0.4",
  tick: "aevalsrc='0.5*sin(2*PI*2200*t)*exp(-70*t)':s=44100:d=0.07",
  riser: "aevalsrc='0.35*(t/2.6)*(t/2.6)*sin(2*PI*(160*t+190*t*t))+0.12*(t/2.6)*sin(2*PI*(320*t+380*t*t))':s=44100:d=2.6",
  bass: "aevalsrc='0.95*sin(2*PI*(38+90*exp(-t*6))*t)*exp(-t*1.6)':s=44100:d=2.2",
  kaching: "aevalsrc='0.5*sin(2*PI*1568*t)*exp(-5*t)+0.4*sin(2*PI*2093*t)*exp(-5*t)*gte(t,0.09)+0.25*sin(2*PI*3136*t)*exp(-8*t)':s=44100:d=1.4",
  thud: "aevalsrc='1.0*sin(2*PI*(60+40*exp(-t*20))*t)*exp(-8*t)':s=44100:d=0.6",
  rustle: 'anoisesrc=d=2.8:c=pink:a=0.6,bandpass=f=3500:w=2500,tremolo=f=11:d=0.6,afade=t=in:d=0.3,afade=t=out:st=1.8:d=1',
  zap: "aevalsrc='0.32*sin(2*PI*(2400-1700*t/0.4)*t)*exp(-5*t)':s=44100:d=0.4",
  beep: "aevalsrc='0.3*sin(2*PI*1500*t)*exp(-38*t)':s=44100:d=0.12",
  chime: "aevalsrc='0.4*sin(2*PI*988*t)*exp(-7*t)*lt(t,0.15)+0.45*sin(2*PI*1319*t)*exp(-4*(t-0.14))*gte(t,0.14)':s=44100:d=1.1",
  boing: "aevalsrc='0.7*sin(2*PI*(180+520*t)*t)*exp(-4*t)':s=44100:d=0.7",
};
function music(D, m) {
  // lo-fi loop at 88 BPM: kick, off-beat hats, Am-F-C-G pad. Muted between muteFrom..muteTo (before a reveal).
  const B = 60 / 88, BAR = 4 * B;
  const root = `(110*lt(mod(t,${8 * BAR}),${2 * BAR})+87.31*gte(mod(t,${8 * BAR}),${2 * BAR})*lt(mod(t,${8 * BAR}),${4 * BAR})+130.81*gte(mod(t,${8 * BAR}),${4 * BAR})*lt(mod(t,${8 * BAR}),${6 * BAR})+98*gte(mod(t,${8 * BAR}),${6 * BAR}))`;
  const third = `(${root}*(1.1892*lt(mod(t,${8 * BAR}),${2 * BAR})+1.2599*gte(mod(t,${8 * BAR}),${2 * BAR})))`;
  const kick = `0.75*sin(2*PI*(42+70*exp(-mod(t,${B})*28))*mod(t,${B}))*exp(-mod(t,${B})*9)`;
  const hat = `0.07*(random(0)*2-1)*exp(-mod(t+${B / 2},${B})*55)`;
  const pad = `0.06*(sin(2*PI*${root}*t)+0.7*sin(2*PI*${third}*t)+0.6*sin(2*PI*${root}*1.4983*t))*(0.75+0.25*sin(2*PI*0.5*t))`;
  const f = path.join(WORK, 'music.wav');
  const mute = m && m.muteFrom != null ? `,volume='if(between(t,${m.muteFrom},${m.muteTo}),0,1)':eval=frame` : '';
  ff(['-f', 'lavfi', '-i', `aevalsrc='${kick}+${hat}+${pad}':s=44100:d=${D}`, '-af', `lowpass=f=4200,afade=t=in:d=0.8,afade=t=out:st=${Math.max(0, D - 1.8)}:d=1.8,volume=0.55${mute}`, '-ac', '2', f]);
  return f;
}
function mix(info, T, D) {
  const lib = path.join(OUT, 'sfx'); fs.mkdirSync(lib, { recursive: true });
  const sfxFile = n => { const f = path.join(lib, n + '.wav'); if (!fs.existsSync(f)) { if (!SFX[n]) throw new Error('unknown sound ' + n); ff(['-f', 'lavfi', '-i', SFX[n], '-ac', '2', '-ar', '44100', f]); } return f; };
  const ins = [], fc = [];
  const bed = [];
  if (!flag('--no-music')) { ins.push(music(D, info.music)); fc.push(`[${ins.length - 1}:a]apad,atrim=0:${D}[mu]`); bed.push('[mu]'); }
  info.sfx.forEach(([n, at, vol = 1], k) => { ins.push(sfxFile(n)); const ms = Math.max(0, Math.round(at * 1000)); fc.push(`[${ins.length - 1}:a]volume=${vol},adelay=${ms}|${ms},apad[s${k}]`); bed.push(`[s${k}]`); });
  fc.push(`${bed.join('')}amix=inputs=${bed.length}:normalize=0:duration=longest,atrim=0:${D}[bed]`);
  T.lines.forEach((l, k) => { ins.push(l.wav); const ms = Math.round(l.t * 1000); fc.push(`[${ins.length - 1}:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.6,adelay=${ms}|${ms},apad[v${k}]`); });
  fc.push(`${T.lines.map((_, k) => `[v${k}]`).join('')}amix=inputs=${T.lines.length}:normalize=0:duration=longest,atrim=0:${D},asplit=2[vo][sc]`);
  fc.push('[bed][sc]sidechaincompress=threshold=0.025:ratio=4:attack=10:release=280[duck]');
  fc.push('[vo][duck]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]');
  const out = path.join(WORK, 'mix.wav');
  ff([...ins.flatMap(f => ['-i', f]), '-filter_complex', fc.join(';'), '-map', '[a]', '-ar', '44100', out]);
  return out;
}

// ---------------------------------------------------------------- captions (ASS)
const ts = t => `0:${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
function captions(info, T, D, file) {
  const font = 'DejaVu Sans';
  const style = (n, size, prim, out, back, border, outline, shadow, align, mv, spacing = 0) => `Style: ${n},${font},${size},${prim},${prim},${out},${back},-1,0,0,0,100,100,${spacing},0,${border},${outline},${shadow},${align},70,70,${mv},1`;
  const head = '[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n\n[V4+ Styles]\n' +
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n' +
    [style('Raju', 72, '&H00FFFFFF', '&H00101010', '&H96000000', 1, 7, 3, 2, 470),
     style('Bloc', 72, '&H0036C8FF', '&H00101010', '&H96000000', 1, 7, 3, 2, 470),
     style('Count', 64, '&H00FFFFFF', '&H00000000', '&HC8301808', 3, 18, 0, 8, 150, 2),
     style('Badge', 46, '&H00FFFFFF', '&H00000000', '&HB4E46F2F', 3, 16, 0, 8, 160, 2),
     style('Big', 104, '&H0036C8FF', '&H00000000', '&H96000000', 1, 9, 4, 8, 330, 1),
     style('Btn', 62, '&H00141414', '&H0036C8FF', '&H0036C8FF', 3, 20, 0, 5, 0, 1),
     style('Mark', 30, '&H4DFFFFFF', '&H80000000', '&H00000000', 1, 2, 0, 9, 110, 3)].join('\n') +
    '\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
  const esc = s => String(s).replace(/[{}]/g, '');
  const ev = [`Dialogue: 6,${ts(0)},${ts(D)},Mark,,0,0,0,,${esc(info.watermark || 'VERSE FILMS')}`];
  for (const l of T.lines) {                                    // speaker-coloured captions, 2-4 word chunks
    const words = l.text.split(/\s+/), chunks = [];
    for (let k = 0; k < words.length;) { const n = words.length - k <= 4 ? words.length - k : 3; chunks.push(words.slice(k, k + n).join(' ')); k += n; }
    const span = (l.end - l.t) / chunks.length;
    chunks.forEach((c, k) => ev.push(`Dialogue: 1,${ts(l.t + k * span)},${ts(l.t + (k + 1) * span + (k === chunks.length - 1 ? 0.15 : 0))},${(l.who === 'bloc' || l.who === 'chotu') ? 'Bloc' : 'Raju'},,0,0,0,,{\\fscx88\\fscy88\\t(0,110,\\fscx100\\fscy100)}${esc(c)}`));
  }
  for (const b of info.badges) ev.push(`Dialogue: 2,${ts(b.t)},${ts(b.end)},Badge,,0,0,0,,{\\fad(120,120)}${esc(b.text)}`);
  for (const b of info.big) ev.push(`Dialogue: 3,${ts(b.t)},${ts(b.end)},Big,,0,0,0,,{\\fscx30\\fscy30\\t(0,180,\\fscx112\\fscy112)\\t(180,300,\\fscx100\\fscy100)}${esc(b.text)}`);
  if (info.counter) {                                           // live counter, sampled at 15 fps, merged when unchanged
    let cur = null, st = 0;
    const flush = end => { if (cur) ev.push(`Dialogue: 2,${ts(st)},${ts(end)},Count,,0,0,0,,${esc(cur)}`); };
    info.counter.forEach((s, i) => { if (s !== cur) { flush(i / 15); cur = s; st = i / 15; } });
    flush(D);
  }
  if (info.endCard !== false) ev.push(`Dialogue: 5,${ts(D - 2.3)},${ts(D)},Btn,,0,0,0,,{\\pos(540,1010)\\fscx40\\fscy40\\t(0,160,\\fscx112\\fscy112)\\t(160,260,\\fscx100\\fscy100)}  ${esc(info.endCard || 'FOLLOW FOR MORE')}  `);
  fs.writeFileSync(file, head + ev.join('\n') + '\n');
}

// ---------------------------------------------------------------- main
(async () => {
  const srv = await serve(), port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/page.html?scene=/@scene/${encodeURIComponent(path.resolve(sceneFile))}`);
  await page.waitForFunction('window.sceneLoaded || window.bootError', null, { timeout: 120000 });
  const err = await page.evaluate('window.bootError'); if (err) throw new Error(err);
  const lines = await page.evaluate('window.SCENE.lines');
  console.log(`voices: ${lines.length} lines`);
  const T = voices(lines);
  await page.evaluate(t => K.boot(t), { lines: T.lines.map(({ wav, ...l }) => l) });
  const info = await page.evaluate('window.sceneInfo()');
  const D = info.duration;
  const shot = async (t, f) => { const data = await page.evaluate(tt => { window.render(tt); return document.querySelector('canvas').toDataURL('image/jpeg', 0.93); }, t); fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64')); };
  if (flag('--preview')) {
    const dir = path.join(OUT, NAME + '_preview'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const want = opt('--preview', '1');
    const times = want === 'lines' ? T.lines.map(l => +(l.t + (l.end - l.t) / 2).toFixed(2)) : want.split(',').map(Number);
    for (const t of times) await shot(t, path.join(dir, `t_${t.toFixed(2).padStart(6, '0')}.jpg`));
    fs.writeFileSync(path.join(dir, 'timing.json'), JSON.stringify({ D, lines: T.lines.map(({ wav, ...l }) => l) }, null, 1));
    console.log(`preview: ${times.length} stills in ${dir} (video would be ${D.toFixed(1)}s)`);
  } else {
    const fdir = path.join(WORK, 'frames'); fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir, { recursive: true });
    const N = Math.round(D * FPS), t0 = Date.now();
    console.log(`rendering ${NAME}: ${D.toFixed(1)}s, ${N} frames`);
    for (let i = 0; i < N; i++) { await shot(i / FPS, path.join(fdir, `f_${String(i).padStart(5, '0')}.jpg`)); if (i % 90 === 0) console.log(`  frame ${i}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
    const a = mix(info, T, D);
    const ass = path.join(WORK, 'caps.ass'); captions(info, T, D, ass);
    const out = path.join(OUT, NAME + '.mp4');
    ff(['-framerate', String(FPS), '-i', path.join(fdir, 'f_%05d.jpg'), '-i', a, '-vf', `subtitles=${ass.replace(/:/g, '\\:')},format=yuv420p`,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-maxrate', '8M', '-bufsize', '16M', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
    console.log('done:', out);
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e.stack || e.message || e); process.exit(1); });
