"""The Short-making steps. Each step reads/writes a job folder in storage, so steps can run in separate
Cloud Run Job executions and the web app only ever reads state.json."""
import json
import math
import random
import re
import shutil
import subprocess
import tempfile
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from . import ai
from . import config as C
from .assemble import build_short
from .store import Store

RUNNING_STAGES = {"queued", "scripting", "imaging", "animating"}


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%S")


def new_job_id():
    return time.strftime("%Y%m%d-%H%M%S") + "-" + "".join(random.choice("abcdefghjkmnpqrstuvwxyz23456789")
                                                         for _ in range(3))


def estimate_rs(num_shots, animate):
    n = 0 if animate == "none" else (1 if animate == "hook" else num_shots)
    return C.RS_BASE + n * C.RS_PER_ANIMATED_SHOT


class Job:
    def __init__(self, store: Store, jid: str):
        self.store, self.id = store, jid
        self.prefix = f"jobs/{jid}/"
        self.dir = Path(tempfile.gettempdir()) / "jobs" / jid
        self.state = store.read_json(self.prefix + "state.json") or {}
        self._lock = threading.RLock()

    # ----- sync -----
    def pull(self):
        self.store.download_prefix(self.prefix, self.dir)

    def put(self, name):
        self.store.upload_file(self.dir / name, self.prefix + name)

    def save(self, **kw):
        with self._lock:
            self.state.update(kw)
            self.state["updated"] = now()
            self.store.write_json(self.prefix + "state.json", self.state)

    def log(self, msg):
        print(msg, flush=True)
        logs = self.state.setdefault("logs", [])
        logs.append(f"{time.strftime('%H:%M:%S')}  {msg}")
        self.state["logs"] = logs[-60:]
        self.save(status=msg)

    def script(self):
        p = self.dir / "script.json"
        return json.loads(p.read_text()) if p.exists() else None

    def save_script(self, sc):
        (self.dir / "script.json").write_text(json.dumps(sc, indent=1))
        self.put("script.json")


# ====================================================================== brand
def brand_used(store):
    b = store.read_bytes("brand/used_topics.txt")
    return set(b.decode().splitlines()) if b else set()


def brand_mark_used(store, topic):
    used = brand_used(store)
    used.add(topic)
    store.write_bytes("brand/used_topics.txt", "\n".join(sorted(used)).encode(), "text/plain")


# ====================================================================== step 1: script
def _script_prompt(topic, num_shots):
    return f"""You write viral 3D-animated explainer YouTube Shorts in the style of Zack D. Films.
Topic: {topic}

Rules:
- Total narration 85-115 words, calm and fast, second person ("you").
- Shot 1 narration is the HOOK: 6-11 words. It must state a surprising claim that contradicts what most
  people believe, or a vivid "this is what happens when..." moment. Examples of the TONE (do not copy):
  "Your fingers aren't absorbing water. Your brain is doing this." / "This is what a sneeze does to your skull."
  Never start with "Did you know", "Have you ever", or a question.
- Exactly {num_shots} shots. Each shot narration is 1-2 short sentences.
- Last shot is a satisfying payoff that ENDS WITH A COMPLETE SENTENCE (never stop mid-sentence or on words
  like "because", "and", "so"). Make the final line a clear, punchy conclusion that echoes the hook's idea.
  Its image uses the SAME framing, camera angle and setting as shot 1, so a replay feels smooth.
- hook_title: 2-5 punchy words in CAPS shown on screen for the first second (e.g. "YOUR BRAIN DID THIS").
- Facts must be accurate and mainstream-science; no medical advice, no gore.
- CAST: the lead is ALWAYS "Hero": {C.BRAND_CHARACTER}. Hero ALWAYS wears his exact outfit - never shirtless,
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


def _fact_check(script):
    prompt = f"""You are a strict science fact-checker for a popular-science YouTube Short.
Check every factual claim in the narration and hook_title below against mainstream, well-established science.
- If a claim is wrong, exaggerated or a myth, rewrite ONLY that narration so it is accurate, keeping it short,
  punchy, in second person, and roughly the same length. Keep the hook surprising but TRUE.
- Do not change anything else (image_prompt, motion, characters, cast, number of shots).
Return ONLY JSON: {{"script": <the full corrected script object>, "changes": ["what you fixed and why", ...]}}

SCRIPT:
{json.dumps(script)}"""
    fc = ai.text_json(prompt, temperature=0.2)
    fixed = fc.get("script") or {}
    if len(fixed.get("shots", [])) == len(script["shots"]):
        for s, f2 in zip(script["shots"], fixed["shots"]):
            s["narration"] = f2.get("narration", s["narration"])
        script["hook_title"] = fixed.get("hook_title", script.get("hook_title", ""))
    return fc.get("changes", [])


def step_script(job: Job):
    st = job.state
    topic = st.get("topic") or ""
    if not topic:
        used = brand_used(job.store)
        topic = random.choice([t for t in C.TOPIC_BANK if t not in used] or C.TOPIC_BANK)
    job.save(stage="scripting", topic=topic)
    job.log(f"Writing script: {topic}")
    sc = ai.text_json(_script_prompt(topic, st.get("num_shots", 7)))
    job.log("Fact-checking every claim...")
    try:
        changes = _fact_check(sc)
    except Exception as e:
        changes = [f"fact-check skipped: {str(e)[:100]}"]
    cast = {c["name"]: c["look"] for c in sc.get("cast", []) if c.get("name")}
    cast["Hero"] = C.BRAND_CHARACTER
    sc["cast"] = [{"name": k, "look": v} for k, v in cast.items()]
    for s in sc["shots"]:
        s["characters"] = [c for c in s.get("characters", []) if c in cast]
    sc["fact_check"] = changes or ["all claims OK"]
    job.dir.mkdir(parents=True, exist_ok=True)
    job.save_script(sc)
    # a fresh script makes old images/clips stale
    for name in job.store.list_names(job.prefix):
        if re.match(r"(shot_|omni_|cast_|voice_|final|upload)", name):
            job.store.delete(job.prefix + name)
            (job.dir / name).unlink(missing_ok=True)
    job.log("Script ready")
    job.save(stage="script_ready", title=sc.get("title", ""), images=[], clips={})


# ====================================================================== step 2: images
def _cast(sc):
    return {c["name"]: c["look"] for c in sc["cast"]}


def _sheet_name(name):
    return f"cast_{re.sub(r'[^A-Za-z0-9]+', '_', name)}.png"


def _sheet_prompt(look):
    return (f"Character reference sheet of ONE person: {look}. Full body, standing, front view, neutral friendly "
            f"expression, arms relaxed, plain light-grey background, nothing else in frame. {C.STYLE}")


def _shot_prompt(sc, s):
    cast = _cast(sc)
    who = " ".join(f"{n}: {cast[n]}." for n in s["characters"])
    lock = (" Every character is fully dressed in EXACTLY the outfit from their reference sheet - "
            "never shirtless, never undressed, never in different clothes.") if who else ""
    return f"{s['image_prompt']}. {('Characters in this shot - ' + who + lock + ' ') if who else ''}{C.STYLE}"


def _refs(job, sc, i):
    s = sc["shots"][i - 1]
    refs = [(n, job.dir / _sheet_name(n)) for n in s["characters"]]
    if i == len(sc["shots"]) and i > 1:
        refs.append(("the FIRST shot of this video - copy its exact framing, camera angle and setting",
                     job.dir / "shot_01.png"))
    return refs


def _valid(p):
    return p.exists() and p.stat().st_size > 1000


def _make_shot(job, sc, i):
    p = job.dir / f"shot_{i:02d}.png"
    last = None
    for attempt in range(3):
        try:
            ai.image(_shot_prompt(sc, sc["shots"][i - 1]), p, refs=_refs(job, sc, i))
            job.put(p.name)
            return True
        except Exception as e:
            last = e
            job.log(f"shot {i} retry {attempt + 1}: {str(e)[:120]}")
    job.log(f"shot {i} FAILED: {str(last)[:150]}")
    return False


def step_images(job: Job, redo=None):
    sc = job.script()
    job.save(stage="imaging")
    cast = _cast(sc)
    # mascot reference is shared by every video
    hero = job.dir / _sheet_name("Hero")
    data = job.store.read_bytes("brand/hero_reference.png")
    if data:
        hero.write_bytes(data)
    else:
        job.log("Creating the mascot reference (first video only)...")
        ai.image(_sheet_prompt(C.BRAND_CHARACTER), hero)
        job.store.upload_file(hero, "brand/hero_reference.png")
    job.put(hero.name)
    needed = {n for s in sc["shots"] for n in s["characters"]} - {"Hero"}
    for n in needed:
        p = job.dir / _sheet_name(n)
        if not _valid(p):
            job.log(f"Drawing character sheet: {n}")
            ai.image(_sheet_prompt(cast[n]), p)
            job.put(p.name)
    todo = redo or [i for i in range(1, len(sc["shots"]) + 1) if not _valid(job.dir / f"shot_{i:02d}.png")]
    # shot 1 first: the last shot copies its framing
    for i in sorted(todo):
        job.log(f"Drawing shot {i} of {len(sc['shots'])}")
        _make_shot(job, sc, i)
    imgs = [i for i in range(1, len(sc["shots"]) + 1) if _valid(job.dir / f"shot_{i:02d}.png")]
    job.log("Images ready - review them" if len(imgs) == len(sc["shots"]) else "Some images failed - redo them")
    job.save(stage="images_ready", images=imgs)


# ====================================================================== step 3: voice + video + assembly
def _dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True).stdout
    return float(out.strip())


def _video_prompt(s, secs):
    return (f"Animate this exact image into a smooth {secs}-second shot. {s.get('motion', '')} "
            f"Keep the same 3D style, colors, characters, outfits and composition as the image. Continuous fluid "
            f"motion, slow cinematic camera movement, vertical 9:16, 720p. "
            f"No text, no captions, no on-screen words, no logos, no people talking.")


def step_video(job: Job):
    sc = job.script()
    n = len(sc["shots"])
    job.save(stage="animating", clips=job.state.get("clips") or {})
    job.log("Recording narration...")
    words = {}
    for i, s in enumerate(sc["shots"], 1):
        words[i] = ai.voice(s["narration"], job.dir / f"voice_{i:02d}.mp3")
    animate = job.state.get("animate", "all")
    targets = [] if animate == "none" else ([1] if animate == "hook" else list(range(1, n + 1)))
    clips = job.state.get("clips") or {}

    def do_clip(i):
        s = sc["shots"][i - 1]
        out = job.dir / f"omni_{i:02d}.mp4"
        if _valid(out):
            return i, "ok"
        clips[str(i)] = "animating"
        job.save(clips=clips)
        secs = max(4, min(10, math.ceil(_dur(job.dir / f"voice_{i:02d}.mp3") + 0.3)))
        img = job.dir / f"shot_{i:02d}.png"
        try:
            ai.video(_video_prompt(s, secs), img, out)
            job.put(out.name)
            return i, "ok"
        except ai.ContentBlocked:
            try:
                job.log(f"clip {i} blocked by safety filter - making a safer image and retrying")
                safe = dict(s, image_prompt=s["image_prompt"] + ". Fully clothed, modest, family-friendly, no "
                            "bathing, no bare skin except hands and face, calm and non-violent.")
                sc2 = dict(sc, shots=[safe if k == i - 1 else x for k, x in enumerate(sc["shots"])])
                ai.image(_shot_prompt(sc2, safe), img, refs=_refs(job, sc2, i))
                job.put(img.name)
                ai.video(_video_prompt(safe, secs), img, out)
                job.put(out.name)
                return i, "ok"
            except Exception as e:
                return i, "zoom (" + str(e)[:80] + ")"
        except Exception as e:
            return i, "zoom (" + str(e)[:80] + ")"

    def mark(i, status):
        clips[str(i)] = status
        job.save(clips=clips)
        job.log(f"clip {i}: {status}")

    if targets:
        for i in targets:
            clips.setdefault(str(i), "waiting")
        job.save(clips=clips)
        job.log(f"Animating {len(targets)} shot(s) with Gemini Omni...")
        mark(*do_clip(targets[0]))          # first alone: learns the request format
        with ThreadPoolExecutor(C.VIDEO_WORKERS) as ex:
            for i, status in ex.map(do_clip, targets[1:]):
                mark(i, status)

    job.log("Editing: captions, hook title, sound, loudness...")
    shots = []
    for i in range(1, n + 1):
        img = job.dir / f"shot_{i:02d}.png"
        if not _valid(img):
            img = next(p for p in sorted(job.dir.glob("shot_*.png")) if _valid(p))
        vid = job.dir / f"omni_{i:02d}.mp4"
        shots.append({"image": img, "video": vid if _valid(vid) else None,
                      "audio": job.dir / f"voice_{i:02d}.mp3", "words": words[i]})
    work = job.dir / "edit"
    work.mkdir(exist_ok=True)
    build_short(shots, work, job.dir / "final.mp4", hook_title=sc.get("hook_title", ""))
    job.put("final.mp4")
    upload = (f"{sc['title']} #shorts\n\n{sc.get('description', '')}\n\n"
              + " ".join("#" + t.replace(" ", "") for t in sc.get("tags", [])))
    (job.dir / "upload.txt").write_text(upload)
    job.put("upload.txt")
    brand_mark_used(job.store, job.state.get("topic", ""))
    job.log("Done! Your Short is ready")
    job.save(stage="done", clips=clips)


# ====================================================================== runner
STEPS = {"script": step_script, "images": step_images, "video": step_video}


def run(store: Store, jid: str, step: str, arg: str = ""):
    job = Job(store, jid)
    try:
        job.pull()
        if step == "auto":
            step_script(job)
            step_images(job)
            step_video(job)
        elif step == "images" and arg:
            step_images(job, redo=[int(x) for x in arg.split(",") if x.strip().isdigit()])
        else:
            STEPS[step](job)
    except Exception as e:
        traceback.print_exc()
        job.state.setdefault("logs", []).append(f"{time.strftime('%H:%M:%S')}  ERROR: {str(e)[:300]}")
        job.save(stage="failed", failed_step=step, error=str(e)[:500], status="Failed: " + str(e)[:150])
    finally:
        shutil.rmtree(job.dir, ignore_errors=True)
