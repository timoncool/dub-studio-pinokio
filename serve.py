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

import uvicorn
uvicorn.run("backend.app:app", host="127.0.0.1", port=int(sys.argv[1]))
