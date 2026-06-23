module.exports = {
  run: [
    // pull the launcher scripts
    { method: "shell.run", params: { message: "git pull" } },
    // pull the app
    { method: "shell.run", params: { path: "app", message: "git pull" } },
    // re-install the editable engine + rebuild the SPA (the app may have changed)
    { method: "shell.run", params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install -e dub-engine --no-deps" } },
    { method: "shell.run", params: { path: "app/frontend", message: ["npm install", "npx vite build"] } }
  ]
}
