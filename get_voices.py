"""Download + install the base voice pack into ./voices (run with cwd = app/). Cross-platform, idempotent."""
import os, urllib.request, zipfile, shutil

URL = "https://huggingface.co/datasets/nerualdreming/VibeVoice/resolve/main/voice-pack.zip"
os.makedirs("voices", exist_ok=True)
os.makedirs("downloads", exist_ok=True)

if any(f.lower().endswith(".mp3") for f in os.listdir("voices")):
    print("[voices] already present", flush=True)
    raise SystemExit(0)

zp = os.path.join("downloads", "voice-pack.zip")
print("[voices] downloading base voice pack...", flush=True)
urllib.request.urlretrieve(URL, zp)

ex = os.path.join("downloads", "vpx")
shutil.rmtree(ex, ignore_errors=True)
with zipfile.ZipFile(zp) as z:
    z.extractall(ex)

n = 0
for root, _dirs, files in os.walk(ex):          # flatten: copy every .mp3/.txt regardless of the zip's inner layout
    for f in files:
        if f.lower().endswith((".mp3", ".txt")):
            shutil.copy(os.path.join(root, f), os.path.join("voices", f))
            n += 1
shutil.rmtree(ex, ignore_errors=True)
print(f"[voices] installed {n} files", flush=True)
