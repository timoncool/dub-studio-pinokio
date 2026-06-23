"""Launcher entrypoint (NOT part of the app — lives in the launcher, the app repo is untouched).

Prepends the bundled libass FFmpeg in app/ffmpeg to PATH *inside this Python process*, then runs the
unchanged backend. dub-engine calls bare `subprocess(["ffmpeg", ...])`, which inherits this process's
PATH, so it resolves to the libass build — Pinokio's bundled/conda ffmpeg has NO libass, which breaks
caption burning ("Unknown filter 'ass'"). Setting PATH in the shell is unreliable (conda/venv activation
re-prepends its own dirs, and cmd expands %PATH% at parse time, before activation); setting it in-process
is deterministic. Usage: python serve.py <port>   (cwd = app)."""
import os
import sys

ffdir = os.path.join(os.getcwd(), "ffmpeg")           # cwd is app/ (Pinokio shell.run path:"app")
if os.path.isdir(ffdir):
    os.environ["PATH"] = ffdir + os.pathsep + os.environ.get("PATH", "")
    # Pinokio's bundled ffmpeg.js exports FFMPEG_PATH/FFPROBE_PATH pointing at its libass-LESS build —
    # point them at ours too, so anything that honors those vars gets the libass binary.
    _exe = ".exe" if os.name == "nt" else ""
    os.environ["FFMPEG_PATH"] = os.path.join(ffdir, "ffmpeg" + _exe)
    os.environ["FFPROBE_PATH"] = os.path.join(ffdir, "ffprobe" + _exe)

# We're launched by ABSOLUTE path from the launcher root, so Python sets sys.path[0] to the launcher dir,
# NOT cwd. Add cwd (== app/, set by start.js path:"app") so uvicorn can import the `backend` package —
# the `python -m uvicorn` form did this implicitly; a bare script does not. (Fixes ModuleNotFoundError: backend.)
sys.path.insert(0, os.getcwd())

import uvicorn
uvicorn.run("backend.app:app", host="127.0.0.1", port=int(sys.argv[1]))
