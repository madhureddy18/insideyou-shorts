"""Storage for jobs and brand files: Google Cloud Storage in production, a local folder for dev/tests."""
import json
import os
from pathlib import Path


class Store:
    def __init__(self):
        self.bucket_name = os.environ.get("BUCKET", "")
        if self.bucket_name:
            from google.cloud import storage
            self._client = storage.Client(project=os.environ.get("PROJECT_ID") or None)
            self._bucket = self._client.bucket(self.bucket_name)
        else:
            self.root = Path(os.environ.get("DATA_DIR", "./data"))
            self.root.mkdir(parents=True, exist_ok=True)

    # ---------- raw bytes ----------
    def read_bytes(self, key):
        if self.bucket_name:
            blob = self._bucket.blob(key)
            try:
                return blob.download_as_bytes()
            except Exception:
                return None
        p = self.root / key
        return p.read_bytes() if p.exists() else None

    def write_bytes(self, key, data, content_type="application/octet-stream"):
        if self.bucket_name:
            import time
            for attempt in range(6):            # GCS allows ~1 write per second to the same file
                try:
                    blob = self._bucket.blob(key)
                    blob.cache_control = "no-cache"
                    blob.upload_from_string(data, content_type=content_type)
                    return
                except Exception as e:
                    if "429" not in str(e) and "rate limit" not in str(e).lower() or attempt == 5:
                        raise
                    time.sleep(1.5 * (attempt + 1))
        p = self.root / key
        p.parent.mkdir(parents=True, exist_ok=True)
        tmp = p.with_suffix(p.suffix + ".tmp")
        tmp.write_bytes(data)
        tmp.replace(p)

    # ---------- json ----------
    def read_json(self, key, default=None):
        b = self.read_bytes(key)
        return json.loads(b) if b else default

    def write_json(self, key, obj):
        self.write_bytes(key, json.dumps(obj, indent=1).encode(), "application/json")

    # ---------- files ----------
    def upload_file(self, path, key):
        path = Path(path)
        ctype = {".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".mp3": "audio/mpeg",
                 ".json": "application/json", ".txt": "text/plain"}.get(path.suffix, "application/octet-stream")
        if self.bucket_name:
            blob = self._bucket.blob(key)
            blob.cache_control = "no-cache"
            blob.upload_from_filename(str(path), content_type=ctype)
            return
        self.write_bytes(key, path.read_bytes())

    def list_names(self, prefix):
        """File names directly under prefix (no sub-folders)."""
        if self.bucket_name:
            return [b.name[len(prefix):] for b in self._client.list_blobs(self.bucket_name, prefix=prefix)
                    if "/" not in b.name[len(prefix):]]
        d = self.root / prefix
        return sorted(p.name for p in d.iterdir() if p.is_file()) if d.exists() else []

    def list_dirs(self, prefix):
        """Sub-folder names directly under prefix."""
        if self.bucket_name:
            it = self._client.list_blobs(self.bucket_name, prefix=prefix, delimiter="/")
            for _ in it:
                pass
            return sorted(p[len(prefix):].rstrip("/") for p in it.prefixes)
        d = self.root / prefix
        return sorted(p.name for p in d.iterdir() if p.is_dir()) if d.exists() else []

    def download_file(self, key, path):
        """Copy one object straight to disk (no big bytes in memory). False if it doesn't exist."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_name(path.name + ".part")
        try:
            if self.bucket_name:
                self._bucket.blob(key).download_to_filename(str(tmp))
            else:
                src = self.root / key
                if not src.exists():
                    return False
                tmp.write_bytes(src.read_bytes())
        except Exception:
            tmp.unlink(missing_ok=True)
            return False
        tmp.replace(path)
        return True

    def signed_url(self, key, minutes=120, download_name=None):
        """Direct, temporary link to a file in the bucket (big videos never pass through the app).
        None when signing isn't possible (local dev, or the permission isn't granted yet)."""
        if not self.bucket_name:
            return None
        try:
            import datetime
            import google.auth
            from google.auth.transport.requests import Request
            creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
            creds.refresh(Request())
            sa = os.environ.get("APP_SA") or getattr(creds, "service_account_email", None)
            if not sa or sa == "default":
                return None
            blob = self._bucket.blob(key)
            if not blob.exists():
                return None
            kw = {}
            if download_name:
                kw["response_disposition"] = f'attachment; filename="{download_name}"'
            return blob.generate_signed_url(version="v4", expiration=datetime.timedelta(minutes=minutes),
                                            method="GET", service_account_email=sa,
                                            access_token=creds.token, **kw)
        except Exception as e:
            print("signed link failed, streaming instead:", str(e)[:200], flush=True)
            return None

    def download_prefix(self, prefix, dest):
        dest = Path(dest)
        dest.mkdir(parents=True, exist_ok=True)
        for name in self.list_names(prefix):
            data = self.read_bytes(prefix + name)
            if data is not None:
                (dest / name).write_bytes(data)

    def delete(self, key):
        if self.bucket_name:
            try:
                self._bucket.blob(key).delete()
            except Exception:
                pass
            return
        (self.root / key).unlink(missing_ok=True)

    def delete_prefix(self, prefix):
        if self.bucket_name:
            for b in self._client.list_blobs(self.bucket_name, prefix=prefix):
                b.delete()
            return
        import shutil
        shutil.rmtree(self.root / prefix, ignore_errors=True)
