module.exports = async (kernel) => {
  const port = await kernel.port()
  return {
    daemon: true,
    run: [
      {
        method: "shell.run",
        params: {
          venv: "env",
          venv_python: "3.11",
          path: "app",
          env: {
            // MUST be set before torch / llama_cpp import
            KMP_DUPLICATE_LIB_OK: "TRUE",
            PYTHONUTF8: "1",
            PYTHONIOENCODING: "utf-8",
            PYTHONUNBUFFERED: "1",
            PYTORCH_CUDA_ALLOC_CONF: "expandable_segments:True",
            // keep every cache / model / voice inside the app folder (nothing touches the system)
            HF_HOME: "{{path.resolve(cwd, 'app/models')}}",
            HUGGINGFACE_HUB_CACHE: "{{path.resolve(cwd, 'app/models')}}",
            DUBENGINE_MODELS_ROOT: "{{path.resolve(cwd, 'app/models')}}",
            TORCH_HOME: "{{path.resolve(cwd, 'app/models/torch')}}",
            XDG_CACHE_HOME: "{{path.resolve(cwd, 'app/cache')}}",
            DUBENGINE_VOICES: "{{path.resolve(cwd, 'app/voices')}}",
            // multi-speaker diarization sub-venv (NVIDIA); a missing path just degrades to single-speaker
            DUBENGINE_SORTFORMER_PY: "{{platform === 'win32' ? path.resolve(cwd, 'app/.venv-sortformer/Scripts/python.exe') : path.resolve(cwd, 'app/.venv-sortformer/bin/python')}}",
            // FFmpeg WITH libass lives in app/ffmpeg (get_ffmpeg.py) — put it FIRST on PATH so the engine's bare
            // `ffmpeg` resolves to the libass build, not Pinokio's bundled ffmpeg (no libass -> caption burn fails).
            // Pinokio requires PATH as an ARRAY of extra dirs and merges the system PATH in itself (init_env).
            PATH: ["{{path.resolve(cwd, 'app/ffmpeg')}}"]
          },
          // single-worker FastAPI; it serves frontend/dist same-origin. First run downloads the models.
          message: [
            `python -m uvicorn backend.app:app --host 127.0.0.1 --port ${port}`
          ],
          on: [{
            event: "/(https?:\\/\\/[0-9.]+:[0-9]+)/",   // capture "http://127.0.0.1:<port>" from the uvicorn banner
            done: true
          }]
        }
      },
      {
        method: "local.set",
        params: { url: "{{input.event[1]}}" }
      }
    ]
  }
}
