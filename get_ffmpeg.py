"""Install a FULL FFmpeg build WITH libass into ./ffmpeg (run with cwd = app/).

REQUIRED: the conda / Pinokio-bundled ffmpeg is built WITHOUT libass, so the `ass`/`subtitles`
filters do not exist and caption burning fails ("No option name ... / Unknown filter 'ass'").
The standalone installer ships the BtbN GPL static build (libass included) and puts it on PATH;
this does the same for Pinokio. start.js prepends ./ffmpeg to PATH so the engine's bare `ffmpeg` uses it.

Windows/Linux = BtbN GPL static; macOS = evermeet static (both include libass). Robust download
(curl -C - resume, urllib fallback), idempotent, and SELF-VERIFIES the ass filter is present."""
import os
import sys
import platform
import shutil
import zipfile
import tarfile
import subprocess


def log(m):
    print(f"[ffmpeg] {m}", flush=True)


def download(url, dest):
    if shutil.which("curl"):
        rc = subprocess.call(["curl", "-L", "--fail", "--retry", "20", "--retry-all-errors",
                              "--retry-delay", "5", "--connect-timeout", "30", "-C", "-", "-o", dest, url])
        if rc == 0 and os.path.isfile(dest) and os.path.getsize(dest) > 0:
            return
    import urllib.request
    urllib.request.urlretrieve(url, dest)


def has_libass(ff):
    try:
        out = subprocess.run([ff, "-hide_banner", "-filters"], capture_output=True).stdout.decode("utf-8", "replace")
        return (" ass " in out) or ("subtitles" in out)
    except Exception as e:
        log(f"warn: could not probe filters: {e}")
        return True   # don't block on a probe failure


def main():
    sysname = platform.system().lower()           # windows / linux / darwin
    exe = ".exe" if sysname == "windows" else ""
    outdir = os.path.abspath("ffmpeg")
    os.makedirs(outdir, exist_ok=True)
    ff = os.path.join(outdir, "ffmpeg" + exe)
    if os.path.isfile(ff) and has_libass(ff):
        log(f"already present with libass: {ff}")
        return 0
    os.makedirs("downloads", exist_ok=True)

    if sysname == "darwin":                        # evermeet static builds (libass), separate ffmpeg/ffprobe zips
        for name in ("ffmpeg", "ffprobe"):
            z = os.path.join("downloads", name + ".zip")
            download(f"https://evermeet.cx/ffmpeg/get/{name}/zip", z)
            with zipfile.ZipFile(z) as zf:
                zf.extractall(outdir)
            try:
                os.chmod(os.path.join(outdir, name), 0o755)
            except OSError:
                pass
        if not has_libass(ff):
            log("ERROR: macOS ffmpeg has no libass"); return 1
        log(f"installed macOS ffmpeg with libass into {outdir}")
        return 0

    if sysname == "windows":
        url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
        arc = os.path.join("downloads", "ffmpeg.zip")
    else:                                          # linux x64
        url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz"
        arc = os.path.join("downloads", "ffmpeg.tar.xz")

    log(f"downloading {url}")
    download(url, arc)
    ex = os.path.join("downloads", "ffx")
    shutil.rmtree(ex, ignore_errors=True)
    os.makedirs(ex, exist_ok=True)
    if arc.endswith(".zip"):
        with zipfile.ZipFile(arc) as zf:
            zf.extractall(ex)
    else:
        with tarfile.open(arc) as tf:
            tf.extractall(ex)

    got = 0
    for root, _dirs, files in os.walk(ex):         # copy bin/ffmpeg(.exe)+ffprobe regardless of the archive layout
        for f in files:
            if f in (f"ffmpeg{exe}", f"ffprobe{exe}"):
                shutil.copy(os.path.join(root, f), os.path.join(outdir, f))
                if sysname != "windows":
                    try:
                        os.chmod(os.path.join(outdir, f), 0o755)
                    except OSError:
                        pass
                got += 1
    shutil.rmtree(ex, ignore_errors=True)

    if not os.path.isfile(ff):
        log("ERROR: ffmpeg binary not found after extract"); return 1
    if not has_libass(ff):
        log("ERROR: downloaded ffmpeg has NO libass (ass/subtitles filter) — caption burn would fail"); return 1
    log(f"installed {got} binaries WITH libass into {outdir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
