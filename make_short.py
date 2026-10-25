"""InsideYou Shorts generator - fetched and run by the Kaggle notebook on every run.
Edit settings in the notebook, not here. This file is updated from GitHub automatically."""
GENERATOR_VERSION = "2026-10-25.2"
print("Generator version:", GENERATOR_VERSION)
# ===================== DEFAULT SETTINGS (used only if your notebook doesn't set them) =====================
if "TOPIC" not in globals():
    TOPIC = ""            # e.g. "What happens to your body if you don't drink water for 3 days"
if "BRAND_CHARACTER" not in globals():
    BRAND_CHARACTER = ("a friendly young man in his mid-20s with short wavy dark-brown hair, light stubble, "
                       "warm brown eyes, wearing a plain mustard-yellow crew-neck t-shirt and dark jeans")
if "TOPIC_BANK" not in globals():
    TOPIC_BANK = [
        # --- your body ---
        "What happens inside your body when you hold in a sneeze",
        "Why your fingers get wrinkly in water",
        "What happens to your body when you stay awake for 3 days",
        "What happens inside your mouth when you eat something sour",
        "Why you get brain freeze from cold drinks",
        "What actually happens when you crack your knuckles",
        "What happens to your body when you jump into ice-cold water",
        "Why your stomach growls when you're hungry",
        "What happens inside your ear when you hear a loud bang",
        "What happens to your body when you hold your breath as long as you can",
        "Why you get goosebumps",
        "What happens to your eyes when you stare at your phone in the dark",
        "Why your leg falls asleep",
        "What happens inside your nose when you have a blocked nose",
        "What happens to your body when you drink too much water",
        "What caffeine actually does inside your brain",
        "What happens to a bruise as it heals",
        "Why you hiccup and how it stops",
        "What happens to your muscles after a hard workout",
        "What happens inside your body when you get a fever",
        "How your body heals a small cut",
        "What happens to your body when you skip breakfast",
        "Why your voice sounds different on a recording",
        "What happens to your teeth when you drink soda every day",
        "Why you yawn when you see someone else yawn",
        "What happens to your brain when you're about to fall asleep and feel like you're falling",
        "What happens to your body during a long-haul flight",
        "Why spicy food makes you sweat",
        # --- survival / what if ---
        "What happens if you fall into quicksand and how to escape",
        "What happens if you fall through ice into a frozen lake",
        "What happens to your body in space without a spacesuit",
        "What to do if your car goes into water",
        "What happens if you get struck by lightning",
        "How to survive a rip current at the beach",
        "What happens to your body at the top of Mount Everest",
        "What happens if an elevator cable snaps",
        "What happens to your body in extreme desert heat",
        "What happens if you swallow chewing gum",
        "How to survive if you get lost in a forest at night",
        "What happens to your body at the bottom of the ocean",
        "What happens if you get stung by a jellyfish",
        "What happens if you eat a ghost pepper",
        # --- how things work ---
        "How a vaccine teaches your body to fight a virus",
        "How an X-ray sees inside your body",
        "How a pacemaker keeps a heart beating",
        "How dental braces actually move your teeth",
        "How contact lenses fix your vision",
        "How a hearing aid works inside your ear",
        "How anesthesia puts you to sleep before surgery",
        "How a seatbelt saves you in a crash",
    ]
if "NUM_SHOTS" not in globals():
    NUM_SHOTS = 7         # 6-8 works best for a 35-50 second Short
if "VOICE" not in globals():
    VOICE = "en-US-AndrewNeural"   # calm male narrator. Others: en-US-GuyNeural, en-US-BrianNeural, en-GB-RyanNeural
if "VOICE_RATE" not in globals():
    VOICE_RATE = "+8%"    # a bit faster, Zack D pace
if "GCP_PROJECT" not in globals():
    GCP_PROJECT = "katha-tv-512618"
if "TEXT_MODEL_ID" not in globals():
    TEXT_MODEL_ID = "gemini-3.8-flash"
if "IMAGE_MODEL_ID" not in globals():
    IMAGE_MODEL_ID = "gemini-nano-banana-2.1"
if "VIDEO_MODEL_ID" not in globals():
    VIDEO_MODEL_ID = "gemini-omni-1.1-flash-preview"
if "ANIMATE" not in globals():
    ANIMATE = "all"      # "all" = every shot is real video (~Rs 380/Short), "hook" = only shot 1 (~Rs 45), "none" = zoom images only
if "VIDEO_WORKERS" not in globals():
    VIDEO_WORKERS = 3    # how many clips generate at the same time
if "REVIEW_BEFORE_VIDEO" not in globals():
    REVIEW_BEFORE_VIDEO = True   # pause after images so you can approve/redo shots before credits are spent on video
if "FACT_CHECK" not in globals():
    FACT_CHECK = True            # second Gemini pass verifies every claim and fixes wrong ones
if "BRAND_DATASET" not in globals():
    BRAND_DATASET = "shorts-brand"   # private Kaggle dataset that keeps hero_reference.png + used_topics.txt forever
if "MUSIC_FILE" not in globals():
    MUSIC_FILE = ""      # optional: path to your own background music mp3 (e.g. from a Kaggle dataset). "" = built-in soft ambient pad
if "STYLE" not in globals():
    STYLE = (
        "Clean stylized 3D render, smooth glossy materials, soft studio lighting, "
        "subtle rim light, shallow depth of field, cinematic medical-explainer look, "
        "simple uncluttered background, vibrant but realistic colors, high detail, "
        "vertical 9:16 composition, subject centered, no text, no letters, no watermark, "
        "any person is fully clothed, family-friendly"
    )

# ===================== VIDEO ASSEMBLY FUNCTIONS =====================
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
    """Bold caption font. Downloads Montserrat ExtraBold, falls back to DejaVu Sans."""
    fdir = Path(workdir) / "fonts"
    fdir.mkdir(exist_ok=True)
    f = fdir / "Montserrat-ExtraBold.ttf"
    if not f.exists():
        try:
            urllib.request.urlretrieve(
                "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-ExtraBold.ttf", f)
        except Exception:
            pass
    if f.exists() and f.stat().st_size > 10000:
        return fdir, "Montserrat ExtraBold"
    return fdir, "DejaVu Sans"

# Camera moves, cycled per shot (Zack D style slow push-ins / pulls / drifts)
MOVES = [
    ("1.0+0.18*on/{N}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),            # push in
    ("1.18-0.18*on/{N}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),           # pull out
    ("1.12", "iw/2-(iw/zoom/2)", "(ih-ih/zoom)*(1-on/{N})"),                # drift up
    ("1.0+0.22*on/{N}", "iw/2-(iw/zoom/2)", "ih/3-(ih/zoom/3)"),            # push in, upper
    ("1.12", "(iw-iw/zoom)*on/{N}", "ih/2-(ih/zoom/2)"),                    # drift sideways
]

def _video_clip(video, audio, out, pad=0.12):
    """Fit an AI video clip to the narration length: trim, gently slow down, or hold the last frame."""
    d = _dur(audio) + pad
    vd = _dur(video)
    speed = ""
    if vd < d:
        f = min(d / vd, 1.35)                       # slow down at most 35%
        speed = f"setpts={f:.4f}*PTS,"
        hold = max(0.0, d - vd * f)
        tail = f",tpad=stop_mode=clone:stop_duration={hold + 0.1:.3f}" if hold > 0 else ""
    else:
        tail = ""
    vf = (f"{speed}fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,"
          f"crop={W}:{H},setsar=1{tail},format=yuv420p")
    _run(["ffmpeg", "-y", "-i", str(video), "-i", str(audio),
          "-filter_complex", f"[0:v]{vf}[v];[1:a]apad,atrim=0:{d:.3f},aresample=44100[a]",
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

def _ass(words, font, path, hook_title=""):
    """Word-by-word pop captions: chunks of up to 2 words, active word highlighted yellow."""
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,3,2,60,60,560,1
Style: Hook,{font},118,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,2,0,1,9,5,8,70,70,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
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
        if len(cur) == 2 or w[2].rstrip().endswith((".", ",", "?", "!")):
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)
    for ci, ch in enumerate(chunks):
        nxt = chunks[ci + 1][0][0] if ci + 1 < len(chunks) else ch[-1][1] + 0.4
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

def build_short(shots, workdir, out_path, music=None, hook_title=""):
    """shots: list of {image, video?, audio, words:[(start,end,text) relative to its own audio]}"""
    workdir = Path(workdir)
    clips, all_words, cuts, t0 = [], [], [], 0.0
    for i, s in enumerate(shots, 1):
        clip = workdir / f"clip_{i:02d}.mp4"
        pad = 0.8 if i == len(shots) else 0.12      # let the last line breathe before the video ends
        if s.get("video"):
            d = _video_clip(s["video"], s["audio"], clip, pad=pad)
        else:
            d = _shot_clip(i, s["image"], s["audio"], clip, pad=pad)
        clips.append(clip)
        all_words += [(t0 + a, t0 + b, txt) for a, b, txt in s["words"]]
        if i > 1:
            cuts.append(t0)
        t0 += d
        print(f"  clip {i}: {d:.1f}s")
    lst = workdir / "clips.txt"
    lst.write_text("".join(f"file '{c.resolve()}'\n" for c in clips))
    joined = workdir / "joined.mp4"
    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)])

    fdir, font = _font(workdir)
    ass = workdir / "captions.ass"
    _ass(all_words, font, ass, hook_title)
    ass_arg = str(ass).replace("\\", "/").replace(":", r"\:")
    fd_arg = str(fdir).replace("\\", "/").replace(":", r"\:")

    whoosh, pad = _make_sfx(workdir, t0)
    bed_in = ["-stream_loop", "-1", "-i", str(music)] if music and Path(music).exists() else ["-i", str(pad)]
    bed_vol = 0.18 if music and Path(music).exists() else 0.5
    n = len(cuts)
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
    _run(["ffmpeg", "-y", "-i", str(joined), *bed_in, "-i", str(whoosh),
          "-filter_complex", ";".join(fc), "-map", "[vout]", "-map", "[aout]",
          "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
          "-c:a", "aac", "-b:a", "192k", "-t", f"{t0:.3f}", "-movflags", "+faststart", str(out_path)])
    print(f"  total: {t0:.1f}s")
    return out_path


# ===================== CELL 2: INSTALL =====================
import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-U", "edge-tts", "nest_asyncio"], check=True)

# ===================== CELL 3: CONNECT TO GEMINI (VERTEX, GLOBAL ENDPOINT) =====================
import os, json, re, asyncio, base64, time, math, shutil, requests
from pathlib import Path

def get_key():
    try:
        from kaggle_secrets import UserSecretsClient
        return UserSecretsClient().get_secret("VERTEX_API_KEY")
    except Exception:
        return os.environ["VERTEX_API_KEY"]

API_KEY = get_key()
URL_STYLES = [
    "https://aiplatform.googleapis.com/v1/projects/{p}/locations/global/publishers/google/models/{m}:generateContent",
    "https://aiplatform.googleapis.com/v1/publishers/google/models/{m}:generateContent",
]
_good_style = {}

def gemini(model, prompt, gen_cfg, extra_parts=None):
    parts = (extra_parts or []) + [{"text": prompt}]
    body = {"contents": [{"role": "user", "parts": parts}], "generationConfig": gen_cfg}
    styles = [_good_style[model]] if model in _good_style else URL_STYLES
    last = None
    for st in styles:
        url = st.format(p=GCP_PROJECT, m=model)
        for attempt in range(3):
            r = requests.post(url, headers={"x-goog-api-key": API_KEY, "Content-Type": "application/json"},
                              json=body, timeout=300)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(5 * (attempt + 1)); continue
            break
        if r.ok:
            _good_style[model] = st
            return r.json()
        last = f"{r.status_code}: {r.text[:300]}"
    raise RuntimeError(last)

def text_of(resp):
    parts = resp["candidates"][0]["content"]["parts"]
    return "".join(p.get("text", "") for p in parts if not p.get("thought"))

def first_working(models, test_fn):
    last = None
    for m in models:
        try:
            test_fn(m); return m
        except Exception as e:
            last = e; print("  skip", m, "->", str(e)[:150])
    raise RuntimeError(f"No working model found. Last error: {last}")

TEXT_MODEL = first_working([TEXT_MODEL_ID, "gemini-3.5-flash-lite"],
                           lambda m: gemini(m, "Say OK", {"maxOutputTokens": 50}))
print("Text model:", TEXT_MODEL)

# ===================== CELL 4: WRITE THE SCRIPT =====================
import random, glob
OUT = Path("/kaggle/working") if Path("/kaggle/working").exists() else Path("./out")
OUT.mkdir(parents=True, exist_ok=True)
BRAND_DIR = OUT / "brand"
BRAND_DIR.mkdir(exist_ok=True)

def _kaggle_creds():
    try:
        from kaggle_secrets import UserSecretsClient
        s = UserSecretsClient()
        return s.get_secret("KAGGLE_USERNAME"), s.get_secret("KAGGLE_KEY")
    except Exception:
        return None, None
KUSER, KKEY = _kaggle_creds()
if KUSER and KKEY:
    os.environ["KAGGLE_USERNAME"], os.environ["KAGGLE_KEY"] = KUSER, KKEY

def brand_pull():
    """Get the latest brand files: from the Kaggle API if possible, else from an attached dataset."""
    if KUSER and KKEY:
        r = subprocess.run(["kaggle", "datasets", "download", f"{KUSER}/{BRAND_DATASET}", "-p", str(BRAND_DIR),
                            "--unzip", "-o"], capture_output=True, text=True)
        print("brand files:", "loaded from your Kaggle dataset" if r.returncode == 0 else "none saved yet (first run)")
    for f in ("hero_reference.png", "used_topics.txt"):
        if not (BRAND_DIR / f).exists():
            hits = glob.glob(f"/kaggle/input/**/{f}", recursive=True)
            if hits:
                shutil.copy(hits[0], BRAND_DIR / f)

def brand_push():
    """Save brand files back to the private dataset so the mascot and topic history survive forever."""
    if not (KUSER and KKEY):
        print("tip: add KAGGLE_USERNAME + KAGGLE_KEY secrets to keep the mascot + topic history permanently")
        return
    meta = {"title": BRAND_DATASET, "id": f"{KUSER}/{BRAND_DATASET}", "licenses": [{"name": "CC0-1.0"}]}
    (BRAND_DIR / "dataset-metadata.json").write_text(json.dumps(meta))
    r = subprocess.run(["kaggle", "datasets", "version", "-p", str(BRAND_DIR), "-m", "update", "-q"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        r = subprocess.run(["kaggle", "datasets", "create", "-p", str(BRAND_DIR), "-q"], capture_output=True, text=True)
    print("brand files saved" if r.returncode == 0 else "brand save failed: " + (r.stderr or r.stdout)[-200:])

brand_pull()
USED_FILE = BRAND_DIR / "used_topics.txt"
used = set(USED_FILE.read_text().splitlines()) if USED_FILE.exists() else set()
if not TOPIC:
    fresh = [t for t in TOPIC_BANK if t not in used] or TOPIC_BANK
    TOPIC = random.choice(fresh)
print("Topic:", TOPIC)
SCRIPT_PROMPT = f"""You write viral 3D-animated explainer YouTube Shorts in the style of Zack D. Films.
Topic: {TOPIC}

Rules:
- Total narration 85-115 words, calm and fast, second person ("you").
- Shot 1 narration is the HOOK: 6-11 words. It must state a surprising claim that contradicts what most
  people believe, or a vivid "this is what happens when..." moment. Examples of the TONE (do not copy):
  "Your fingers aren't absorbing water. Your brain is doing this." / "This is what a sneeze does to your skull."
  Never start with "Did you know", "Have you ever", or a question.
- Exactly {NUM_SHOTS} shots. Each shot narration is 1-2 short sentences.
- Last shot is a satisfying payoff that ENDS WITH A COMPLETE SENTENCE (never stop mid-sentence or on words
  like "because", "and", "so"). Make the final line a clear, punchy conclusion that echoes the hook's idea.
  Its image uses the SAME framing, camera angle and setting as shot 1, so a replay feels smooth.
- hook_title: 2-5 punchy words in CAPS shown on screen for the first second (e.g. "YOUR BRAIN DID THIS").
- Facts must be accurate and mainstream-science; no medical advice, no gore.
- CAST: the lead is ALWAYS "Hero": {BRAND_CHARACTER}. Hero ALWAYS wears his exact outfit - never shirtless,
  never in a hospital gown, never changes clothes. For scans/X-ray/inside-the-body shots, show a transparent
  or cross-section view of his body WITH his t-shirt still visible, or show only the organ.
  Add other characters ONLY when the story needs them (a doctor, a friend, a lifeguard, a kid, an astronaut,
  a crowd...). Use as many or as few as the story needs - often just Hero. Give every extra character a short
  unique name and a fixed, very specific look (age, gender, hair, skin tone, outfit with colors) so they can be
  drawn identically in every shot. Background crowds don't need to be in the cast.
- For each shot list exactly which cast names appear in "characters" ([] for pure close-ups/cross-sections
  with no recognizable person). Characters can enter and leave between shots.
- image_prompt: describe ONE clear visual (subject, camera angle, what is highlighted/glowing, what each
  listed character is doing). Inside-the-body cross-sections are welcome. No text in images.
- SAFETY (the video model blocks these): every person is FULLY CLOTHED in every shot (keep their outfit),
  never show bathing/showering/undressed bodies, no blood/gore, no injuries, no weapons. For water topics show
  hands or a clothed person by water, or a cross-section instead.
- motion: what MOVES in that shot when animated (e.g. "heart beats twice, blood cells stream through the artery,
  camera slowly pushes in"). Physical, continuous, smooth motion. No text, nobody talks on screen.

Return ONLY JSON:
{{"title": "...", "hook_title": "...", "description": "2 lines for YouTube", "tags": ["..."],
  "cast": [{{"name": "Hero", "look": "..."}}, {{"name": "...", "look": "..."}}],
  "shots": [{{"narration": "...", "characters": ["Hero"], "image_prompt": "...", "motion": "..."}}]}}"""

raw = text_of(gemini(TEXT_MODEL, SCRIPT_PROMPT, {"responseMimeType": "application/json", "temperature": 0.9}))
script = json.loads(raw[raw.find("{"): raw.rfind("}") + 1])
if FACT_CHECK:
    FC_PROMPT = f"""You are a strict science fact-checker for a popular-science YouTube Short.
Check every factual claim in the narration and hook_title below against mainstream, well-established science.
- If a claim is wrong, exaggerated or a myth, rewrite ONLY that narration so it is accurate, keeping it short,
  punchy, in second person, and roughly the same length. Keep the hook surprising but TRUE.
- Do not change anything else (image_prompt, motion, characters, cast, number of shots).
Return ONLY JSON: {{"script": <the full corrected script object>, "changes": ["what you fixed and why", ...]}}

SCRIPT:
{json.dumps(script)}"""
    try:
        fc_raw = text_of(gemini(TEXT_MODEL, FC_PROMPT, {"responseMimeType": "application/json", "temperature": 0.2}))
        fc = json.loads(fc_raw[fc_raw.find("{"): fc_raw.rfind("}") + 1])
        fixed = fc.get("script") or {}
        if len(fixed.get("shots", [])) == len(script["shots"]):
            for s, f2 in zip(script["shots"], fixed["shots"]):
                s["narration"] = f2.get("narration", s["narration"])
            script["hook_title"] = fixed.get("hook_title", script.get("hook_title", ""))
        print("Fact-check:", "; ".join(fc.get("changes", [])) or "all claims OK")
    except Exception as e:
        print("Fact-check skipped:", str(e)[:120])

cast = {c["name"]: c["look"] for c in script.get("cast", []) if c.get("name")}
cast["Hero"] = BRAND_CHARACTER                       # the lead's look is always locked
script["cast"] = [{"name": k, "look": v} for k, v in cast.items()]
for s in script["shots"]:
    s["characters"] = [c for c in s.get("characters", []) if c in cast]
print("TITLE:", script["title"], "| HOOK:", script.get("hook_title", ""))
print("CAST:", ", ".join(cast))
for i, s in enumerate(script["shots"], 1):
    print(f"{i}. [{', '.join(s['characters']) or '-'}] {s['narration']}")

slug = re.sub(r"[^a-z0-9]+", "_", script["title"].lower()).strip("_")[:50] or "short"
WORK = OUT / f"work_{slug}"
WORK.mkdir(parents=True, exist_ok=True)
json.dump(script, open(WORK / "script.json", "w"), indent=2)

# ===================== CELL 5: CHARACTER SHEETS + SHOT IMAGES =====================
def gen_image(model, prompt, path, refs=None):
    """refs: list of (name, image_path) used as identity references."""
    extra = []
    refs = [(n, r) for n, r in (refs or []) if Path(r).exists()]
    if refs:
        for n, r in refs:
            extra.append({"inlineData": {"mimeType": "image/png", "data": base64.b64encode(Path(r).read_bytes()).decode()}})
        who = "; ".join(f"reference image {k+1} is {n}" for k, (n, _) in enumerate(refs))
        prompt = (f"Attached are character reference sheets ({who}). Draw each of these characters with EXACTLY the "
                  f"same face, hair, body and outfit as in their reference, in the same art style. "
                  f"Do not copy the reference pose or background. Create this NEW scene: " + prompt)
    resp = gemini(model, prompt, {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}, extra or None)
    for part in resp["candidates"][0]["content"]["parts"]:
        d = part.get("inlineData") or part.get("inline_data")
        if d and d.get("data"):
            Path(path).write_bytes(base64.b64decode(d["data"])); return
    raise RuntimeError("no image returned: " + json.dumps(resp)[:200])

def sheet_path(name):
    return WORK / f"cast_{re.sub(r'[^A-Za-z0-9]+', '_', name)}.png"

def sheet_prompt(name, look):
    return (f"Character reference sheet of ONE person: {look}. Full body, standing, front view, neutral friendly "
            f"expression, arms relaxed, plain light-grey background, nothing else in frame. {STYLE}")

def full_prompt(s):
    who = " ".join(f"{n}: {cast[n]}." for n in s["characters"])
    lock = (" Every character is fully dressed in EXACTLY the outfit from their reference sheet - "
            "never shirtless, never undressed, never in different clothes.") if who else ""
    return f"{s['image_prompt']}. {('Characters in this shot - ' + who + lock + ' ') if who else ''}{STYLE}"

def refs_for(s):
    refs = [(n, sheet_path(n)) for n in s["characters"]]
    if s is script["shots"][-1] or s.get("_is_last"):
        refs.append(("the FIRST shot of this video - copy its exact framing, camera angle and setting so the video loops",
                     WORK / "shot_01.png"))
    return refs

# Hero's sheet is reused across videos, so the mascot looks the same on every upload
HERO_SHEET = BRAND_DIR / "hero_reference.png"
IMAGE_MODEL = first_working(
    [IMAGE_MODEL_ID, "gemini-3.1-flash-image"],
    lambda m: HERO_SHEET.exists() or gen_image(m, sheet_prompt("Hero", BRAND_CHARACTER), HERO_SHEET))
print("Image model:", IMAGE_MODEL)
shutil.copy(HERO_SHEET, sheet_path("Hero"))

needed = {n for s in script["shots"] for n in s["characters"]} - {"Hero"}
for n in needed:
    for attempt in range(3):
        try:
            gen_image(IMAGE_MODEL, sheet_prompt(n, cast[n]), sheet_path(n)); break
        except Exception as e:
            print(f"  sheet {n} retry {attempt+1}: {str(e)[:100]}")
    print("character sheet:", n, "done" if sheet_path(n).exists() else "FAILED")

script["shots"][-1]["_is_last"] = True
def make_shot_image(i, s):
    p = WORK / f"shot_{i:02d}.png"
    for attempt in range(3):
        try:
            gen_image(IMAGE_MODEL, full_prompt(s), p, refs=refs_for(s)); return True
        except Exception as e:
            print(f"  shot {i} retry {attempt+1}: {str(e)[:100]}")
    return False

for i, s in enumerate(script["shots"], 1):
    p = WORK / f"shot_{i:02d}.png"
    if p.exists():
        print("image", i, "done"); continue
    for attempt in range(3):
        try:
            gen_image(IMAGE_MODEL, full_prompt(s), p, refs=refs_for(s)); break
        except Exception as e:
            print(f"  shot {i} retry {attempt+1}: {str(e)[:100]}")
    print("image", i, "done" if p.exists() else "FAILED")

# ===================== CELL 6: REVIEW IMAGES BEFORE SPENDING CREDITS ON VIDEO =====================
from IPython.display import display, Image as IPImage, HTML
from PIL import Image as PILImage

def show_grid():
    files = [WORK / f"shot_{i:02d}.png" for i in range(1, len(script["shots"]) + 1)]
    thumbs = [PILImage.open(f).convert("RGB").resize((216, 384)) if f.exists() else PILImage.new("RGB", (216, 384), "black")
              for f in files]
    grid = PILImage.new("RGB", (226 * len(thumbs), 420), "white")
    from PIL import ImageDraw
    d = ImageDraw.Draw(grid)
    for k, t in enumerate(thumbs):
        grid.paste(t, (226 * k + 5, 30))
        d.text((226 * k + 100, 8), str(k + 1), fill="black")
    grid.save(WORK / "preview_grid.jpg", quality=85)
    display(IPImage(filename=str(WORK / "preview_grid.jpg")))
    for k, s in enumerate(script["shots"], 1):
        print(f"{k}. {s['narration']}")

n_anim = 0 if ANIMATE == "none" else (1 if ANIMATE == "hook" else len(script["shots"]))
if REVIEW_BEFORE_VIDEO and n_anim:
    while True:
        show_grid()
        print(f"\nNext step animates {n_anim} shot(s) ≈ Rs {n_anim * 55}.")
        try:
            ans = input("Type  y = go ahead   |   2 5 = redo those shot images   |   n = stop here : ").strip().lower()
        except Exception:
            print("(no interactive input in this mode - continuing automatically)"); break
        if ans in ("y", "yes", ""):
            break
        if ans in ("n", "no", "stop"):
            raise SystemExit("Stopped before video generation. No video credits spent.")
        for tok in re.findall(r"\d+", ans):
            k = int(tok)
            if 1 <= k <= len(script["shots"]):
                (WORK / f"shot_{k:02d}.png").unlink(missing_ok=True)
                ok = make_shot_image(k, script["shots"][k - 1])
                print("redid shot", k, "ok" if ok else "FAILED")

# ===================== CELL 7: VOICEOVER (with word timings for captions) =====================
import edge_tts, subprocess

async def tts_shot(text, mp3_path):
    words = []
    comm = edge_tts.Communicate(text, VOICE, rate=VOICE_RATE, boundary="WordBoundary")
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append((chunk["offset"] / 1e7, (chunk["offset"] + chunk["duration"]) / 1e7, chunk["text"]))
    return words

def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True).stdout
    return float(out.strip())

async def all_tts():
    res = []
    for i, s in enumerate(script["shots"], 1):
        mp3 = WORK / f"voice_{i:02d}.mp3"
        res.append((mp3, await tts_shot(s["narration"], mp3)))
    return res

loop = asyncio.get_event_loop()
if loop.is_running():          # Jupyter / Kaggle
    import nest_asyncio; nest_asyncio.apply()
tts = loop.run_until_complete(all_tts())
print("voice done")

# ===================== CELL 8: ANIMATE SHOTS INTO REAL VIDEO (GEMINI OMNI) =====================
from concurrent.futures import ThreadPoolExecutor

INTERACT_URL = f"https://aiplatform.googleapis.com/v1beta1/projects/{GCP_PROJECT}/locations/global/interactions"

# The video API needs an OAuth token (API keys are rejected), so we use a service account key.
import threading
import google.auth.transport.requests as _gtr
from google.oauth2 import service_account as _sa, credentials as _uc
def _load_creds():
    from kaggle_secrets import UserSecretsClient
    sec = UserSecretsClient()
    for name in ("GCP_SA_KEY", "GCP_ADC"):
        try:
            info = json.loads(sec.get_secret(name))
        except Exception:
            continue
        scopes = ["https://www.googleapis.com/auth/cloud-platform"]
        if info.get("type") == "service_account":
            return _sa.Credentials.from_service_account_info(info, scopes=scopes)
        return _uc.Credentials.from_authorized_user_info(info, scopes=scopes)
    raise RuntimeError("Add Kaggle secret GCP_SA_KEY (service account JSON) to enable video generation")
_creds, _lock = _load_creds(), threading.Lock()
def hdrs():
    with _lock:
        if not _creds.valid:
            _creds.refresh(_gtr.Request())
        return {"Content-Type": "application/json", "Authorization": "Bearer " + _creds.token}

def _image_variants(img_b64):
    return [
        {"type": "image", "data": img_b64, "mime_type": "image/png"},
        {"type": "image", "image": {"data": img_b64, "mime_type": "image/png"}},
        {"type": "image", "inline_data": {"data": img_b64, "mime_type": "image/png"}},
    ]
_img_fmt = {"idx": None}

def _extract_video(js):
    for step in js.get("steps", []) or []:
        for c in step.get("content", []) or []:
            if c.get("type") == "video":
                if c.get("data"):
                    return base64.b64decode(c["data"])
                uri = c.get("uri") or c.get("url")
                if uri:
                    return requests.get(uri, headers=hdrs(), timeout=600).content
    return None

class ContentBlocked(Exception):
    pass

def omni_video(prompt, img_path, out_path):
    img_b64 = base64.b64encode(Path(img_path).read_bytes()).decode() if img_path else None
    variants = [None] if not img_b64 else (
        [_image_variants(img_b64)[_img_fmt["idx"]]] if _img_fmt["idx"] is not None else _image_variants(img_b64))
    last = None
    for vi, img_part in enumerate(variants):
        inp = ([img_part] if img_part else []) + [{"type": "text", "text": prompt}]
        body = {"model": VIDEO_MODEL, "input": inp}
        for attempt in range(3):
            r = requests.post(INTERACT_URL, headers=hdrs(), json=body, timeout=1200)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(15 * (attempt + 1)); continue
            break
        if not r.ok:
            last = f"{r.status_code}: {r.text[:300]}"
            if r.status_code == 400 and ("content_blocked" in r.text or "policy" in r.text.lower()):
                raise ContentBlocked(last)
            if r.status_code == 400 and img_part:   # wrong image format -> try next variant
                continue
            raise RuntimeError(last)
        js = r.json()
        t0 = time.time()
        while js.get("status") not in ("completed", "failed", "cancelled") and time.time() - t0 < 1200:
            time.sleep(10)
            js = requests.get(f"{INTERACT_URL}/{js['id']}", headers=hdrs(), timeout=120).json()
        data = _extract_video(js)
        if not data:
            last = "no video in response: " + json.dumps(js)[:300]
            raise RuntimeError(last)
        Path(out_path).write_bytes(data)
        if img_part and _img_fmt["idx"] is None:
            _img_fmt["idx"] = _image_variants(img_b64).index(img_part)
        return
    raise RuntimeError(last)

def video_prompt(s, secs):
    return (f"Animate this exact image into a smooth {secs}-second shot. {s.get('motion', '')} "
            f"Keep the same 3D style, colors and composition as the image. Continuous fluid motion, "
            f"slow cinematic camera movement, vertical 9:16, 720p. "
            f"No text, no captions, no on-screen words, no logos, no people talking.")

VIDEO_MODEL = VIDEO_MODEL_ID
to_animate = [] if ANIMATE == "none" else ([1] if ANIMATE == "hook" else list(range(1, len(script["shots"]) + 1)))

def do_clip(i):
    s = script["shots"][i - 1]
    out = WORK / f"omni_{i:02d}.mp4"
    if out.exists():
        return i, "cached"
    secs = max(4, min(10, math.ceil(duration(WORK / f"voice_{i:02d}.mp3") + 0.3)))
    img = WORK / f"shot_{i:02d}.png"
    try:
        omni_video(video_prompt(s, secs), img if img.exists() else None, out)
        return i, "ok"
    except ContentBlocked:
        # make a safer version of this shot's image and try once more
        try:
            safe = dict(s, image_prompt=s["image_prompt"] + ". Fully clothed, modest, family-friendly, "
                        "no bathing, no bare skin except hands and face, calm and non-violent.")
            gen_image(IMAGE_MODEL, full_prompt(safe), img, refs=refs_for(safe))
            omni_video(video_prompt(safe, secs), img, out)
            return i, "ok (after safer image)"
        except Exception as e:
            return i, "FAILED (will use zoom image): " + str(e)[:200]
    except Exception as e:
        return i, "FAILED (will use zoom image): " + str(e)[:200]

if to_animate:
    # first clip alone, so the working request format is learned before going parallel
    print("clip", *do_clip(to_animate[0]))
    with ThreadPoolExecutor(VIDEO_WORKERS) as ex:
        for i, status in ex.map(do_clip, to_animate[1:]):
            print("clip", i, status)

# ===================== CELL 9: ASSEMBLE THE SHORT =====================

shots = []
for i, (mp3, words) in enumerate(tts, 1):
    img = WORK / f"shot_{i:02d}.png"
    if not img.exists():   # fall back to previous image if one failed
        img = WORK / f"shot_{i-1:02d}.png" if i > 1 else next(WORK.glob("shot_*.png"))
    vid = WORK / f"omni_{i:02d}.mp4"
    shots.append({"image": img, "video": vid if vid.exists() else None, "audio": mp3, "words": words})

final = build_short(shots, WORK, OUT / f"{slug}.mp4", music=MUSIC_FILE or None, hook_title=script.get("hook_title", ""))
(OUT / f"{slug}_upload.txt").write_text(
    f"{script['title']} #shorts\n\n{script['description']}\n\n" + " ".join("#" + t.replace(" ", "") for t in script["tags"]))
with open(USED_FILE, "a") as f:
    f.write(TOPIC + "\n")
brand_push()
print("DONE ->", final)
