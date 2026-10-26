"""InsideYou Studio - web app. Serves the UI and a small JSON API; heavy steps run as Cloud Run Job executions."""
import hashlib
import hmac
import os
import tempfile
import threading
import time
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel

from . import config as C
from . import engine
from .store import Store

app = FastAPI(title="InsideYou Studio")
store = Store()
STATIC = Path(__file__).parent / "static"

PASSWORD = os.environ.get("APP_PASSWORD", "")
SECRET = (os.environ.get("APP_SECRET") or PASSWORD or "dev").encode()
RUN_MODE = os.environ.get("RUN_MODE", "local")          # "cloudrun" in production
REGION = os.environ.get("REGION", "asia-south1")
WORKER_JOB = os.environ.get("WORKER_JOB", "insideyou-worker")
STALE_SECONDS = 50 * 60


# ------------------------------------------------------------------ auth (simple password + signed cookie)
def _sign(v):
    return hmac.new(SECRET, v.encode(), hashlib.sha256).hexdigest()


def _token():
    exp = str(int(time.time()) + 60 * 60 * 24 * 60)        # 60 days
    return exp + "." + _sign(exp)


def _valid_token(t):
    try:
        exp, sig = t.split(".")
        return hmac.compare_digest(sig, _sign(exp)) and int(exp) > time.time()
    except Exception:
        return False


@app.middleware("http")
async def auth(request: Request, call_next):
    p = request.url.path
    if PASSWORD and p.startswith("/api/") and p != "/api/login":
        if not _valid_token(request.cookies.get("iy", "")):
            return JSONResponse({"detail": "login required"}, status_code=401)
    return await call_next(request)


class Login(BaseModel):
    password: str


@app.post("/api/login")
def login(body: Login):
    if PASSWORD and not hmac.compare_digest(body.password, PASSWORD):
        time.sleep(1)
        raise HTTPException(401, "Wrong password")
    r = JSONResponse({"ok": True})
    r.set_cookie("iy", _token(), max_age=60 * 60 * 24 * 60, httponly=True, samesite="lax",
                 secure=RUN_MODE == "cloudrun")
    return r


# ------------------------------------------------------------------ running steps
def _trigger(jid, step, st, arg=""):
    """Start a step. Each run gets a run_id; Cancel clears it so the worker stops at its next checkpoint."""
    import secrets
    st["prev_stage"] = st.get("stage") if st.get("stage") not in engine.RUNNING_STAGES else st.get("prev_stage")
    _save_state(jid, st, stage="queued", status="Starting...", error=None, run_id=secrets.token_hex(6),
                execution=None)
    try:
        execution = _start_worker(jid, step, arg)
    except HTTPException as e:
        _save_state(jid, st, stage=st.get("prev_stage") or "failed", run_id=None, error=str(e.detail)[:200])
        raise
    if execution:
        fresh = store.read_json(f"jobs/{jid}/state.json") or st
        _save_state(jid, fresh, execution=execution)


def _start_worker(jid, step, arg=""):
    """Run a step in the background: a Cloud Run Job execution in production, a thread locally."""
    if RUN_MODE != "cloudrun":
        threading.Thread(target=engine.run, args=(store, jid, step, arg), daemon=True).start()
        return None
    from .ai import _headers
    args = ["-m", "app.worker", jid, step] + ([arg] if arg else [])
    url = (f"https://run.googleapis.com/v2/projects/{C.PROJECT}/locations/{REGION}/jobs/{WORKER_JOB}:run")
    r = requests.post(url, headers=_headers(),
                      json={"overrides": {"containerOverrides": [{"args": args}]}}, timeout=60)
    if not r.ok:
        raise HTTPException(500, f"Could not start worker: {r.status_code} {r.text[:300]}")
    return (r.json().get("metadata") or {}).get("name")


def _busy(st):
    if st.get("stage") not in engine.RUNNING_STAGES:
        return False
    try:
        age = time.time() - time.mktime(time.strptime(st.get("updated", ""), "%Y-%m-%dT%H:%M:%S"))
    except Exception:
        return False
    return age < STALE_SECONDS


def _state(jid):
    st = store.read_json(f"jobs/{jid}/state.json")
    if not st:
        raise HTTPException(404, "Short not found")
    return st


def _save_state(jid, st, **kw):
    st.update(kw)
    st["updated"] = engine.now()
    store.write_json(f"jobs/{jid}/state.json", st)


# ------------------------------------------------------------------ API
@app.get("/api/config")
def config():
    used = engine.brand_used(store)
    sp = store.read_json("brand/spend.json") or {"total_rs": 0, "months": {}}
    return {"topics": [{"topic": t, "used": t in used} for t in C.TOPIC_BANK],
            "rs_per_shot": C.RS_PER_ANIMATED_SHOT, "rs_base": C.RS_BASE,
            "has_hero": store.read_bytes(C.HERO_FACE_KEY) is not None,
            "voices": [{"id": v, "label": l} for v, l in C.VOICES], "default_voice": C.DEFAULT_VOICE,
            "spend": {"total_rs": sp.get("total_rs", 0), "month_rs": sp["months"].get(time.strftime("%Y-%m"), 0),
                      "credits_start_rs": C.CREDITS_START_RS,
                      "left_rs": round(C.CREDITS_START_RS - sp.get("total_rs", 0), 1)}}


class NewJob(BaseModel):
    topic: str = ""
    script_text: str = ""
    voice: str = ""
    animate: str = "all"
    num_shots: int = 7
    auto: bool = False


@app.post("/api/jobs")
def create(body: NewJob):
    if body.animate not in ("all", "hook", "none"):
        raise HTTPException(400, "bad animate value")
    script_text = body.script_text.strip()
    if script_text and len(script_text.split()) < 15:
        raise HTTPException(400, "Your script is too short - write at least 2-3 sentences")
    if len(script_text) > 4000:
        raise HTTPException(400, "Your script is too long for a Short (max ~600 words)")
    jid = engine.new_job_id()
    st = {"id": jid, "created": engine.now(), "topic": body.topic.strip(), "script_text": script_text,
          "animate": body.animate, "voice": _voice(body.voice),
          "num_shots": max(4, min(9, body.num_shots)), "auto": body.auto, "stage": "queued",
          "status": "Starting...", "logs": [], "clips": {}, "images": [],
          "estimate_rs": engine.estimate_rs(body.num_shots, body.animate)}
    _save_state(jid, st)
    _trigger(jid, "auto" if body.auto else "script", st)
    return st


def _voice(v):
    return v if v in [x for x, _ in C.VOICES] else C.DEFAULT_VOICE


class BatchReq(BaseModel):
    count: int = 3
    animate: str = "all"
    num_shots: int = 7
    voice: str = ""


@app.post("/api/batch")
def batch(body: BatchReq):
    """Make several Shorts on fresh topics, fully automatic, one after another."""
    import random
    import secrets
    if body.animate not in ("all", "hook", "none") or not 2 <= body.count <= 5:
        raise HTTPException(400, "Choose 2 to 5 Shorts")
    used = engine.brand_used(store)
    busy_topics = {(store.read_json(f"jobs/{j}/state.json") or {}).get("topic") for j in store.list_dirs("jobs/")[-40:]}
    fresh = [t for t in C.TOPIC_BANK if t not in used and t not in busy_topics] or C.TOPIC_BANK
    topics = random.sample(fresh, min(body.count, len(fresh)))
    ids = []
    for k, t in enumerate(topics, 1):
        jid = engine.new_job_id() + str(k)
        st = {"id": jid, "created": engine.now(), "topic": t, "script_text": "", "animate": body.animate,
              "voice": _voice(body.voice), "num_shots": max(4, min(9, body.num_shots)), "auto": True,
              "batch": True, "stage": "waiting", "status": f"Waiting in batch ({k} of {len(topics)})", "logs": [],
              "clips": {}, "images": [], "run_id": secrets.token_hex(6),
              "estimate_rs": engine.estimate_rs(body.num_shots, body.animate)}
        _save_state(jid, st)
        ids.append(jid)
    _start_worker("BATCH", "batch", ",".join(ids))
    return {"ids": ids, "topics": topics}


@app.get("/api/jobs")
def list_jobs():
    out = []
    for jid in sorted(store.list_dirs("jobs/"), reverse=True)[:40]:
        st = store.read_json(f"jobs/{jid}/state.json")
        if st:
            out.append({k: st.get(k) for k in ("id", "created", "updated", "topic", "title", "stage", "status",
                                                "animate", "images")})
    return out


@app.get("/api/jobs/{jid}")
def get_job(jid: str):
    st = _state(jid)
    st["busy"] = _busy(st)
    return {"state": st, "script": store.read_json(f"jobs/{jid}/script.json"),
            "upload": (store.read_bytes(f"jobs/{jid}/upload.txt") or b"").decode()}


class ScriptEdit(BaseModel):
    title: str | None = None
    hook_title: str | None = None
    narrations: list[str] | None = None


@app.put("/api/jobs/{jid}/script")
def edit_script(jid: str, body: ScriptEdit):
    st = _state(jid)
    if _busy(st):
        raise HTTPException(409, "Busy - wait for the current step to finish")
    sc = store.read_json(f"jobs/{jid}/script.json")
    if not sc:
        raise HTTPException(404, "No script yet")
    if body.title is not None:
        sc["title"] = body.title.strip()
    if body.hook_title is not None:
        sc["hook_title"] = body.hook_title.strip()
    if body.narrations is not None and len(body.narrations) == len(sc["shots"]):
        for s, n in zip(sc["shots"], body.narrations):
            s["narration"] = n.strip()
    store.write_json(f"jobs/{jid}/script.json", sc)
    _save_state(jid, st, title=sc.get("title", ""))
    return {"ok": True}


class StepReq(BaseModel):
    step: str
    shots: list[int] | None = None


@app.post("/api/jobs/{jid}/step")
def run_step(jid: str, body: StepReq):
    st = _state(jid)
    if _busy(st):
        raise HTTPException(409, "Already working on this Short")
    if body.step not in ("script", "images", "video"):
        raise HTTPException(400, "bad step")
    if body.step == "video":
        sc = store.read_json(f"jobs/{jid}/script.json") or {"shots": []}
        if len(st.get("images") or []) < len(sc["shots"]):
            raise HTTPException(400, "Some images are missing - redo them first")
        if body.shots and any(not 1 <= k <= len(sc["shots"]) for k in body.shots):
            raise HTTPException(400, "bad shot number")
    arg = ",".join(str(i) for i in (body.shots or []))
    _trigger(jid, body.step, st, arg)
    return {"ok": True}


@app.post("/api/jobs/{jid}/cancel")
def cancel(jid: str):
    """Stop the running step right away and go back to the last review screen."""
    st = _state(jid)
    if st.get("stage") == "waiting":                # still waiting in a batch: just skip it
        _save_state(jid, st, stage="cancelled", run_id=None, status="Cancelled")
        return {"ok": True, "stage": "cancelled"}
    if st.get("stage") not in engine.RUNNING_STAGES:
        raise HTTPException(400, "Nothing is running")
    if RUN_MODE == "cloudrun" and st.get("execution") and not st.get("batch"):
        from .ai import _headers
        try:
            requests.post(f"https://run.googleapis.com/v2/{st['execution']}:cancel", headers=_headers(), timeout=30)
        except Exception:
            pass                                    # the worker also stops by itself at its next checkpoint
    has_script = store.read_json(f"jobs/{jid}/script.json") is not None
    names = set(store.list_names(f"jobs/{jid}/"))
    sc = store.read_json(f"jobs/{jid}/script.json") or {"shots": []}
    imgs = [i for i in range(1, len(sc["shots"]) + 1) if f"shot_{i:02d}.png" in names]
    stage = {"scripting": "script_ready" if has_script else "cancelled",
             "imaging": "images_ready" if imgs else ("script_ready" if has_script else "cancelled"),
             "animating": "images_ready"}.get(st.get("stage"))
    if not stage:                                   # still queued: go back to where it was
        stage = st.get("prev_stage") or ("script_ready" if has_script else "cancelled")
    logs = (st.get("logs") or []) + [f"{time.strftime('%H:%M:%S')}  Cancelled by you"]
    _save_state(jid, st, stage=stage, run_id=None, status="Cancelled", images=imgs, logs=logs[-60:])
    return {"ok": True, "stage": stage}


@app.delete("/api/jobs/{jid}")
def delete_job(jid: str):
    st = _state(jid)
    if _busy(st):
        raise HTTPException(409, "Busy")
    store.delete_prefix(f"jobs/{jid}/")
    return {"ok": True}


_CACHE = Path(tempfile.gettempdir()) / "iy_cache"


@app.get("/api/jobs/{jid}/file/{name}")
def file(jid: str, name: str, v: str = ""):
    if "/" in name or ".." in name or "/" in jid or ".." in jid:
        raise HTTPException(400)
    key = f"jobs/{jid}/{name}"
    local = _CACHE / jid / f"{v}_{name}"
    if not local.exists():
        data = store.read_bytes(key)
        if not data:
            raise HTTPException(404)
        local.parent.mkdir(parents=True, exist_ok=True)
        local.write_bytes(data)
    headers = {"Cache-Control": "private, max-age=31536000" if v else "no-cache"}
    if name.endswith(".mp4") and v == "dl":
        headers["Content-Disposition"] = f'attachment; filename="{jid}.mp4"'
    return FileResponse(local, headers=headers)


@app.get("/api/brand/hero")
def hero():
    data = store.read_bytes(C.HERO_FACE_KEY)
    if not data:
        raise HTTPException(404)
    return Response(data, media_type="image/png", headers={"Cache-Control": "no-cache"})


# ------------------------------------------------------------------ settings (email notifications)
class Settings(BaseModel):
    notify_on: bool = False
    notify_email: str = ""
    gmail_user: str = ""
    gmail_app_password: str = ""      # empty = keep the saved one
    app_url: str = ""


@app.get("/api/settings")
def get_settings():
    s = store.read_json("brand/settings.json") or {}
    return {"notify_on": s.get("notify_on", False), "notify_email": s.get("notify_email", ""),
            "gmail_user": s.get("gmail_user", ""), "has_password": bool(s.get("gmail_app_password")),
            "app_url": s.get("app_url", "")}


@app.put("/api/settings")
def put_settings(body: Settings, request: Request):
    s = store.read_json("brand/settings.json") or {}
    s.update(notify_on=body.notify_on, notify_email=body.notify_email.strip(), gmail_user=body.gmail_user.strip(),
             app_url=body.app_url.strip() or str(request.base_url).rstrip("/").replace("http://", "https://"))
    if body.gmail_app_password.strip():
        s["gmail_app_password"] = body.gmail_app_password.strip()
    store.write_json("brand/settings.json", s)
    return get_settings()


@app.post("/api/settings/test")
def test_email():
    class _J:                                          # minimal stand-in job for the test email
        id = "test"
        state = {"title": "Test email from InsideYou Studio"}
    s = store.read_json("brand/settings.json") or {}
    if not (s.get("notify_email") and s.get("gmail_user") and s.get("gmail_app_password")):
        raise HTTPException(400, "Fill in all email fields first")
    import smtplib
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as sm:
            sm.login(s["gmail_user"], s["gmail_app_password"].replace(" ", ""))
    except Exception as e:
        raise HTTPException(400, f"Gmail login failed: {str(e)[:150]}")
    engine.notify(store, _J, ok=True, force=True)
    return {"ok": True}


# ------------------------------------------------------------------ My Face (use your own face as the mascot)
class FaceUpload(BaseModel):
    photos: list[str]            # base64 JPEG/PNG (data URLs allowed), 1-4 photos


def _b64(s):
    import base64
    return base64.b64decode(s.split(",", 1)[1] if s.startswith("data:") else s)


@app.get("/api/face")
def face_status():
    d = store.read_json(C.HERO_DESC_KEY) or {}
    cand = store.read_json("brand/face_candidate.json") or {}
    return {"custom": bool(d.get("description")), "description": d.get("description", ""),
            "has_face": store.read_bytes(C.HERO_FACE_KEY) is not None,
            "candidate": bool(cand), "candidate_description": cand.get("description", ""),
            "version": d.get("version", ""), "candidate_version": cand.get("version", "")}


@app.post("/api/face/generate")
def face_generate(body: FaceUpload):
    from . import ai
    if not 1 <= len(body.photos) <= 4:
        raise HTTPException(400, "Upload 1 to 4 photos")
    tmp = Path(tempfile.mkdtemp())
    paths = []
    for k, ph in enumerate(body.photos, 1):
        data = _b64(ph)
        if len(data) > 8_000_000:
            raise HTTPException(400, "Photo too large")
        p = tmp / f"photo_{k}.jpg"
        p.write_bytes(data)
        store.write_bytes(f"brand/face_src/photo_{k}.jpg", data, "image/jpeg")   # private, your bucket only
        paths.append(p)
    try:
        desc = ai.describe_person(paths)
        out = tmp / "candidate.png"
        refs = [(f"photo {k} of the real person", p) for k, p in enumerate(paths, 1)]
        ai.image(f"Turn this real person into the channel's 3D animated mascot. Head-and-shoulders portrait of {desc}. "
                 f"Keep a strong, recognizable likeness: the same face shape, hairstyle, beard, eyebrows, eyes, nose "
                 f"and skin tone as in the photos - but as a stylized 3D animated character, not a photo. Wearing a plain "
                 f"grey t-shirt, friendly neutral expression, front view, plain light-grey background. {C.STYLE}",
                 out, refs=refs)
    except Exception as e:
        raise HTTPException(500, f"Could not create your 3D face: {str(e)[:200]}")
    store.upload_file(out, "brand/face_candidate.png")
    store.write_json("brand/face_candidate.json", {"description": desc, "version": engine.now()})
    return face_status()


@app.post("/api/face/approve")
def face_approve():
    cand = store.read_json("brand/face_candidate.json")
    img = store.read_bytes("brand/face_candidate.png")
    if not cand or not img:
        raise HTTPException(400, "Create a 3D face first")
    store.write_bytes(C.HERO_FACE_KEY, img, "image/png")
    store.write_json(C.HERO_DESC_KEY, {"description": cand["description"], "version": engine.now()})
    store.delete("brand/face_candidate.png")
    store.delete("brand/face_candidate.json")
    return face_status()


@app.delete("/api/face")
def face_reset():
    """Go back to the default AI mascot (a new default face is drawn on the next video)."""
    for k in (C.HERO_FACE_KEY, C.HERO_DESC_KEY, "brand/face_candidate.png", "brand/face_candidate.json"):
        store.delete(k)
    store.delete_prefix("brand/face_src/")
    return face_status()


@app.get("/api/face/image/{which}")
def face_image(which: str):
    key = {"current": C.HERO_FACE_KEY, "candidate": "brand/face_candidate.png"}.get(which)
    data = store.read_bytes(key) if key else None
    if not data:
        raise HTTPException(404)
    return Response(data, media_type="image/png", headers={"Cache-Control": "no-cache"})


# ------------------------------------------------------------------ UI
@app.get("/")
def index():
    return FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})


@app.get("/health")
def health():
    return {"ok": True}
