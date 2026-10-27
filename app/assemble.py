"""FFmpeg assembly: clips, captions, hook title, sound design, loudness."""
import subprocess, urllib.request
from pathlib import Path

W, H, FPS = 1080, 1920, 30

def _run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg failed:\n" + r.stderr[-2000:])

def _dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True).stdout
    return float(out.strip())

def _font(workdir):
    """Bold caption font baked into the container (FONT_DIR); falls back to DejaVu Sans."""
    import os
    fdir = Path(os.environ.get("FONT_DIR", "/app/fonts"))
    if fdir.exists():
        names = {p.name for p in fdir.glob("*.ttf") if p.stat().st_size > 10000}
        if "Montserrat-ExtraBold.ttf" in names:
            return fdir, "Montserrat ExtraBold"
        if any(n.startswith("Montserrat") for n in names):
            return fdir, "Montserrat"
    fdir = Path(workdir) / "fonts"
    fdir.mkdir(exist_ok=True)
    return fdir, "DejaVu Sans"

# Camera moves, cycled per shot (Zack D style slow push-ins / pulls / drifts)
MOVES = [
    ("1.0+0.18*on/{N}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),            # push in
    ("1.18-0.18*on/{N}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),           # pull out
    ("1.12", "iw/2-(iw/zoom/2)", "(ih-ih/zoom)*(1-on/{N})"),                # drift up
    ("1.0+0.22*on/{N}", "iw/2-(iw/zoom/2)", "ih/3-(ih/zoom/3)"),            # push in, upper
    ("1.12", "(iw-iw/zoom)*on/{N}", "ih/2-(ih/zoom/2)"),                    # drift sideways
]

WHOOSH = False         # swoosh sound on every cut
PUNCH_AFTER = 3.2      # seconds: AI clips longer than this get a punch-in cut in the middle


def _vstream_dur(path):
    """Length of the VIDEO track only. (The file length can be longer: Gemini Omni clips carry their own
    audio track, and using the file length here is what froze pictures before.)"""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=duration,nb_frames,r_frame_rate", "-of", "default=nw=1", str(path)],
                         capture_output=True, text=True).stdout
    kv = dict(l.split("=", 1) for l in out.splitlines() if "=" in l)
    try:
        return float(kv["duration"])
    except (KeyError, ValueError):
        pass
    try:
        n = float(kv["nb_frames"])
        a, b = kv["r_frame_rate"].split("/")
        return n / (float(a) / float(b))
    except (KeyError, ValueError, ZeroDivisionError):
        return _dur(path)


def _video_clip(video, audio, out, pad=0.12):
    """Fit an AI video clip to the narration length: trim, gently slow down, or play it forward-then-back
    (boomerang) when the line is much longer than the clip - never a frozen frame."""
    d = _dur(audio) + pad
    vd = _vstream_dur(video)
    src = "[0:v]setpts=PTS-STARTPTS"
    if vd * 1.35 < d:                                # too short even slowed down: boomerang doubles it
        src = "[0:v]setpts=PTS-STARTPTS,split[f0][r0];[r0]reverse[r1];[f0][r1]concat=n=2:v=1:a=0"
        vd *= 2
    speed, tail = "", ""
    if vd < d:
        f = min(d / vd, 1.35)                       # slow down at most 35%
        speed = f",setpts={f:.4f}*PTS"
        hold = max(0.0, d - vd * f)
        if hold > 0:
            tail = f",tpad=stop_mode=clone:stop_duration={hold + 0.1:.3f}"
    vf = (f"{src}{speed},fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,"
          f"crop={W}:{H},setsar=1{tail},format=yuv420p")
    if d > PUNCH_AFTER:                  # long shot: editor-style punch-in halfway so it never feels slow
        m = d * 0.5
        z = 1.18
        vchain = (f"{vf},split[p1][p2];[p1]trim=0:{m:.3f},setpts=PTS-STARTPTS[a1];"
                  f"[p2]trim={m:.3f},setpts=PTS-STARTPTS,scale={int(W*z)//2*2}:{int(H*z)//2*2}:flags=lanczos,"
                  f"crop={W}:{H},setsar=1[a2];[a1][a2]concat=n=2:v=1:a=0[v]")
    else:
        vchain = f"{vf}[v]"
    _run(["ffmpeg", "-y", "-i", str(video), "-i", str(audio),
          "-filter_complex", f"{vchain};[1:a]apad,atrim=0:{d:.3f},aresample=44100[a]",
          "-map", "[v]", "-map", "[a]", "-t", f"{d:.3f}",
          "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
          "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", str(out)])
    return d

def _shot_clip(i, image, audio, out, pad=0.12):
    d = _dur(audio) + pad
    n = int(round(d * FPS))
    z, x, y = [s.format(N=n) for s in MOVES[(i - 1) % len(MOVES)]]
    vf = (f"scale={W*2}:{H*2}:force_original_aspect_ratio=increase:flags=lanczos,"
          f"crop={W*2}:{H*2},"
          f"zoompan=z='{z}':x='{x}':y='{y}':d={n}:s={W}x{H}:fps={FPS},"
          f"format=yuv420p")
    _run(["ffmpeg", "-y", "-loop", "1", "-i", str(image), "-i", str(audio),
          "-filter_complex", f"[0:v]{vf}[v];[1:a]apad,atrim=0:{d:.3f},aresample=44100[a]",
          "-map", "[v]", "-map", "[a]", "-frames:v", str(n), "-t", f"{d:.3f}",
          "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
          "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", str(out)])
    return d

def _ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def _ass(words, font, path, hook_title="", watermark="", total=0.0, captions="pop", end_card="", end_sub=""):
    """Word-by-word pop captions: chunks of up to 2 words, active word highlighted yellow."""
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,3,2,60,60,560,1
Style: Clean,{font},82,&H00FFFFFF,&H00FFFFFF,&H00141414,&H78000000,-1,0,0,0,100,100,0,0,1,6,2,2,70,70,500,1
Style: EndBtn,{font},74,&H00141414,&H00141414,&H0030B8F2,&H0030B8F2,-1,0,0,0,100,100,1,0,3,22,0,5,80,80,0,1
Style: EndSub,{font},46,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,4,0,1,4,2,5,80,80,0,1
Style: Mark,{font},34,&H4DFFFFFF,&H4DFFFFFF,&H80000000,&H00000000,-1,0,0,0,100,100,3,0,1,2,0,9,50,60,150,1
Style: Hook,{font},118,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,2,0,1,9,5,8,70,70,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    if watermark and total > 0:            # small semi-transparent corner mark for the whole video
        wm = watermark.upper().replace("{", "").replace("}", "")
        lines.append(f"Dialogue: 2,0:00:00.00,{_ts(total)},Mark,,0,0,0,,{wm}")
    if end_card and total > 2.5:          # "FOLLOW FOR MORE" button over the final seconds
        last = words[-1][1] if words else total - 1.8
        st = min(max(last - 0.3, total - 2.2), total - 1.2)
        btn = end_card.upper().replace("{", "").replace("}", "")
        lines.append(f"Dialogue: 3,{_ts(st)},{_ts(total)},EndBtn,,0,0,0,,"
                     r"{\pos(540,1060)\fscx40\fscy40\t(0,160,\fscx112\fscy112)\t(160,260,\fscx100\fscy100)"
                     r"\t(700,850,\fscx106\fscy106)\t(850,1000,\fscx100\fscy100)}" + "  " + btn + "  ")
        if end_sub:
            sub = end_sub.upper().replace("{", "").replace("}", "")
            lines.append(f"Dialogue: 3,{_ts(st + 0.12)},{_ts(total)},EndSub,,0,0,0,,"
                         r"{\pos(540,950)\fad(200,0)}" + sub)
    if hook_title:
        t = hook_title.upper().replace("{", "").replace("}", "")
        ws = t.split()
        if len(ws) > 2:                      # break into two balanced lines
            mid = (len(ws) + 1) // 2
            t = " ".join(ws[:mid]) + r"\N" + " ".join(ws[mid:])
        if ws:
            pre, _, last = t.rpartition(ws[-1])
            t = pre + r"{\c&H00E5FF&}" + ws[-1] + r"{\c&HFFFFFF&}" + last
        lines.append(r"Dialogue: 1,0:00:00.00,0:00:01.70,Hook,,0,0,0,,"
                     r"{\fscx60\fscy60\t(0,120,\fscx108\fscy108)\t(120,220,\fscx100\fscy100)\fad(0,180)}" + t)
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) == (3 if captions == "clean" else 2) or w[2].rstrip().endswith((".", ",", "?", "!")):
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)
    for ci, ch in enumerate(chunks):
        nxt = chunks[ci + 1][0][0] if ci + 1 < len(chunks) else ch[-1][1] + 0.4
        if captions == "clean":            # calm subtitles: one phrase at a time, sentence case, no pop
            txt = " ".join(t.replace("{", "").replace("}", "") for _, _, t in ch).rstrip(",")
            lines.append(f"Dialogue: 0,{_ts(ch[0][0])},{_ts(max(nxt, ch[0][0] + 0.3))},Clean,,0,0,0,,{txt}")
            continue
        for wi, (s, e, _) in enumerate(ch):
            end = ch[wi + 1][0] if wi + 1 < len(ch) else nxt
            parts = []
            for wj, (_, _, t) in enumerate(ch):
                t = t.upper().replace("{", "").replace("}", "")
                parts.append(r"{\c&H00E5FF&}" + t + r"{\c&HFFFFFF&}" if wj == wi else t)
            pop = r"{\fscx80\fscy80\t(0,90,\fscx105\fscy105)\t(90,160,\fscx100\fscy100)}" if wi == 0 else ""
            lines.append(f"Dialogue: 0,{_ts(s)},{_ts(max(end, s + 0.05))},Cap,,0,0,0,,{pop}{' '.join(parts)}")
    Path(path).write_text(head + "\n".join(lines) + "\n", encoding="utf-8")

def _make_sfx(workdir, total):
    """Synthesized whoosh + soft ambient pad, so no external assets are needed."""
    wd = Path(workdir)
    whoosh = wd / "whoosh.wav"
    _run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anoisesrc=d=0.55:c=pink:a=0.6",
          "-af", "highpass=f=400,lowpass=f=5000,afade=t=in:d=0.3:curve=exp,afade=t=out:st=0.3:d=0.25,"
                 "aecho=0.6:0.4:40:0.3,volume=0.5,aresample=44100", "-ac", "2", str(whoosh)])
    pad = wd / "pad.wav"
    d = total + 1
    tones = "+".join(f"0.18*sin(2*PI*{f}*t)*(0.6+0.4*sin(2*PI*{lfo}*t))"
                     for f, lfo in [(110, 0.07), (164.81, 0.05), (220, 0.09), (261.63, 0.06), (329.63, 0.04)])
    _run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"aevalsrc='{tones}':s=44100:d={d:.2f}",
          "-af", f"lowpass=f=1200,aecho=0.8:0.7:120|240:0.35|0.25,afade=t=in:d=1.5,"
                 f"afade=t=out:st={max(0, d - 2.5):.2f}:d=2.5,volume=0.6", "-ac", "2", str(pad)])
    return whoosh, pad

def _vframes(path):
    """(video seconds, decoded frames) of a clip."""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
                          "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", str(path)],
                         capture_output=True, text=True).stdout.strip()
    try:
        f = int(out.split()[0])
    except (ValueError, IndexError):
        f = 0
    return f / FPS, f


def _freezes(path, min_s=2.0):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-map", "0:v", "-vf",
                          f"freezedetect=n=0.002:d={min_s}", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x.split("freeze_start:")[1].split()[0]) for x in out.splitlines() if "freeze_start:" in x]
    du = [float(x.split("freeze_duration:")[1].split()[0]) for x in out.splitlines() if "freeze_duration:" in x]
    return list(zip(st, du))


def build_short(shots, workdir, out_path, music=None, hook_title="", watermark="", captions="pop",
                end_card="", end_sub="", log=print):
    """shots: list of {image, video?, audio, words:[(start,end,text) relative to its own audio]}"""
    workdir = Path(workdir)
    clips, all_words, cuts, t0 = [], [], [], 0.0
    for i, s in enumerate(shots, 1):
        clip = workdir / f"clip_{i:02d}.mp4"
        pad = (1.7 if end_card else 0.8) if i == len(shots) else 0.12   # room for the last line + end card
        d = None
        if s.get("video"):
            try:
                d = _video_clip(s["video"], s["audio"], clip, pad=pad)
                vs, _ = _vframes(clip)
                if vs < d - 0.25:            # the AI clip didn't decode fully - never let the picture freeze
                    log(f"clip {i}: video only {vs:.1f}s of {d:.1f}s - using its still image instead")
                    d = None
            except Exception as e:
                log(f"clip {i}: couldn't edit the AI clip ({str(e)[-120:]}) - using its still image")
                d = None
        if d is None:
            d = _shot_clip(i, s["image"], s["audio"], clip, pad=pad)
            vs, _ = _vframes(clip)
            if vs < d - 0.25:
                raise RuntimeError(f"shot {i}: picture is {vs:.1f}s but the voice is {d:.1f}s")
        clips.append(clip)
        all_words += [(t0 + a, t0 + b, txt) for a, b, txt in s["words"]]
        if i > 1:
            cuts.append(t0)
        t0 += d
        print(f"  clip {i}: {d:.1f}s")
    lst = workdir / "clips.txt"
    lst.write_text("".join(f"file '{c.resolve()}'\n" for c in clips))
    joined = workdir / "joined.mp4"
    # Join by DECODING every clip (not stream-copy): AI clips and still-image clips have different encoder
    # headers, and copy-joining them made players drop every clip after the first.
    ins, parts = [], []
    for k, c in enumerate(clips):
        ins += ["-i", str(c)]
        parts.append(f"[{k}:v]setpts=PTS-STARTPTS,fps={FPS},scale={W}:{H},setsar=1,format=yuv420p[v{k}];"
                     f"[{k}:a]aresample=44100,asetpts=PTS-STARTPTS[a{k}]")
    cat = "".join(f"[v{k}][a{k}]" for k in range(len(clips))) + f"concat=n={len(clips)}:v=1:a=1[jv][ja]"
    _run(["ffmpeg", "-y", *ins, "-filter_complex", ";".join(parts) + ";" + cat, "-map", "[jv]", "-map", "[ja]",
          "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
          "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", str(joined)])

    fdir, font = _font(workdir)
    ass = workdir / "captions.ass"
    _ass(all_words, font, ass, hook_title, watermark, t0, captions, end_card, end_sub)
    ass_arg = str(ass).replace("\\", "/").replace(":", r"\:")
    fd_arg = str(fdir).replace("\\", "/").replace(":", r"\:")

    whoosh, pad = _make_sfx(workdir, t0)
    bed_in = ["-stream_loop", "-1", "-i", str(music)] if music and Path(music).exists() else ["-i", str(pad)]
    bed_vol = 0.18 if music and Path(music).exists() else 0.5
    n = len(cuts) if WHOOSH else 0                 # whoosh between shots: off (it sounded like "ssh" noise)
    fc = [f"[0:a]asplit=2[voice][sc]",
          f"[1:a]atrim=0:{t0:.3f},volume={bed_vol},afade=t=out:st={max(0, t0 - 1.5):.3f}:d=1.5[bedraw]",
          "[bedraw][sc]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350[bed]"]
    mix_inputs = "[voice][bed]"
    if n:
        fc.append(f"[2:a]asplit={n}" + "".join(f"[w{k}]" for k in range(n)) if n > 1 else "[2:a]anull[w0]")
        for k, c in enumerate(cuts):
            ms = int(max(0, c - 0.25) * 1000)
            fc.append(f"[w{k}]adelay={ms}|{ms}[wd{k}]")
        mix_inputs += "".join(f"[wd{k}]" for k in range(n))
    fc.append(f"{mix_inputs}amix=inputs={2 + n}:normalize=0:duration=first,"
              f"loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[aout]")
    fc.append(f"[0:v]subtitles='{ass_arg}':fontsdir='{fd_arg}'[vout]")
    _run(["ffmpeg", "-y", "-i", str(joined), *bed_in, *(["-i", str(whoosh)] if n else []),
          "-filter_complex", ";".join(fc), "-map", "[vout]", "-map", "[aout]",
          "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "7M", "-bufsize", "14M",
          "-pix_fmt", "yuv420p",
          "-c:a", "aac", "-b:a", "192k", "-t", f"{t0:.3f}", "-movflags", "+faststart", str(out_path)])
    print(f"  total: {t0:.1f}s")
    vs, _ = _vframes(out_path)
    if vs < t0 - 0.5:                              # never hand over a video whose picture stops early
        raise RuntimeError(f"final video check failed: picture {vs:.1f}s, sound {t0:.1f}s")
    holds = [(a, b) for a, b in _freezes(out_path) if a < t0 - 2.5]   # the end card hold is expected
    if holds:
        log("WARNING frozen picture at " + ", ".join(f"{a:.1f}s ({b:.1f}s long)" for a, b in holds))
    return out_path
