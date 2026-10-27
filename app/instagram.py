"""Instagram Reels auto-posting (free) - official Instagram API with Instagram Login.

Setup: Instagram professional (Creator) account + a Meta developer app with the Instagram product; generate an
access token for your account in the app dashboard and paste it in Settings. The token is refreshed
automatically so it never hits its 60-day expiry.
"""
import datetime as dt
import time

import requests

GRAPH = "https://graph.instagram.com"
VER = "v26.0"
CFG_KEY = "brand/instagram.json"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))


def cfg(store):
    return store.read_json(CFG_KEY) or {}


def _save(store, c):
    store.write_json(CFG_KEY, c)


def status(store):
    c = cfg(store)
    return {"connected": bool(c.get("token")), "username": c.get("username", ""),
            "auto": bool(c.get("auto")), "time": c.get("time", "19:00"),
            "refreshed": c.get("refreshed", "")}


def _err(r):
    try:
        e = r.json().get("error") or {}
        return f"{r.status_code}: {e.get('message') or r.text[:200]}"
    except Exception:
        return f"{r.status_code}: {r.text[:200]}"


def connect(store, token):
    token = (token or "").strip()
    if len(token) < 20:
        raise RuntimeError("That doesn't look like an access token")
    r = requests.get(f"{GRAPH}/{VER}/me", params={"fields": "user_id,username", "access_token": token}, timeout=30)
    if not r.ok:
        raise RuntimeError("Instagram rejected the token - " + _err(r))
    me = r.json()
    c = cfg(store)
    c.update(token=token, user_id=str(me.get("user_id") or me.get("id")), username=me.get("username", ""),
             refreshed=dt.datetime.now(IST).isoformat(timespec="seconds"))
    _save(store, c)
    return status(store)


def disconnect(store):
    c = cfg(store)
    for k in ("token", "user_id", "username", "refreshed"):
        c.pop(k, None)
    _save(store, c)


def settings(store, auto=None, time_=None):
    c = cfg(store)
    if auto is not None:
        c["auto"] = bool(auto)
    if time_:
        c["time"] = time_
    _save(store, c)
    return status(store)


def token(store):
    """The access token, refreshed every few days so it never expires (needs to be >24h old to refresh)."""
    c = cfg(store)
    if not c.get("token"):
        raise RuntimeError("Instagram isn't connected - paste your token in Settings")
    try:
        last = dt.datetime.fromisoformat(c.get("refreshed", ""))
    except ValueError:
        last = None
    if not last or dt.datetime.now(IST) - last > dt.timedelta(days=5):
        r = requests.get(f"{GRAPH}/refresh_access_token",
                         params={"grant_type": "ig_refresh_token", "access_token": c["token"]}, timeout=30)
        if r.ok and r.json().get("access_token"):
            c["token"] = r.json()["access_token"]
            c["refreshed"] = dt.datetime.now(IST).isoformat(timespec="seconds")
            _save(store, c)
        else:
            print("Instagram token refresh skipped:", _err(r), flush=True)
    return c["token"]


def publish(store, video_url, caption, log=print):
    """Create a Reel from a public video URL, wait for Instagram to process it, publish it."""
    tok = token(store)
    uid = cfg(store)["user_id"]
    h = {"Authorization": f"Bearer {tok}"}
    r = requests.post(f"{GRAPH}/{VER}/{uid}/media", headers=h, timeout=60,
                      json={"media_type": "REELS", "video_url": video_url, "caption": caption[:2200],
                            "share_to_feed": True})
    if not r.ok:
        raise RuntimeError("Instagram didn't accept the video - " + _err(r))
    cid = r.json()["id"]
    log("Instagram is processing the video...")
    t0, code = time.time(), ""
    while time.time() - t0 < 900:
        time.sleep(15)
        s = requests.get(f"{GRAPH}/{VER}/{cid}", headers=h, params={"fields": "status_code,status"}, timeout=30)
        if s.ok:
            code = s.json().get("status_code", "")
            if code == "FINISHED":
                break
            if code in ("ERROR", "EXPIRED"):
                raise RuntimeError(f"Instagram couldn't process the video ({s.json().get('status', code)})")
    if code != "FINISHED":
        raise RuntimeError("Instagram took too long to process the video - try again")
    p = None
    for attempt in range(4):
        p = requests.post(f"{GRAPH}/{VER}/{uid}/media_publish", headers=h, json={"creation_id": cid}, timeout=60)
        if p.ok:
            break
        time.sleep(10 * (attempt + 1))
    if not p.ok:
        raise RuntimeError("Instagram publish failed - " + _err(p))
    mid = p.json()["id"]
    link = ""
    q = requests.get(f"{GRAPH}/{VER}/{mid}", headers=h, params={"fields": "permalink"}, timeout=30)
    if q.ok:
        link = q.json().get("permalink", "")
    return {"id": mid, "url": link}


def next_slot(store, taken):
    """Next free daily posting time (IST) after the ones already planned."""
    hh, mm = (int(x) for x in (cfg(store).get("time") or "19:00").split(":"))
    now = dt.datetime.now(IST)
    when = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
    if when < now + dt.timedelta(minutes=10):
        when += dt.timedelta(days=1)
    days = set()
    for t in taken:
        try:
            days.add(dt.datetime.fromisoformat(t).astimezone(IST).date())
        except ValueError:
            pass
    while when.date() in days:
        when += dt.timedelta(days=1)
    return when.isoformat(timespec="seconds")


def is_due(at):
    try:
        return dt.datetime.fromisoformat(at) <= dt.datetime.now(IST)
    except ValueError:
        return False
