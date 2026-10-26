"""YouTube upload: OAuth connect (your channel) + resumable upload with scheduling. Free (API quota, no credits).

Note: videos uploaded through an API project that hasn't passed YouTube's free API audit are kept private by
YouTube. Until the audit is approved, flip them to Public/Scheduled in YouTube Studio (one tap)."""
import json
import os
import time
import urllib.parse
from pathlib import Path

import requests

SCOPES = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
CFG_KEY = "brand/youtube.json"          # {client_id, client_secret, refresh_token, channel_title, channel_id}
FAKE = os.environ.get("FAKE_AI") == "1"


def cfg(store):
    return store.read_json(CFG_KEY) or {}


def status(store):
    c = cfg(store)
    return {"has_client": bool(c.get("client_id") and c.get("client_secret")),
            "connected": bool(c.get("refresh_token")), "channel_title": c.get("channel_title", ""),
            "client_id": c.get("client_id", ""), "audited": bool(c.get("audited"))}


def save_client(store, client_id, client_secret, audited=None):
    c = cfg(store)
    if client_id:
        if client_id != c.get("client_id"):
            c.pop("refresh_token", None)
        c["client_id"] = client_id.strip()
    if client_secret:
        c["client_secret"] = client_secret.strip()
    if audited is not None:
        c["audited"] = bool(audited)
    store.write_json(CFG_KEY, c)


def auth_url(store, redirect_uri, state):
    c = cfg(store)
    q = {"client_id": c["client_id"], "redirect_uri": redirect_uri, "response_type": "code", "scope": SCOPES,
         "access_type": "offline", "prompt": "consent select_account", "include_granted_scopes": "true",
         "state": state}
    return AUTH_URL + "?" + urllib.parse.urlencode(q)


def finish_connect(store, code, redirect_uri):
    c = cfg(store)
    r = requests.post(TOKEN_URL, data={"code": code, "client_id": c["client_id"], "client_secret": c["client_secret"],
                                       "redirect_uri": redirect_uri, "grant_type": "authorization_code"}, timeout=30)
    if not r.ok:
        raise RuntimeError(f"Google sign-in failed: {r.text[:200]}")
    tok = r.json()
    if not tok.get("refresh_token"):
        raise RuntimeError("Google didn't return a refresh token - remove the app at myaccount.google.com/permissions and connect again")
    c["refresh_token"] = tok["refresh_token"]
    ch = requests.get("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
                      headers={"Authorization": "Bearer " + tok["access_token"]}, timeout=30).json()
    items = ch.get("items") or []
    c["channel_title"] = items[0]["snippet"]["title"] if items else "(no channel found on this account)"
    c["channel_id"] = items[0]["id"] if items else ""
    store.write_json(CFG_KEY, c)
    return c["channel_title"]


def disconnect(store):
    c = cfg(store)
    for k in ("refresh_token", "channel_title", "channel_id"):
        c.pop(k, None)
    store.write_json(CFG_KEY, c)


def _access_token(store):
    c = cfg(store)
    if not c.get("refresh_token"):
        raise RuntimeError("YouTube is not connected - open Settings and tap Connect YouTube")
    r = requests.post(TOKEN_URL, data={"client_id": c["client_id"], "client_secret": c["client_secret"],
                                       "refresh_token": c["refresh_token"], "grant_type": "refresh_token"}, timeout=30)
    if not r.ok:
        raise RuntimeError("YouTube connection expired - open Settings and connect again (" + r.text[:120] + ")")
    return r.json()["access_token"]


def upload(store, video_path, title, description, tags, publish_at=None, privacy="public"):
    """privacy: public | unlisted | private. publish_at (RFC3339) schedules it (YouTube needs it private until then).
    Returns {"id", "url", "privacy", "publish_at"}."""
    title = (title or "Untitled").strip()
    if "#shorts" not in title.lower() and "#shorts" not in (description or "").lower():
        title = (title[:91] + " #shorts") if len(title) > 91 else title + " #shorts"
    st = {"privacyStatus": "private" if publish_at else privacy, "selfDeclaredMadeForKids": False,
          "containsSyntheticMedia": True, "embeddable": True}
    if publish_at:
        st["publishAt"] = publish_at
    meta = {"snippet": {"title": title[:100], "description": (description or "")[:4900],
                        "tags": [t[:30] for t in (tags or [])][:15], "categoryId": "27"},     # 27 = Education
            "status": st}
    if FAKE:
        time.sleep(0.5)
        return {"id": "FAKE123", "url": "https://youtube.com/shorts/FAKE123", "privacy": st["privacyStatus"],
                "publish_at": publish_at}
    tok = _access_token(store)
    size = Path(video_path).stat().st_size
    init = requests.post("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
                         headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json; charset=UTF-8",
                                  "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)},
                         data=json.dumps(meta), timeout=60)
    if not init.ok:
        raise RuntimeError(f"YouTube refused the upload: {init.status_code} {init.text[:300]}")
    loc = init.headers["Location"]
    for attempt in range(4):
        with open(video_path, "rb") as f:
            r = requests.put(loc, headers={"Authorization": "Bearer " + tok, "Content-Type": "video/mp4"},
                             data=f, timeout=900)
        if r.status_code in (200, 201):
            v = r.json()
            return {"id": v["id"], "url": f"https://youtube.com/shorts/{v['id']}",
                    "privacy": v.get("status", {}).get("privacyStatus", st["privacyStatus"]), "publish_at": publish_at}
        if r.status_code >= 500:
            time.sleep(5 * (attempt + 1))
            continue
        raise RuntimeError(f"Upload failed: {r.status_code} {r.text[:300]}")
    raise RuntimeError("Upload failed after retries (YouTube busy)")
