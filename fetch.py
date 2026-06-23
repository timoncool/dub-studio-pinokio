"""Robust large-file downloader for flaky / VPN connections (resume + many retries).

Usage: python fetch.py <url> <dest>

Prefers curl (-C - resume across -L redirects, --retry-all-errors) so a dropped
200MB wheel resumes instead of restarting; falls back to urllib full-download
retries when curl is absent. Idempotent. Exit 0 on success, 1 when it gives up."""
import os
import sys
import time
import shutil
import subprocess


def via_curl(url, dest):
    tmp = dest + ".part"
    cmd = ["curl", "-L", "--fail", "--retry", "20", "--retry-all-errors",
           "--retry-delay", "5", "--connect-timeout", "30", "-C", "-", "-o", tmp, url]
    if subprocess.call(cmd) == 0 and os.path.isfile(tmp) and os.path.getsize(tmp) > 0:
        os.replace(tmp, dest)
        return True
    return False


def via_urllib(url, dest):
    import urllib.request
    tmp = dest + ".part"
    for i in range(1, 16):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 dub-studio"})
            with urllib.request.urlopen(req, timeout=60) as r, open(tmp, "wb") as f:
                shutil.copyfileobj(r, f, 1 << 20)
            os.replace(tmp, dest)
            return True
        except Exception as e:
            print(f"[fetch] urllib attempt {i} failed: {e}", flush=True)
            time.sleep(min(3 * i, 30))
    return False


def main(url, dest):
    d = os.path.dirname(os.path.abspath(dest))
    if d:
        os.makedirs(d, exist_ok=True)
    if os.path.isfile(dest) and os.path.getsize(dest) > 0:
        print(f"[fetch] already have {dest}", flush=True)
        return 0
    if shutil.which("curl"):
        print(f"[fetch] curl -> {dest}", flush=True)
        if via_curl(url, dest):
            print(f"[fetch] OK ({os.path.getsize(dest)} bytes)", flush=True)
            return 0
        print("[fetch] curl failed; trying urllib", flush=True)
    if via_urllib(url, dest):
        print(f"[fetch] OK ({os.path.getsize(dest)} bytes)", flush=True)
        return 0
    print("[fetch] GAVE UP", flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
