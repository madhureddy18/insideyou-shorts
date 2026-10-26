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
def _trigger(jid, step, arg=""):
    args = ["-m", "app.worker", jid, step] + ([arg] if arg else [])
    if RUN_MODE != "cloudrun":
        threading.Thread(target=engine.run, args=(store, jid, step, arg), daemon=True).start()
        return
    from .ai import _headers
    url = (f"https://run.googleapis.com/v2/projects/{C.PROJECT}/locations/{REGION}/jobs/{WORKER_JOB}:run")
    r = requests.post(url, headers=_headers(),
                      json={"overrides": {"containerOverrides": [{"args": args}]}}, timeout=60)
    if not r.ok:
        raise HTTPException(500, f"Could not start worker: {r.status_code} {r.text[:300]}")


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
    return {"topics": [{"topic": t, "used": t in used} for t in C.TOPIC_BANK],
            "rs_per_shot": C.RS_PER_ANIMATED_SHOT, "rs_base": C.RS_BASE,
            "has_hero": store.read_bytes(C.HERO_REF_KEY) is not None}


class NewJob(BaseModel):
    topic: str = ""
    animate: str = "all"
    num_shots: int = 7
    auto: bool = False


@app.post("/api/jobs")
def create(body: NewJob):
    if body.animate not in ("all", "hook", "none"):
        raise HTTPException(400, "bad animate value")
    jid = engine.new_job_id()
    st = {"id": jid, "created": engine.now(), "topic": body.topic.strip(), "animate": body.animate,
          "num_shots": max(4, min(9, body.num_shots)), "auto": body.auto, "stage": "queued",
          "status": "Starting...", "logs": [], "clips": {}, "images": [],
          "estimate_rs": engine.estimate_rs(body.num_shots, body.animate)}
    _save_state(jid, st)
    _trigger(jid, "auto" if body.auto else "script")
    return st


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
    arg = ",".join(str(i) for i in (body.shots or []))
    _save_state(jid, st, stage="queued", status="Starting...", error=None)
    _trigger(jid, body.step, arg)
    return {"ok": True}


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
    data = store.read_bytes(C.HERO_REF_KEY)
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
