"""InsideYou Studio - web app. Serves the UI and a small JSON API; heavy steps run as Cloud Run Job executions."""
import hashlib
import hmac
import os
import re
import tempfile
import threading
import time
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, Response, StreamingResponse
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
    if PASSWORD and p.startswith("/api/") and p not in ("/api/login", "/api/instagram/tick"):
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
            "looks": [{"id": k, "label": v["label"], "shots": v["shots"]} for k, v in C.LOOKS.items()],
            "default_look": C.DEFAULT_LOOK,
            "yt_connected": bool((store.read_json("brand/youtube.json") or {}).get("refresh_token")),
            "yt_channel": (store.read_json("brand/youtube.json") or {}).get("channel_title", ""),
            "ig_connected": bool((store.read_json("brand/instagram.json") or {}).get("token")),
            "ig_username": (store.read_json("brand/instagram.json") or {}).get("username", ""),
            "spend": {"total_rs": sp.get("total_rs", 0), "month_rs": sp["months"].get(time.strftime("%Y-%m"), 0),
                      "credits_start_rs": C.CREDITS_START_RS,
                      "left_rs": round(C.CREDITS_START_RS - sp.get("total_rs", 0), 1)}}


class NewJob(BaseModel):
    topic: str = ""
    script_text: str = ""
    voice: str = ""
    look: str = ""
    animate: str = "all"
    num_shots: int = 7
    auto: bool = False
    flow: bool = True                 # continuous clips: each starts where the previous one ends


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
          "animate": body.animate, "voice": _voice(body.voice), "look": _look(body.look),
          "num_shots": max(4, min(12, body.num_shots)), "auto": body.auto, "flow": body.flow, "stage": "queued",
          "status": "Starting...", "logs": [], "clips": {}, "images": [],
          "estimate_rs": engine.estimate_rs(body.num_shots, body.animate)}
    _save_state(jid, st)
    _trigger(jid, "auto" if body.auto else "script", st)
    return st


def _look(v):
    return v if v in C.LOOKS else C.DEFAULT_LOOK


def _voice(v):
    return v if v in [x for x, _ in C.VOICES] else C.DEFAULT_VOICE


class BatchReq(BaseModel):
    count: int = 3
    animate: str = "all"
    num_shots: int = 10
    voice: str = ""
    look: str = ""
    flow: bool = True


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
              "voice": _voice(body.voice), "look": _look(body.look), "num_shots": max(4, min(12, body.num_shots)), "auto": True, "flow": body.flow,
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
                                                "animate", "images", "youtube", "instagram")})
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
    flow: bool | None = None          # switch Flow mode on/off for this video before re-animating


@app.post("/api/jobs/{jid}/step")
def run_step(jid: str, body: StepReq):
    st = _state(jid)
    if _busy(st):
        raise HTTPException(409, "Already working on this Short")
    if body.step not in ("script", "images", "video", "oneshot"):
        raise HTTPException(400, "bad step")
    if body.flow is not None:
        st["flow"] = body.flow
    if body.step == "oneshot":
        if not st.get("images"):
            raise HTTPException(400, "Make the images first")
        _trigger(jid, "oneshot", st)
        return {"ok": True}
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


class SeoEdit(BaseModel):
    title: str | None = None
    description: str | None = None
    tags: list[str] | None = None
    hashtags: list[str] | None = None
    instagram_caption: str | None = None


def _save_seo(jid, sc):
    from . import seo as S
    seo = sc["seo"]
    seo["query_check"] = S.query_check(seo.get("title", ""), seo.get("description", ""), seo.get("queries") or [])
    store.write_json(f"jobs/{jid}/script.json", sc)
    store.write_bytes(f"jobs/{jid}/upload.txt", S.upload_text(seo).encode(), "text/plain")
    return seo


@app.post("/api/jobs/{jid}/seo")
def seo_regen(jid: str):
    """Write a fresh SEO pack (one quick Gemini call, about Rs 0.5)."""
    from . import ai
    sc = store.read_json(f"jobs/{jid}/script.json")
    if not sc:
        raise HTTPException(404, "No script")
    ai.usage_take()
    try:
        sc["seo"] = engine.make_seo(sc)
    except Exception as e:
        raise HTTPException(500, f"SEO failed: {str(e)[:200]}")
    finally:
        engine._record_spend(store, jid, ai.usage_take())
    return _save_seo(jid, sc)


@app.put("/api/jobs/{jid}/seo")
def seo_edit(jid: str, body: SeoEdit):
    from . import seo as S
    sc = store.read_json(f"jobs/{jid}/script.json")
    if not sc or not sc.get("seo"):
        raise HTTPException(404, "No SEO yet")
    seo = sc["seo"]
    if body.title is not None:
        seo["title"] = body.title.strip()[:100]
        seo["title_check"] = S.check_title(seo["title"], sc.get("hook_title"))
    if body.description is not None:
        seo["description"] = body.description.strip()[:4500]
    if body.tags is not None:
        seo["tags"] = [t.strip() for t in body.tags if t.strip()][:15]
    if body.hashtags is not None:
        seo["hashtags"] = [("#" + h.strip().lstrip("#")) for h in body.hashtags if h.strip()][:5]
    if body.instagram_caption is not None:
        seo["instagram_caption"] = body.instagram_caption.strip()
    return _save_seo(jid, sc)


@app.delete("/api/jobs/{jid}")
def delete_job(jid: str):
    st = _state(jid)
    if _busy(st):
        raise HTTPException(409, "Busy")
    store.delete_prefix(f"jobs/{jid}/")
    return {"ok": True}


_CACHE = Path(tempfile.gettempdir()) / "iy_cache"


CACHE_MB = 300          # Cloud Run's disk is its memory: keep the file cache small or the app crashes


def _prune_cache():
    files = sorted((p for p in _CACHE.rglob("*") if p.is_file()), key=lambda p: p.stat().st_mtime)
    total = sum(p.stat().st_size for p in files)
    while files and total > CACHE_MB * 1024 * 1024:
        f = files.pop(0)
        total -= f.stat().st_size
        f.unlink(missing_ok=True)


@app.get("/api/jobs/{jid}/file/{name}")
def file(jid: str, name: str, request: Request, v: str = ""):
    if "/" in name or ".." in name or "/" in jid or ".." in jid:
        raise HTTPException(400)
    key = f"jobs/{jid}/{name}"
    download = v == "dl"
    if name.endswith(".mp4"):          # videos: send the browser straight to storage (Cloud Run caps replies at 32 MB)
        url = store.signed_url(key, download_name=f"{jid}.mp4" if download else None)
        if url:
            return RedirectResponse(url, status_code=302, headers={"Cache-Control": "no-store"})
    if download:                       # same cached copy as the player, named after the finished version
        st = store.read_json(f"jobs/{jid}/state.json") or {}
        v = str(st.get("final_at") or st.get("updated") or "")
    ver = re.sub(r"[^A-Za-z0-9_.-]", "_", v)[:40]
    local = _CACHE / jid / f"{ver}_{name}"
    if not local.exists():
        _prune_cache()
        if not store.download_file(key, local):
            raise HTTPException(404)
    else:
        os.utime(local)
    headers = {"Cache-Control": "private, max-age=31536000" if v and not download else "no-cache"}
    if name.endswith(".mp4") and download:
        headers["Content-Disposition"] = f'attachment; filename="{jid}.mp4"'
    if name.endswith(".mp4"):
        return _stream(local, request, headers)
    return FileResponse(local, headers=headers)


def _stream(path, request, headers, chunk=1024 * 1024):
    """Chunked video reply with seeking support - chunked replies aren't limited to 32 MB on Cloud Run."""
    size = path.stat().st_size
    start, end, status = 0, size - 1, 200
    rng = request.headers.get("range", "")
    mt = re.match(r"bytes=(\d*)-(\d*)", rng)
    if mt:
        if mt.group(1):
            start = int(mt.group(1))
            end = int(mt.group(2)) if mt.group(2) else size - 1
        elif mt.group(2):
            start = max(0, size - int(mt.group(2)))
        end = min(end, size - 1)
        status = 206
        headers = dict(headers, **{"Content-Range": f"bytes {start}-{end}/{size}"})

    def body():
        with open(path, "rb") as f:
            f.seek(start)
            left = end - start + 1
            while left > 0:
                b = f.read(min(chunk, left))
                if not b:
                    break
                left -= len(b)
                yield b

    return StreamingResponse(body(), status_code=status, media_type="video/mp4",
                             headers=dict(headers, **{"Accept-Ranges": "bytes"}))


@app.get("/api/brand/hero")
def hero():
    data = store.read_bytes(C.HERO_FACE_KEY)
    if not data:
        raise HTTPException(404)
    return Response(data, media_type="image/png", headers={"Cache-Control": "no-cache"})


# ------------------------------------------------------------------ YouTube (connect + upload, free)
from fastapi.responses import RedirectResponse
from . import youtube as YT


def _redirect_uri(request: Request):
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    scheme = "https" if RUN_MODE == "cloudrun" else request.url.scheme
    return f"{scheme}://{host}/api/youtube/callback"


@app.get("/api/youtube")
def yt_status(request: Request):
    return dict(YT.status(store), redirect_uri=_redirect_uri(request))


class YTClient(BaseModel):
    client_id: str = ""
    client_secret: str = ""
    audited: bool | None = None


@app.put("/api/youtube/client")
def yt_client(body: YTClient, request: Request):
    YT.save_client(store, body.client_id, body.client_secret, body.audited)
    return yt_status(request)


@app.get("/api/youtube/connect")
def yt_connect(request: Request):
    if not YT.status(store)["has_client"]:
        raise HTTPException(400, "Save your OAuth Client ID and secret first")
    exp = str(int(time.time()) + 900)
    return RedirectResponse(YT.auth_url(store, _redirect_uri(request), exp + "." + _sign(exp)))


@app.get("/api/youtube/callback")
def yt_callback(request: Request, code: str = "", state: str = "", error: str = ""):
    if error or not code:
        return RedirectResponse("/#/settings?yt=" + (error or "cancelled"))
    if not _valid_token(state):
        return RedirectResponse("/#/settings?yt=expired")
    try:
        YT.finish_connect(store, code, _redirect_uri(request))
    except Exception as e:
        return RedirectResponse("/#/settings?yt=" + requests.utils.quote(str(e)[:150]))
    return RedirectResponse("/#/settings?yt=ok")


@app.post("/api/youtube/disconnect")
def yt_disconnect(request: Request):
    YT.disconnect(store)
    return yt_status(request)


class YTUpload(BaseModel):
    mode: str = "public"          # public | private | unlisted | schedule
    at: str = ""                  # RFC3339 time for schedule (e.g. 2026-10-27T18:00:00+05:30)


@app.post("/api/jobs/{jid}/youtube")
def yt_upload(jid: str, body: YTUpload):
    st = _state(jid)
    if st.get("stage") != "done":
        raise HTTPException(400, "Finish the video first")
    if not YT.status(store)["connected"]:
        raise HTTPException(400, "Connect YouTube in Settings first")
    if (st.get("youtube") or {}).get("status") == "uploading":
        raise HTTPException(409, "Already uploading")
    if body.mode == "schedule":
        if not body.at:
            raise HTTPException(400, "Pick a time")
        arg = "schedule@" + body.at
    elif body.mode in ("public", "private", "unlisted"):
        arg = body.mode
    else:
        raise HTTPException(400, "bad mode")
    _save_state(jid, st, youtube={"status": "uploading", "started": engine.now()})
    _start_worker(jid, "youtube", arg)
    return {"ok": True}


class YTScheduleAll(BaseModel):
    time: str = "18:00"           # daily posting time, India time
    start_date: str = ""          # YYYY-MM-DD, default tomorrow


@app.post("/api/youtube/schedule-all")
def yt_schedule_all(body: YTScheduleAll):
    """Upload every finished Short that isn't on YouTube yet, one per day at the chosen time (IST)."""
    import datetime as dt
    if not YT.status(store)["connected"]:
        raise HTTPException(400, "Connect YouTube in Settings first")
    jobs = []
    for jid in sorted(store.list_dirs("jobs/")):
        st = store.read_json(f"jobs/{jid}/state.json") or {}
        if st.get("stage") == "done" and (st.get("youtube") or {}).get("status") not in ("uploaded", "uploading"):
            jobs.append((jid, st))
    if not jobs:
        raise HTTPException(400, "No finished Shorts waiting to be uploaded")
    ist = dt.timezone(dt.timedelta(hours=5, minutes=30))
    hh, mm = (int(x) for x in body.time.split(":"))
    day = (dt.date.fromisoformat(body.start_date) if body.start_date
           else dt.datetime.now(ist).date() + dt.timedelta(days=1))
    plan = []
    for k, (jid, st) in enumerate(jobs):
        when = dt.datetime.combine(day + dt.timedelta(days=k), dt.time(hh, mm), ist).isoformat()
        _save_state(jid, st, youtube={"status": "uploading", "started": engine.now(), "planned": when})
        plan.append(f"{jid}@{when}")
    _start_worker("YT", "ytbatch", ",".join(plan))
    return {"count": len(plan), "plan": [p.split("@", 1)[1] for p in plan]}


# ------------------------------------------------------------------ Instagram (Reels auto-posting, free)
from . import instagram as IG


@app.get("/api/instagram")
def ig_status():
    return IG.status(store)


class IGToken(BaseModel):
    token: str = ""


@app.put("/api/instagram/token")
def ig_token(body: IGToken):
    try:
        return IG.connect(store, body.token)
    except Exception as e:
        raise HTTPException(400, str(e)[:300])


class IGSettings(BaseModel):
    auto: bool | None = None
    time: str = ""


@app.put("/api/instagram/settings")
def ig_settings(body: IGSettings):
    if body.time and not re.fullmatch(r"\d{2}:\d{2}", body.time):
        raise HTTPException(400, "Time must look like 19:00")
    return IG.settings(store, body.auto, body.time or None)


@app.post("/api/instagram/disconnect")
def ig_disconnect():
    IG.disconnect(store)
    return IG.status(store)


class IGPost(BaseModel):
    mode: str = "now"             # now | schedule | cancel
    at: str = ""                  # ISO time with offset, for schedule


@app.post("/api/jobs/{jid}/instagram")
def ig_post(jid: str, body: IGPost):
    st = _state(jid)
    cur = st.get("instagram") or {}
    if body.mode == "cancel":
        if cur.get("status") == "scheduled":
            _save_state(jid, st, instagram={})
        return {"ok": True}
    if st.get("stage") != "done":
        raise HTTPException(400, "Finish the video first")
    if not IG.status(store)["connected"]:
        raise HTTPException(400, "Connect Instagram in Settings first")
    if cur.get("status") == "posting":
        raise HTTPException(409, "Already posting")
    if body.mode == "schedule":
        if not body.at:
            raise HTTPException(400, "Pick a time")
        _save_state(jid, st, instagram={"status": "scheduled", "at": body.at})
        return {"ok": True}
    _save_state(jid, st, instagram={"status": "posting", "started": engine.now()})
    _start_worker(jid, "instagram")
    return {"ok": True}


class IGScheduleAll(BaseModel):
    time: str = "19:00"


@app.post("/api/instagram/schedule-all")
def ig_schedule_all(body: IGScheduleAll):
    """Every finished Short not on Instagram yet: one per day at the chosen time (India time)."""
    if not IG.status(store)["connected"]:
        raise HTTPException(400, "Connect Instagram in Settings first")
    IG.settings(store, None, body.time)
    plan = []
    for jid in sorted(store.list_dirs("jobs/")):
        st = store.read_json(f"jobs/{jid}/state.json") or {}
        if st.get("stage") == "done" and (st.get("instagram") or {}).get("status") not in (
                "posted", "posting", "scheduled"):
            at = IG.next_slot(store, engine.ig_taken(store))
            _save_state(jid, st, instagram={"status": "scheduled", "at": at})
            plan.append(at)
    if not plan:
        raise HTTPException(400, "No finished Shorts waiting for Instagram")
    return {"count": len(plan), "plan": plan}


@app.get("/api/instagram/tick")
def ig_tick(key: str = ""):
    """Called every 10 minutes by Cloud Scheduler: posts whatever is due."""
    if not hmac.compare_digest(key, _sign("ig-tick")):
        raise HTTPException(403)
    due = []
    for jid in store.list_dirs("jobs/"):
        st = store.read_json(f"jobs/{jid}/state.json") or {}
        ig = st.get("instagram") or {}
        if ig.get("status") == "scheduled" and IG.is_due(ig.get("at", "")):
            _save_state(jid, st, instagram=dict(ig, status="posting", started=engine.now()))
            due.append(jid)
    if due:
        _start_worker("IG", "igbatch", ",".join(due))
    return {"posting": due}


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
