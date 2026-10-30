"""Posting queue for finished videos you upload yourself (e.g. @maddieandchotu), separate from the Shorts maker.

Each queued Reel lives in reels/<acct>/<id>/ with video.mp4 + meta.json. Videos are uploaded in small chunks
(Cloud Run caps one request at 32 MB) and joined in the bucket. The 10-minute Cloud Scheduler tick posts
whatever is due, at the account's daily slots (default 08:00 and 19:30 India time).
"""
import datetime as dt
import re
import secrets
import tempfile
import traceback
from pathlib import Path

from . import instagram as IG

IST = IG.IST
DEFAULT_SLOTS = ["08:00", "19:30"]
ACCT_RE = re.compile(r"^[a-z0-9_]{2,40}$")
ID_RE = re.compile(r"^[a-z0-9]{6,20}$")


def now():
    return dt.datetime.now(IST).isoformat(timespec="seconds")


def check(acct, rid=None):
    if not ACCT_RE.match(acct or "") or (rid is not None and not ID_RE.match(rid or "")):
        raise ValueError("bad account or reel id")


def _dir(acct, rid):
    return f"reels/{acct}/{rid}/"


def get(store, acct, rid):
    return store.read_json(_dir(acct, rid) + "meta.json")


def put(store, acct, rid, meta):
    meta["updated"] = now()
    store.write_json(_dir(acct, rid) + "meta.json", meta)
    return meta


def items(store, acct):
    out = []
    for rid in store.list_dirs(f"reels/{acct}/"):
        m = get(store, acct, rid)
        if m:
            out.append(m)
    # upcoming first (by time), then history newest first
    pending = sorted([m for m in out if m.get("status") in ("uploading", "scheduled", "posting", "failed", "paused")],
                     key=lambda m: m.get("at") or "9999")
    done = sorted([m for m in out if m.get("status") == "posted"], key=lambda m: m.get("posted", ""), reverse=True)
    return pending + done


def slots(store, acct):
    s = IG.cfg(store, acct).get("slots") or DEFAULT_SLOTS
    return sorted(x for x in s if re.fullmatch(r"\d{2}:\d{2}", x))


def set_slots(store, acct, new):
    new = sorted({x.strip() for x in new if re.fullmatch(r"\d{2}:\d{2}", x.strip())})
    if not new:
        raise ValueError("Add at least one time like 08:00")
    c = IG.cfg(store, acct)
    c["slots"] = new
    IG._save(store, c, acct)
    return new


def next_slot(store, acct, skip=None):
    """Earliest daily slot (IST) at least 10 minutes away that no other queued Reel already has."""
    taken = {m.get("at") for m in items(store, acct)
             if m.get("status") in ("scheduled", "posting", "paused") and m.get("id") != skip}
    taken |= {m.get("at") for m in items(store, acct) if m.get("status") == "posted"}
    now_ = dt.datetime.now(IST)
    day = now_.date()
    for _ in range(400):
        for hm in slots(store, acct):
            hh, mm = (int(x) for x in hm.split(":"))
            when = dt.datetime(day.year, day.month, day.day, hh, mm, tzinfo=IST)
            iso = when.isoformat(timespec="seconds")
            if when >= now_ + dt.timedelta(minutes=10) and iso not in taken:
                return iso
        day += dt.timedelta(days=1)
    raise RuntimeError("No free slot found")


def create(store, acct, caption, name=""):
    rid = secrets.token_hex(5)
    return put(store, acct, rid, {"id": rid, "acct": acct, "caption": caption.strip(), "name": name[:120],
                                  "status": "uploading", "created": now(), "parts": 0})


def add_chunk(store, acct, rid, i, data):
    store.write_bytes(_dir(acct, rid) + f"part{i:04d}", data, "application/octet-stream")


def finish_upload(store, acct, rid, parts, at=""):
    """Join the uploaded chunks into video.mp4 and put the Reel in the queue."""
    m = get(store, acct, rid)
    if not m:
        raise ValueError("Upload not found")
    keys = [_dir(acct, rid) + f"part{i:04d}" for i in range(parts)]
    dest = _dir(acct, rid) + "video.mp4"
    if store.bucket_name:
        from google.cloud import storage                       # noqa: F401  (bucket compose, 32 parts per call)
        b = store._bucket
        srcs = [b.blob(k) for k in keys]
        while len(srcs) > 32:
            merged = []
            for j in range(0, len(srcs), 32):
                tmp = b.blob(_dir(acct, rid) + f"merge{len(srcs)}_{j:04d}")
                tmp.compose(srcs[j:j + 32])
                merged.append(tmp)
            srcs = merged
        out = b.blob(dest)
        out.content_type = "video/mp4"
        out.compose(srcs)
        for blob in b.list_blobs(prefix=_dir(acct, rid)):
            if not blob.name.endswith(("video.mp4", "meta.json")):
                blob.delete()
        size = b.get_blob(dest).size
    else:
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "v.mp4"
            with open(p, "wb") as f:
                for k in keys:
                    f.write(store.read_bytes(k) or b"")
            store.upload_file(p, dest)
            size = p.stat().st_size
        for k in keys:
            store.delete(k)
    if size < 50_000:
        raise ValueError("The video looks empty - try uploading again")
    m.update(status="scheduled", at=at or next_slot(store, acct, skip=rid), size=size, parts=parts, error=None)
    return put(store, acct, rid, m)


def update(store, acct, rid, caption=None, at=None, status=None):
    m = get(store, acct, rid)
    if not m:
        raise ValueError("Not found")
    if m.get("status") == "posting":
        raise ValueError("It's posting right now")
    if caption is not None:
        m["caption"] = caption.strip()
    if at:
        dt.datetime.fromisoformat(at)
        m["at"] = at
    if status in ("scheduled", "paused"):
        m["status"] = status
        if status == "scheduled" and m.get("error"):
            m["error"] = None
    return put(store, acct, rid, m)


def delete(store, acct, rid):
    store.delete_prefix(_dir(acct, rid))


def due(store):
    """(acct, id) pairs whose time has come, across all accounts. Marks them as posting."""
    out = []
    for acct in store.list_dirs("reels/"):
        if not ACCT_RE.match(acct):
            continue
        for m in items(store, acct):
            if m.get("status") == "scheduled" and IG.is_due(m.get("at", "")):
                m.update(status="posting", started=now())
                put(store, acct, m["id"], m)
                out.append(f"{acct}/{m['id']}")
    return out


def post(store, acct, rid):
    m = get(store, acct, rid) or {}
    try:
        url = store.signed_url(_dir(acct, rid) + "video.mp4", minutes=240)
        if not url:
            raise RuntimeError("Couldn't make a link to the video for Instagram (run deploy.sh again)")
        res = IG.publish(store, url, m.get("caption", ""), acct=acct)
        m.update(status="posted", ig_id=res["id"], url=res["url"], posted=now(), error=None)
        print(f"posted @{acct} reel {rid}:", res["url"], flush=True)
    except Exception as e:
        traceback.print_exc()
        m.update(status="failed", error=str(e)[:300], tried=now())
    m = dict(get(store, acct, rid) or m, **{k: m.get(k) for k in ("status", "ig_id", "url", "posted", "error", "tried")})
    put(store, acct, rid, m)
    return m
