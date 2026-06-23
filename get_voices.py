"""Download + install the base voice pack into ./voices (run with cwd = app/). Cross-platform, idempotent.

OPTIONAL step: the app works in clone mode without it, so this NEVER aborts the installer — any failure
exits 0 with a message (re-run Install to retry). Robust download: huggingface_hub (handles redirects / Xet
/ retries — plain urllib stalls on HF on Windows) with a urllib fallback."""
import os
import shutil
import zipfile

URL = "https://huggingface.co/datasets/nerualdreming/VibeVoice/resolve/main/voice-pack.zip"
os.makedirs("voices", exist_ok=True)
os.makedirs("downloads", exist_ok=True)

if any(f.lower().endswith(".mp3") for f in os.listdir("voices")):
    print("[voices] already present", flush=True)
    raise SystemExit(0)

zp = os.path.join("downloads", "voice-pack.zip")
try:
    try:
        from huggingface_hub import hf_hub_download
        got = hf_hub_download(repo_id="nerualdreming/VibeVoice", repo_type="dataset",
                              filename="voice-pack.zip", local_dir="downloads")
        if os.path.abspath(got) != os.path.abspath(zp):
            shutil.copy(got, zp)
    except Exception as e:
        print(f"[voices] hf_hub_download failed ({e}); falling back to urllib", flush=True)
        import urllib.request
        urllib.request.urlretrieve(URL, zp)

    ex = os.path.join("downloads", "vpx")
    shutil.rmtree(ex, ignore_errors=True)
    with zipfile.ZipFile(zp) as z:
        z.extractall(ex)

    n = 0
    for root, _dirs, files in os.walk(ex):          # flatten: copy every .mp3/.txt regardless of the zip layout
        for f in files:
            if f.lower().endswith((".mp3", ".txt")):
                shutil.copy(os.path.join(root, f), os.path.join("voices", f))
                n += 1
    shutil.rmtree(ex, ignore_errors=True)
    print(f"[voices] installed {n} files", flush=True)
except Exception as e:
    # OPTIONAL — never break the install over the voice pack; clone mode works without it.
    print(f"[voices] SKIP: voice-pack download failed ({e}). Clone mode works without it; re-run Install to retry.", flush=True)
    raise SystemExit(0)
