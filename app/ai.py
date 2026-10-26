"""Calls to Gemini (text + images), Gemini Omni (video) and the narrator voice.

On Cloud Run the app's service account is used automatically (no API keys or JSON key files).
Set FAKE_AI=1 to generate placeholder output locally without spending credits (used for tests)."""
import asyncio
import base64
import io
import json
import os
import subprocess
import threading
import time
from pathlib import Path

import requests

from . import config as C

FAKE = os.environ.get("FAKE_AI") == "1"

# ---------------------------------------------------------------- usage meter (for the credit tracker)
USAGE = {"text": 0, "image": 0, "video_s": 0.0, "tts_chars": 0}
_ulock = threading.Lock()


def _meter(key, amount=1):
    with _ulock:
        USAGE[key] += amount


def usage_take():
    """Return usage since the last call and reset the counters."""
    with _ulock:
        u = dict(USAGE)
        for k in USAGE:
            USAGE[k] = 0 if k != "video_s" else 0.0
    return u


def usage_rs(u):
    return round(u.get("text", 0) * C.RS_TEXT + u.get("image", 0) * C.RS_IMAGE
                 + u.get("video_s", 0) * C.RS_VIDEO_PER_S + u.get("tts_chars", 0) / 1000 * C.RS_TTS_PER_1K, 1)


def _media_dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True).stdout
    try:
        return float(out.strip())
    except ValueError:
        return 0.0


# ---------------------------------------------------------------- auth
_creds = None
_lock = threading.Lock()


def _headers():
    global _creds
    import google.auth
    import google.auth.transport.requests
    with _lock:
        if _creds is None:
            _creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        if not _creds.valid:
            _creds.refresh(google.auth.transport.requests.Request())
        return {"Authorization": "Bearer " + _creds.token, "Content-Type": "application/json"}


class ContentBlocked(Exception):
    pass


def _post(url, body, timeout=300, tries=5):
    last = None
    for attempt in range(tries):
        r = requests.post(url, headers=_headers(), json=body, timeout=timeout)
        if r.status_code == 429 or r.status_code >= 500:
            last = f"{r.status_code}: {r.text[:300]}"
            time.sleep(min(60, 6 * (attempt + 1)))
            continue
        if r.status_code == 400 and ("content_blocked" in r.text or "policy" in r.text.lower()):
            raise ContentBlocked(r.text[:300])
        if not r.ok:
            raise RuntimeError(f"{r.status_code}: {r.text[:400]}")
        return r.json()
    raise RuntimeError("Google is busy (rate limit). " + (last or ""))


# ---------------------------------------------------------------- text + images
GEN_URL = "https://aiplatform.googleapis.com/v1/projects/{p}/locations/global/publishers/google/models/{m}:generateContent"


def gemini(model, prompt, gen_cfg, extra_parts=None):
    body = {"contents": [{"role": "user", "parts": (extra_parts or []) + [{"text": prompt}]}],
            "generationConfig": gen_cfg}
    return _post(GEN_URL.format(p=C.PROJECT, m=model), body)


def _mime(path):
    head = Path(path).read_bytes()[:12]
    if head.startswith(b"\xff\xd8"):
        return "image/jpeg"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    return "image/png"


def describe_person(photo_paths):
    """One-sentence visual description of the person in the photos, for keeping a 3D likeness."""
    if FAKE:
        return "a young man with thick wavy black hair swept up, a short full beard, dark brown eyes"
    parts = [{"inlineData": {"mimeType": _mime(p), "data": base64.b64encode(Path(p).read_bytes()).decode()}}
             for p in photo_paths]
    _meter("text")
    prompt = ("These photos all show the same person. For a 3D character artist who must keep his likeness, describe "
              "ONLY his visible physical features: face shape, skin tone, hair (style, length, texture, colour), facial "
              "hair, eyebrows, eyes, nose, build. Do not mention clothes, accessories, background, names or guesses "
              "about identity. Return ONLY JSON: {\"description\": \"a young man with ...\"} (max 60 words).")
    resp = gemini(C.TEXT_MODEL_ID, prompt, {"responseMimeType": "application/json", "temperature": 0.2}, parts)
    raw = "".join(p.get("text", "") for p in resp["candidates"][0]["content"]["parts"] if not p.get("thought"))
    return json.loads(raw[raw.find("{"): raw.rfind("}") + 1])["description"].strip()


def text_json(prompt, temperature=0.9):
    _meter("text")
    if FAKE:
        return _fake_text(prompt)
    resp = gemini(C.TEXT_MODEL_ID, prompt, {"responseMimeType": "application/json", "temperature": temperature})
    parts = resp["candidates"][0]["content"]["parts"]
    raw = "".join(p.get("text", "") for p in parts if not p.get("thought"))
    return json.loads(raw[raw.find("{"): raw.rfind("}") + 1])


def image(prompt, out_path, refs=None):
    """refs: list of (label, image_path) identity/composition references."""
    _meter("image")
    if FAKE:
        return _fake_image(prompt, out_path)
    extra = []
    refs = [(n, r) for n, r in (refs or []) if Path(r).exists()]
    if refs:
        for _, r in refs:
            extra.append({"inlineData": {"mimeType": _mime(r),
                                         "data": base64.b64encode(Path(r).read_bytes()).decode()}})
        who = "; ".join(f"reference image {k + 1} is {n}" for k, (n, _) in enumerate(refs))
        prompt = (f"Attached are reference images ({who}). Draw each character with EXACTLY the same face, hair, "
                  f"body and outfit as in their reference, in the same art style. Do not copy the reference pose "
                  f"or background unless told to. Create this NEW scene: " + prompt)
    resp = gemini(C.IMAGE_MODEL_ID, prompt,
                  {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}, extra or None)
    for part in resp["candidates"][0]["content"]["parts"]:
        d = part.get("inlineData") or part.get("inline_data")
        if d and d.get("data"):
            Path(out_path).write_bytes(base64.b64decode(d["data"]))
            return
    raise RuntimeError("no image returned")


# ---------------------------------------------------------------- video (Gemini Omni)
INTERACT_URL = "https://aiplatform.googleapis.com/v1beta1/projects/{p}/locations/global/interactions"
_img_fmt = {"idx": None}


def _image_variants(b64):
    return [
        {"type": "image", "data": b64, "mime_type": "image/png"},
        {"type": "image", "image": {"data": b64, "mime_type": "image/png"}},
        {"type": "image", "inline_data": {"data": b64, "mime_type": "image/png"}},
    ]


def _extract_video(js):
    for step in js.get("steps", []) or []:
        for c in step.get("content", []) or []:
            if c.get("type") == "video":
                if c.get("data"):
                    return base64.b64decode(c["data"])
                uri = c.get("uri") or c.get("url")
                if uri:
                    return requests.get(uri, headers=_headers(), timeout=600).content
    return None


def video(prompt, img_path, out_path):
    if FAKE:
        _fake_video(out_path)
        _meter("video_s", _media_dur(out_path))
        return
    url = INTERACT_URL.format(p=C.PROJECT)
    b64 = base64.b64encode(Path(img_path).read_bytes()).decode() if img_path else None
    variants = [None] if not b64 else (
        [_image_variants(b64)[_img_fmt["idx"]]] if _img_fmt["idx"] is not None else _image_variants(b64))
    last = None
    for part in variants:
        body = {"model": C.VIDEO_MODEL_ID, "input": ([part] if part else []) + [{"type": "text", "text": prompt}]}
        try:
            js = _post(url, body, timeout=1200, tries=4)
        except ContentBlocked:
            raise
        except RuntimeError as e:
            last = str(e)
            if last.startswith("400") and part:
                continue
            raise
        t0 = time.time()
        while js.get("status") not in ("completed", "failed", "cancelled") and time.time() - t0 < 1500:
            time.sleep(10)
            js = requests.get(f"{url}/{js['id']}", headers=_headers(), timeout=120).json()
        data = _extract_video(js)
        if not data:
            raise RuntimeError("no video in response: " + json.dumps(js)[:300])
        Path(out_path).write_bytes(data)
        _meter("video_s", _media_dur(out_path))
        if part and _img_fmt["idx"] is None:
            _img_fmt["idx"] = _image_variants(b64).index(part)
        return
    raise RuntimeError(last or "video failed")


# ---------------------------------------------------------------- voice
TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"


def voice(text, mp3_path, voice_id=None):
    """Narrate one shot. Returns word timings [(start, end, word)] for the captions.
    voice_id: "gemini:<Name>" (Google Gemini TTS) or "edge:<edge voice>" (free Microsoft voice)."""
    voice_id = voice_id or C.DEFAULT_VOICE
    if FAKE:
        return _fake_voice(text, mp3_path)
    if voice_id.startswith("gemini:"):
        try:
            return _gemini_voice(text, mp3_path, voice_id.split(":", 1)[1])
        except Exception as e:
            print("Gemini voice failed, using the free voice instead:", str(e)[:200], flush=True)
            voice_id = "edge:" + C.VOICE
    return _edge_voice(text, mp3_path, voice_id.split(":", 1)[1] if ":" in voice_id else C.VOICE)


def _speech_ok(text, mp3_path):
    """Catch a voice model that went off-script (read its instructions aloud, repeated a line):
    the audio is then far longer than the words need."""
    n = len(text.split())
    dur = _media_dur(mp3_path) or 0
    return 0.3 < dur <= n / 1.7 + 1.5


def _tts_call(body, mp3_path, text):
    h = dict(_headers(), **{"x-goog-user-project": C.PROJECT})
    last = None
    for attempt in range(4):
        r = requests.post(TTS_URL, headers=h, json=body, timeout=120)
        if r.status_code == 429 or r.status_code >= 500:
            last = r.text[:200]
            time.sleep(5 * (attempt + 1))
            continue
        if not r.ok:
            raise RuntimeError(f"{r.status_code}: {r.text[:300]}")
        Path(mp3_path).write_bytes(base64.b64decode(r.json()["audioContent"]))
        _meter("tts_chars", len(text))
        return
    raise RuntimeError("TTS busy: " + (last or ""))


def _gemini_voice(text, mp3_path, name):
    """Google studio voice. First choice: Chirp 3 HD (same voices as Gemini TTS, reads ONLY the text, never
    improvises). Backup: Gemini TTS with no instructions. Every take is length-checked so a voice that
    repeats or adds words is thrown away."""
    takes = [
        {"input": {"text": text},
         "voice": {"languageCode": "en-US", "name": f"en-US-Chirp3-HD-{name}"},
         "audioConfig": {"audioEncoding": "MP3", "speakingRate": C.TTS_RATE}},
        {"input": {"text": text},
         "voice": {"languageCode": "en-US", "name": f"en-US-Chirp3-HD-{name}"},
         "audioConfig": {"audioEncoding": "MP3"}},
        {"input": {"text": text},
         "voice": {"languageCode": "en-US", "name": name, "modelName": C.TTS_MODEL},
         "audioConfig": {"audioEncoding": "MP3"}},
    ]
    errors = []
    for body in takes:
        try:
            _tts_call(body, mp3_path, text)
        except Exception as e:
            errors.append(str(e)[:160])
            continue
        if _speech_ok(text, mp3_path):
            return align_words(text, mp3_path)
        errors.append(f"take was {_media_dur(mp3_path):.1f}s for {len(text.split())} words - off-script")
    raise RuntimeError(" | ".join(errors))


def _silences(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=noise=-35dB:d=0.12",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x.split("silence_start:")[1].split()[0]) for x in out.splitlines() if "silence_start:" in x]
    ends = [float(x.split("silence_end:")[1].split()[0]) for x in out.splitlines() if "silence_end:" in x]
    return list(zip(starts, ends + [None] * (len(starts) - len(ends))))


def align_words(text, mp3_path):
    """Word timings without a timing API: find the pauses between phrases, then share each phrase's time
    between its words by length. Accurate enough for word-by-word captions."""
    import re
    dur = _media_dur(mp3_path) or 1.0
    sil = _silences(mp3_path)
    t0, t1 = 0.0, dur
    if sil and sil[0][0] <= 0.1 and sil[0][1]:
        t0 = sil[0][1]
        sil = sil[1:]
    if sil and (sil[-1][1] is None or sil[-1][1] >= dur - 0.2):
        t1 = sil[-1][0]
        sil = sil[:-1]
    phrases = [ph.split() for ph in re.split(r"(?<=[.,!?;:\u2014])\s+", text.strip()) if ph.split()]
    weights = [sum(len(w) + 1 for w in ph) for ph in phrases]
    total = sum(weights) or 1
    # expected boundary times, then snap each to the nearest unused pause
    bounds, acc = [], 0
    mids = [(a + b) / 2 for a, b in sil if b]
    for wgt in weights[:-1]:
        acc += wgt
        exp = t0 + (t1 - t0) * acc / total
        if mids:
            best = min(mids, key=lambda m: abs(m - exp))
            if abs(best - exp) < max(0.6, 0.18 * (t1 - t0)) and (not bounds or best > bounds[-1]):
                bounds.append(best)
                mids.remove(best)
                continue
        bounds.append(exp)
    edges = [t0] + bounds + [t1]
    words = []
    for k, ph in enumerate(phrases):
        a, b = edges[k], edges[k + 1]
        lens = [len(w) + 1 for w in ph]
        tot, cur = sum(lens), a
        for w, L in zip(ph, lens):
            nxt = cur + (b - a) * L / tot
            words.append((cur, cur + (nxt - cur) * 0.92, w))
            cur = nxt
    return words


def _edge_voice(text, mp3_path, edge_voice):
    import edge_tts

    async def run():
        words = []
        try:
            comm = edge_tts.Communicate(text, edge_voice, rate=C.VOICE_RATE, boundary="WordBoundary")
        except TypeError:                      # older edge-tts versions emit word boundaries by default
            comm = edge_tts.Communicate(text, edge_voice, rate=C.VOICE_RATE)
        with open(mp3_path, "wb") as f:
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    words.append((chunk["offset"] / 1e7, (chunk["offset"] + chunk["duration"]) / 1e7, chunk["text"]))
        return words

    for attempt in range(3):
        try:
            words = asyncio.run(run())
            return words or align_words(text, mp3_path)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(3)


# ---------------------------------------------------------------- fake mode (local tests, no credits)
def _fake_text(prompt):
    if prompt.startswith("You are a YouTube Shorts + Instagram Reels SEO"):
        return {"queries": ["why do knuckles crack", "is cracking knuckles bad", "knuckle cracking bubble"],
                "titles": ["Why Do Your Knuckles Crack? The 20-Minute Bubble", "INSANE Knuckle Secret Nobody Tells You",
                           "Knuckle cracking: what actually makes the pop", "The pop in your knuckles is a bubble",
                           "Is Cracking Your Knuckles Bad? One Doctor Tested It For 60 Years"],
                "description": "Why do knuckles crack? It's a gas bubble forming in your joint fluid.\nIs cracking knuckles bad for you? One doctor tested it for 60 years.\n\nA 3D look inside your finger joint.",
                "hashtags": ["#shorts", "#science", "#humanbody", "#knuckles"],
                "tags": ["knuckle cracking", "cracking knuckles", "why knuckles pop", "joint popping"],
                "instagram_caption": "That pop isn't your bones. 🫧\nTag someone who cracks their knuckles all day.\n#science #humanbody #3d"}
    if "NARRATION:" in prompt and prompt.startswith("You are a strict"):
        return {"changes": ["(fake) warning: shot 2 sounds exaggerated"]}
    if prompt.startswith("You turn a creator's"):
        text = prompt.split('"""')[1]
        sents = [s.strip() + "." for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
        shots = [{"narration": s, "characters": ["Hero"] if k % 2 == 0 else [], "image_prompt": f"own shot {k+1}",
                  "brand_on": "", "motion": "slow push"} for k, s in enumerate(sents)]
        return {"title": "My own script test", "hook_title": "OWN SCRIPT", "description": "d", "tags": ["t"],
                "hero_outfit": "grey hoodie with VERSE FILMS on the chest", "cast": [{"name": "Hero", "look": "x"}],
                "shots": shots}
    if prompt.startswith("You are a strict"):
        sc = json.loads(prompt[prompt.index("SCRIPT:") + 7:])
        return {"script": sc, "changes": ["(fake) all claims OK"]}
    shots = [{"narration": f"This is fake narration line number {i} for testing the pipeline.",
              "characters": ["Hero", "Dr Mira"] if i == 2 else (["Hero"] if i % 2 else []),
              "image_prompt": f"fake shot {i}", "motion": "camera pushes in"} for i in range(1, 6)]
    return {"title": "Fake test short", "hook_title": "YOUR BRAIN DID THIS", "description": "Fake description.",
            "tags": ["science", "body"], "cast": [{"name": "Hero", "look": "x"},
                                                  {"name": "Dr Mira", "look": "doctor in teal scrubs"}],
            "shots": shots}


def _fake_image(prompt, out_path):
    from PIL import Image, ImageDraw
    h = abs(hash(prompt)) % 255
    im = Image.new("RGB", (768, 1344), (h, 90, 255 - h))
    d = ImageDraw.Draw(im)
    d.ellipse((200, 450, 568, 900), fill=(240, 190, 60))
    d.text((40, 40), prompt[:60], fill="white")
    im.save(out_path)
    time.sleep(float(os.environ.get("FAKE_DELAY", "0.3")))


def _fake_video(out_path):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=720x1280:d=5:r=24",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out_path)], check=True)
    time.sleep(1)


def _fake_voice(text, mp3_path):
    words = text.split()
    dur = 0.32 * len(words) + 0.3
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"sine=f=220:d={dur:.2f}",
                    "-q:a", "5", str(mp3_path)], check=True)
    step = (dur - 0.3) / max(1, len(words))
    return [(k * step, (k + 1) * step * 0.95, w) for k, w in enumerate(words)]
