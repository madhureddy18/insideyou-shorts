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
from . import seo as seo_mod
from . import config as C
from .assemble import build_short
from .store import Store

RUNNING_STAGES = {"queued", "scripting", "imaging", "animating"}


class Cancelled(BaseException):
    """Raised inside a worker when the user pressed Cancel (BaseException so generic handlers don't swallow it)."""


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
        self.run_id = self.state.get("run_id")
        self._lock = threading.RLock()

    # ----- sync -----
    def pull(self):
        self.store.download_prefix(self.prefix, self.dir)

    def put(self, name):
        self.store.upload_file(self.dir / name, self.prefix + name)

    def check(self):
        """Stop if the user cancelled (or a newer run replaced this one)."""
        remote = self.store.read_json(self.prefix + "state.json") or {}
        if remote.get("run_id") != self.run_id:
            raise Cancelled()

    def save(self, **kw):
        """Update state.json. Log-only updates are batched (GCS allows ~1 write/second per file);
        real state changes are written straight away."""
        with self._lock:
            self.check()
            self.state.update(kw)
            self.state["updated"] = now()
            if set(kw) - {"status"}:
                self._flush()
            elif not getattr(self, "_timer", None):
                wait = max(0.0, 2.0 - (time.time() - getattr(self, "_last_write", 0)))
                self._timer = threading.Timer(wait, self._timed_flush)
                self._timer.daemon = True
                self._timer.start()

    def _timed_flush(self):
        try:
            with self._lock:
                if getattr(self, "_timer", None):
                    self.check()            # never overwrite a cancel or a newer run
                    self._flush()
        except Exception as e:
            print("state save skipped:", str(e)[:120], flush=True)

    def _flush(self):
        with self._lock:
            t = getattr(self, "_timer", None)
            if t:
                t.cancel()
                self._timer = None
            gap = time.time() - getattr(self, "_last_write", 0)
            if gap < 1.1:
                time.sleep(1.1 - gap)
            self.store.write_json(self.prefix + "state.json", self.state)
            self._last_write = time.time()

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
def hero_face(store):
    d = store.read_json(C.HERO_DESC_KEY) or {}
    return d.get("description") or C.HERO_FACE


BRIGHT_RULES = f"""- VISUAL STYLE: a bright, clean, toy-like 3D world - glossy plastic, clay and chrome materials, saturated
  colors, bright sky-blue or pastel studio backdrops, high-key soft light. Show invisible things (heat,
  magnetism, electricity, sound waves, nerve signals, pressure) as glowing neon lines, rings or particles.
- CAMERA: every shot is ONE continuous camera move - extreme macro close-ups, slow push-ins, orbits, or flying
  THROUGH things (into a joint, inside a device, between particles). Shallow depth of field. Say the move in
  "motion".
- PEOPLE: the objects and the process are the stars. Show mainly realistic HANDS interacting with things (Hero's
  hands, with his sleeves matching his outfit, so put "Hero" in characters). Show Hero's face in at most 2 shots.
- BRANDING here: put "{C.BRAND_TEXT}" on 1-2 objects only, like a real product logo (a box, machine, packaging,
  a sign), always where it fits naturally. Never the same object twice, and screens stay normal (no logo on a
  phone/TV screen in more than one shot)."""

CINEMATIC_RULES = """- VISUAL STYLE: cinematic, realistic medical-explainer 3D with dramatic lighting and inside-the-body views."""


def _script_prompt(topic, num_shots, face=None, look_name=None):
    face = face or C.HERO_FACE
    bright = (look_name or C.DEFAULT_LOOK) == "bright"
    if bright:
        narration_rules = f"""- Total narration 70-100 words, calm, clear and fast-paced.
- Narrate what happens step by step, like a calm documentary voice ("The robot is placed inside the cage.
  Then a magnet..."). Use "you/your" when the viewer's own body or life is the subject.
- SHOT 1 IS THE HOOK - the most important shot. Open on the most dramatic, surprising or visually wild moment
  of the whole story (the explosion of particles, the inside view, the thing going wrong, the shocking scale),
  NOT a calm setup. Never open on someone picking up, plugging in, sitting down or looking at something.
  Its narration (6-12 words) is the most surprising claim or consequence in the story, said as a fact, e.g.
  "Every time you charge your phone, you force billions of atoms into a cage." Then shot 2 goes back to
  show how it starts. No intro, no question, no "Did you know".
- Exactly {num_shots} shots. Each shot narration is ONE quick beat of 6-14 words.
- Last shot: when it fits, end on what this means in real life ("And someday...", "That's why...") as a
  complete sentence (never stop on words like "because", "and", "so"). Its image uses the same framing and
  setting as shot 1, so a replay feels smooth."""
    else:
        narration_rules = None
    return _apply_look(f"""You write viral 3D-animated explainer YouTube Shorts in the style of Zack D. Films.
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
- CAST: the lead is ALWAYS "Hero": {face}. His face and hair never change.
- hero_outfit: dress Hero REALISTICALLY for this story's situation, like real life - what a real person would
  actually wear there (space -> white astronaut suit; frozen lake -> puffer jacket, beanie, gloves; gym -> workout
  tank and shorts; sleep -> pajamas; beach -> t-shirt and shorts; hospital visit -> casual hoodie; office ->
  shirt and chinos; rain -> raincoat). Describe it specifically with colors, and include where "{C.BRAND_TEXT}"
  is printed on it (chest print, jacket patch, sleeve, helmet badge). He wears this SAME outfit in every shot of
  this video. Never shirtless, never in a hospital gown, never undressed. For scans/X-ray/inside-the-body shots,
  show a transparent or cross-section view of his body WITH his outfit still visible, or show only the organ.
  Add other characters ONLY when the story needs them (a doctor, a friend, a lifeguard, a kid, an astronaut,
  a crowd...). Use as many or as few as the story needs - often just Hero. Give every extra character a short
  unique name and a fixed, very specific look (age, gender, hair, skin tone, outfit with colors) so they can be
  drawn identically in every shot. Background crowds don't need to be in the cast.
- For each shot list exactly which cast names appear in "characters" ([] for pure close-ups/cross-sections
  with no recognizable person). Characters can enter and leave between shots.
- ONE IDEA PER SHOT: each shot shows a single clear subject - never split screens, collages, side-by-side
  panels or several unrelated things crammed into one frame. Vary camera angles between shots.
- image_prompt: describe ONE clear visual (subject, camera angle, what is highlighted/glowing, what each
  listed character is doing). Inside-the-body cross-sections are welcome. No captions or random text.
- BRANDING (like Zack D Films signs his scenes): the brand name is "{C.BRAND_TEXT}". It is already printed on
  Hero's outfit. In addition, in 2-3 shots where it fits naturally, put "{C.BRAND_TEXT}" on a real object in
  the scene - e.g. a product label, cereal box, medicine bottle, billboard, shop sign, truck side, book cover,
  phone screen, lab coat badge, helmet, mug. Write it in "brand_on" as a short phrase (e.g. "the label of the
  water bottle on the table"). Leave "brand_on" empty for cross-sections, X-rays and scenes with no fitting
  object - never force it. Never put it on skin or floating in the air.
- SAFETY (the video model blocks these): every person is FULLY CLOTHED in every shot (keep their outfit),
  never show bathing/showering/undressed bodies, no blood/gore, no injuries, no weapons. For water topics show
  hands or a clothed person by water, or a cross-section instead.
- motion: what MOVES in that shot when animated (e.g. "heart beats twice, blood cells stream through the artery,
  camera slowly pushes in"). Physical, continuous, smooth motion. No text, nobody talks on screen.

Return ONLY JSON:
{{"title": "...", "hook_title": "...", "description": "2 lines for YouTube", "tags": ["..."],
  "hero_outfit": "...",
  "cast": [{{"name": "Hero", "look": "..."}}, {{"name": "...", "look": "..."}}],
  "shots": [{{"narration": "...", "characters": ["Hero"], "image_prompt": "...", "brand_on": "", "motion": "..."}}]}}""",
        narration_rules, bright)


def _apply_look(prompt, narration_rules, bright):
    """Swap in the narration rules and the visual rules for the chosen look."""
    if narration_rules:
        a = prompt.index("- Total narration")
        b = prompt.index("- hook_title:")
        prompt = prompt[:a] + narration_rules + "\n" + prompt[b:]
    rules = BRIGHT_RULES if bright else CINEMATIC_RULES
    return prompt.replace("- SAFETY (the video model blocks these)", rules + "\n- SAFETY (the video model blocks these)", 1)


def _own_script_prompt(text, face=None, look_name=None):
    base = _script_prompt("(given below)", 7, face, look_name)
    tail = base[base.index("- CAST:"):]
    words = len(text.split())
    bright = (look_name or C.DEFAULT_LOOK) == "bright"
    n = max(4, min(12, round(words / (9 if bright else 15))))
    return f"""You turn a creator's OWN narration into a viral 3D-animated explainer YouTube Short (Zack D. Films style).

THE CREATOR'S NARRATION (use it EXACTLY):
\"\"\"{text}\"\"\"

Rules:
- Split the narration above into about {n} shots, in order. Use the creator's words EXACTLY, word for word -
  do not add, remove, reword or "improve" anything. Every word must appear in exactly one shot's "narration".
  Break at sentence or clause boundaries, 1-2 sentences per shot.
- Plan visuals that show exactly what each line says. The first shot's visual must be the most striking one.
- The last shot's image uses the SAME framing, camera angle and setting as shot 1, so a replay feels smooth.
- hook_title: 2-5 punchy words in CAPS for the first second, based on the opening line.
- No medical advice, no gore.
{tail}"""


def _fact_check(script, report_only=False):
    if report_only:
        prompt = f"""You are a strict science fact-checker for a popular-science YouTube Short written by a creator.
Check every factual claim in the narration against mainstream, well-established science. DO NOT rewrite anything.
Return ONLY JSON: {{"changes": ["warning: shot N says ... but actually ... (suggested fix: ...)", ...]}}
Return an empty list if every claim is accurate.

NARRATION:
{json.dumps([s["narration"] for s in script["shots"]])}"""
        fc = ai.text_json(prompt, temperature=0.2)
        return fc.get("changes", [])
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
    if (st.get("script_text") or "").strip():
        topic = topic or "My own script"
    elif not topic:
        used = brand_used(job.store)
        topic = random.choice([t for t in C.TOPIC_BANK if t not in used] or C.TOPIC_BANK)
    job.save(stage="scripting", topic=topic)
    job.log(f"Writing script: {topic}")
    face = hero_face(job.store)
    own = (st.get("script_text") or "").strip()
    if own:
        sc = ai.text_json(_own_script_prompt(own, face, st.get("look")), temperature=0.5)
    else:
        sc = ai.text_json(_script_prompt(topic, st.get("num_shots", 7), face, st.get("look")))
    job.check()
    job.log("Fact-checking every claim...")
    try:
        changes = _fact_check(sc, report_only=bool(own))
        if own and not changes:
            changes = ["your script: all claims look accurate"]
    except Exception as e:
        changes = [f"fact-check skipped: {str(e)[:100]}"]
    cast = {c["name"]: c["look"] for c in sc.get("cast", []) if c.get("name")}
    outfit = (sc.get("hero_outfit") or "").strip() or C.DEFAULT_OUTFIT
    if C.BRAND_TEXT.lower() not in outfit.lower():
        outfit += f', with "{C.BRAND_TEXT}" printed on the chest'
    sc["hero_outfit"] = outfit
    cast["Hero"] = face + ", wearing " + outfit
    sc["cast"] = [{"name": k, "look": v} for k, v in cast.items()]
    branded = 0
    for s in sc["shots"]:
        s["characters"] = [c for c in s.get("characters", []) if c in cast]
        if (s.get("brand_on") or "").strip():          # brand on objects: a couple of times, not every shot
            branded += 1
            if branded > C.MAX_BRAND_OBJECTS:
                s["brand_on"] = ""
    sc["fact_check"] = changes or ["all claims OK"]
    sc["look"] = st.get("look") or C.DEFAULT_LOOK
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


def _style(sc):
    return C.look((sc or {}).get("look"))["style"]


def _sheet_prompt(desc, sc=None):
    return (f"Character reference sheet of ONE person: {desc}. Full body, standing, front view, neutral friendly "
            f"expression, arms relaxed, plain light-grey background, nothing else in frame. {_style(sc)}")


def _shot_prompt(sc, s):
    cast = _cast(sc)
    who = " ".join(f"{n}: {cast[n]}." for n in s["characters"])
    lock = (" Every character is fully dressed in EXACTLY the outfit from their reference sheet - "
            "never shirtless, never undressed, never in different clothes.") if who else ""
    brand = ""
    if s.get("brand_on"):
        brand = (f' The text "{C.BRAND_TEXT}" is clearly and correctly spelled on {s["brand_on"]}, '
                 f'printed naturally like a real logo (correct perspective, not floating).')
    else:
        brand = " No logos or words on any object or screen in this shot apart from clothing prints (screens show a normal display)."
    if "Hero" in s["characters"]:
        brand += f' The "{C.BRAND_TEXT}" print on Hero\'s outfit is visible and spelled correctly.'
    return (f"{s['image_prompt']}. {('Characters in this shot - ' + who + lock + ' ') if who else ''}"
            f"{brand} {_style(sc)}")


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
    job.check()
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
    # the mascot's FACE is saved once and reused forever; his outfit sheet is drawn fresh for each video
    face = job.dir / "hero_face.png"
    data = job.store.read_bytes(C.HERO_FACE_KEY)
    if data:
        face.write_bytes(data)
    else:
        job.log("Creating the mascot's face reference (first video only)...")
        ai.image(f"Head-and-shoulders portrait of {hero_face(job.store)}, wearing a plain grey t-shirt, friendly neutral "
                 f"expression, front view, plain light-grey background. {_style(sc)}", face)
        job.store.upload_file(face, C.HERO_FACE_KEY)
    hero = job.dir / _sheet_name("Hero")
    if not _valid(hero):
        job.log(f"Dressing the mascot for this story: {sc.get('hero_outfit', '')[:80]}")
        ai.image(_sheet_prompt(cast["Hero"], sc), hero,
                 refs=[("Hero's FACE and HAIR - keep them identical, but IGNORE these clothes and use the new outfit",
                        face)])
        job.put(hero.name)
    needed = {n for s in sc["shots"] for n in s["characters"]} - {"Hero"}
    for n in needed:
        p = job.dir / _sheet_name(n)
        if not _valid(p):
            job.log(f"Drawing character sheet: {n}")
            ai.image(_sheet_prompt(cast[n], sc), p)
            job.put(p.name)
    todo = redo or [i for i in range(1, len(sc["shots"]) + 1) if not _valid(job.dir / f"shot_{i:02d}.png")]
    # shot 1 first (the last shot copies its framing), then the rest 3 at a time
    todo = sorted(todo)
    if todo and todo[0] == 1:
        job.log(f"Drawing shot 1 of {len(sc['shots'])}")
        _make_shot(job, sc, 1)
        todo = todo[1:]
    if todo:
        job.log(f"Drawing shots {', '.join(map(str, todo))}...")
        with ThreadPoolExecutor(3) as ex:
            list(ex.map(lambda k: _make_shot(job, sc, k), todo))
    imgs = [i for i in range(1, len(sc["shots"]) + 1) if _valid(job.dir / f"shot_{i:02d}.png")]
    job.log("Images ready - review them" if len(imgs) == len(sc["shots"]) else "Some images failed - redo them")
    job.save(stage="images_ready", images=imgs)


# ====================================================================== step 3: voice + video + assembly
def _dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True).stdout
    return float(out.strip())


def _video_prompt(s, secs, sc=None):
    if (sc or {}).get("look", C.DEFAULT_LOOK) == "bright":
        cam = ("ONE continuous smooth camera move (macro push-in, orbit or fly-through as described), shallow depth "
               "of field, slight natural motion blur, bright clean high-key lighting, glowing effects animate smoothly")
    else:
        cam = "slow cinematic camera movement"
    return (f"Animate this exact image into a smooth {secs}-second shot. {s.get('motion', '')} "
            f"Keep the same 3D style, colors, characters, outfits and composition as the image. Continuous fluid "
            f"motion, {cam}, vertical 9:16, 720p. "
            f"Keep any printed brand text ({C.BRAND_TEXT}) exactly as it appears in the image - sharp, readable, "
            f"not changing. Do not add any other text, captions or logos. No people talking.")


def _narrate(job, sc):
    """Record narration per shot; reuse a recording when the line and voice haven't changed."""
    vid = job.state.get("voice") or C.DEFAULT_VOICE
    words = {}
    for i, s in enumerate(sc["shots"], 1):
        mp3, meta = job.dir / f"voice_{i:02d}.mp3", job.dir / f"voice_{i:02d}.json"
        key = {"text": s["narration"], "voice": vid, "v": 2}   # v2: re-record takes from the old voice engine
        if _valid(mp3) and meta.exists():
            m = json.loads(meta.read_text())
            if m.get("key") == key:
                words[i] = [tuple(w) for w in m["words"]]
                continue
        words[i] = ai.voice(s["narration"], mp3, vid)
        meta.write_text(json.dumps({"key": key, "words": words[i]}))
        job.put(mp3.name)
        job.put(meta.name)
    return words


def step_video(job: Job, redo=None):
    sc = job.script()
    n = len(sc["shots"])
    clips = job.state.get("clips") or {}
    if redo:                                  # redo only these clips, keep everything else
        for i in redo:
            (job.dir / f"omni_{i:02d}.mp4").unlink(missing_ok=True)
            job.store.delete(job.prefix + f"omni_{i:02d}.mp4")
            clips[str(i)] = "waiting"
    job.save(stage="animating", clips=clips)
    job.log("Recording narration...")
    words = _narrate(job, sc)
    animate = job.state.get("animate", "all")
    targets = redo or ([] if animate == "none" else ([1] if animate == "hook" else list(range(1, n + 1))))

    def do_clip(i):
        s = sc["shots"][i - 1]
        out = job.dir / f"omni_{i:02d}.mp4"
        if _valid(out):
            return i, "ok"
        clips[str(i)] = "animating"
        job.save(clips=clips)            # also checks for Cancel
        secs = max(4, min(10, math.ceil(_dur(job.dir / f"voice_{i:02d}.mp3") + 0.3)))
        img = job.dir / f"shot_{i:02d}.png"
        try:
            ai.video(_video_prompt(s, secs, sc), img, out)
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
                ai.video(_video_prompt(safe, secs, sc), img, out)
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

    job.check()
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
    lk = C.look(sc.get("look"))
    build_short(shots, work, job.dir / "final.mp4", hook_title=sc.get("hook_title", "") if lk["hook_title"] else "",
                watermark=C.WATERMARK_TEXT, captions=lk["captions"],
                end_card=C.END_CARD, end_sub=C.END_CARD_SUB)
    job.put("final.mp4")
    job.log("Writing SEO: target searches, 10 scored titles, description, tags...")
    try:
        sc["seo"] = make_seo(sc)
        job.save_script(sc)
        upload = seo_mod.upload_text(sc["seo"])
    except Exception as e:
        job.log(f"SEO skipped: {str(e)[:120]}")
        upload = (f"{sc['title']} #shorts\n\n{sc.get('description', '')}\n\n"
                  + " ".join("#" + t.replace(" ", "") for t in sc.get("tags", [])))
    (job.dir / "upload.txt").write_text(upload)
    job.put("upload.txt")
    if not job.state.get("script_text"):
        brand_mark_used(job.store, job.state.get("topic", ""))
    job.log("Done! Your Short is ready")
    job.save(stage="done", clips=clips, final_at=now())


# ====================================================================== runner
STEPS = {"script": step_script, "images": step_images, "video": step_video}


def _record_spend(store, jid, u):
    """Add this run's metered cost to the job and to the monthly totals."""
    rs = ai.usage_rs(u)
    if rs <= 0:
        return 0
    st = store.read_json(f"jobs/{jid}/state.json") or {}
    st["spent_rs"] = round(st.get("spent_rs", 0) + rs, 1)
    store.write_json(f"jobs/{jid}/state.json", st)
    sp = store.read_json("brand/spend.json") or {"total_rs": 0, "months": {}}
    m = time.strftime("%Y-%m")
    sp["months"][m] = round(sp["months"].get(m, 0) + rs, 1)
    sp["total_rs"] = round(sp.get("total_rs", 0) + rs, 1)
    store.write_json("brand/spend.json", sp)
    return rs


def make_seo(sc):
    return seo_mod.build(ai.text_json(seo_mod.seo_prompt(sc), temperature=0.7), sc)


def upload_youtube(store, jid, arg):
    """arg: "public" | "private" | "unlisted" | "schedule@<RFC3339 time>"."""
    from . import youtube
    st = store.read_json(f"jobs/{jid}/state.json") or {}
    sc = store.read_json(f"jobs/{jid}/script.json") or {}
    data = store.read_bytes(f"jobs/{jid}/final.mp4")
    yt = dict(st.get("youtube") or {})
    try:
        if not data:
            raise RuntimeError("No finished video to upload")
        tmp = Path(tempfile.gettempdir()) / f"yt_{jid}.mp4"
        tmp.write_bytes(data)
        publish_at = arg.split("@", 1)[1] if arg.startswith("schedule@") else None
        privacy = arg if arg in ("public", "private", "unlisted") else "public"
        seo = sc.get("seo")
        if seo:
            title, desc, tags = seo.get("title"), seo_mod.full_description(seo), seo.get("tags") or []
        else:
            title = sc.get("title") or st.get("topic")
            tags = list(sc.get("tags") or []) + ["science", "explained", "3d animation", "what if", "shorts"]
            desc = (f"{sc.get('description', '')}\n\n"
                    + " ".join("#" + t.replace(" ", "") for t in (sc.get("tags") or [])) + " #shorts"
                    + "\n\nMade with AI tools and fact-checked. For curiosity and education - not medical advice.")
        res = youtube.upload(store, tmp, title, desc, tags, publish_at=publish_at, privacy=privacy)
        tmp.unlink(missing_ok=True)
        audited = youtube.cfg(store).get("audited")
        yt = {"status": "uploaded", "id": res["id"], "url": res["url"], "privacy": res["privacy"],
              "publish_at": publish_at, "uploaded": now(),
              "note": "" if audited else "Uploaded as private (YouTube keeps API uploads private until your free "
                                         "API audit is approved). Open YouTube Studio and set it to Public or Schedule."}
        print("uploaded to YouTube:", res["url"], flush=True)
    except Exception as e:
        traceback.print_exc()
        yt = {"status": "failed", "error": str(e)[:300], "tried": now()}
    st = store.read_json(f"jobs/{jid}/state.json") or st
    st["youtube"] = yt
    st["updated"] = now()
    store.write_json(f"jobs/{jid}/state.json", st)


def run(store: Store, jid: str, step: str, arg: str = ""):
    if step == "youtube":
        return upload_youtube(store, jid, arg)
    if step == "ytbatch":                     # arg = "jid@time,jid@time" - schedule many uploads
        for item in [x for x in arg.split(",") if "@" in x]:
            j, t = item.split("@", 1)
            upload_youtube(store, j, "schedule@" + t)
        return
    if step == "batch":                       # arg = comma list of job ids, made one after another
        for k, b in enumerate([x for x in arg.split(",") if x], 1):
            st = store.read_json(f"jobs/{b}/state.json") or {}
            if st.get("stage") != "waiting":  # cancelled or deleted while waiting
                continue
            st.update(stage="queued", status=f"Starting (batch {k})...")
            store.write_json(f"jobs/{b}/state.json", st)
            run(store, b, "auto")
        return
    job = Job(store, jid)
    ai.usage_take()
    try:
        job.pull()
        nums = [int(x) for x in arg.split(",") if x.strip().isdigit()]
        if step == "auto":
            step_script(job)
            step_images(job)
            step_video(job)
        elif step == "images" and nums:
            step_images(job, redo=nums)
        elif step == "video" and nums:
            step_video(job, redo=nums)
        else:
            STEPS[step](job)
        if job.state.get("stage") == "done":
            notify(store, job, ok=True)
    except Cancelled:
        print("cancelled by user", flush=True)
    except Exception as e:
        traceback.print_exc()
        job.state.setdefault("logs", []).append(f"{time.strftime('%H:%M:%S')}  ERROR: {str(e)[:300]}")
        try:
            job.save(stage="failed", failed_step=step, error=str(e)[:500], status="Failed: " + str(e)[:150])
            notify(store, job, ok=False)
        except Cancelled:
            pass
    finally:
        if getattr(job, "_timer", None):
            job._timed_flush()              # write the last log lines before the worker exits
        try:
            _record_spend(store, jid, ai.usage_take())
        except Exception as e:
            print("spend tracking failed:", e, flush=True)
        shutil.rmtree(job.dir, ignore_errors=True)


# ====================================================================== email notifications
def notify(store, job, ok=True, force=False):
    """Email you when a Short is ready (or failed). Settings live in your private bucket (brand/settings.json)."""
    cfg = store.read_json("brand/settings.json") or {}
    to, user, pw = cfg.get("notify_email"), cfg.get("gmail_user"), cfg.get("gmail_app_password")
    if not ((cfg.get("notify_on") or force) and to and user and pw):
        return
    import smtplib
    from email.message import EmailMessage
    st = job.state
    title = st.get("title") or st.get("topic") or "Your Short"
    msg = EmailMessage()
    msg["From"], msg["To"] = user, to
    if ok:
        msg["Subject"] = f"✅ Ready: {title}"
        body = f"Your Short \"{title}\" is ready.\n\nOpen the app to watch and download it."
    else:
        msg["Subject"] = f"❌ Failed: {title}"
        body = f"Your Short \"{title}\" failed.\n\nError: {st.get('error', '')}\n\nOpen the app and tap Retry."
    if cfg.get("app_url"):
        body += f"\n\n{cfg['app_url'].rstrip('/')}/#/job/{job.id}"
    msg.set_content(body)
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
            s.login(user, pw.replace(" ", ""))
            s.send_message(msg)
    except Exception as e:
        print("email failed:", str(e)[:200], flush=True)
