module.exports = {
  requires: { bundle: "ai" },   // triggers Pinokio's local-AI prerequisites (CUDA toolkit on NVIDIA, HF CLI, etc.)
  run: [
    // 1) clone the app
    {
      when: "{{!exists('app')}}",
      method: "shell.run",
      params: { message: "git clone https://github.com/timoncool/dub-studio app" }
    },

    // 2) ffmpeg + ffprobe (the engine shells out to them) — cross-platform via conda, on PATH for every Pinokio shell
    {
      method: "shell.run",
      params: { message: "conda install -y -c conda-forge ffmpeg" }
    },

    // 3) torch (+ triton-windows / flash-attn on NVIDIA Windows) — cross-platform, see torch.js
    {
      method: "script.start",
      params: { uri: "torch.js", params: { venv: "env", venv_python: "3.11", path: "app", triton: true, flashattention: true } }
    },

    // 4) thin backend deps (FastAPI / uvicorn)
    {
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install -r requirements.txt" }
    },

    // 5) engine ML stack. Win/Linux use the pinned file as-is (onnxruntime-gpu + bitsandbytes have wheels there).
    //    macOS has no onnxruntime-gpu/bnb wheels -> install onnxruntime instead and skip bnb (engine TTS uses bf16).
    {
      when: "{{platform !== 'darwin'}}",
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install -r requirements-engine.txt" }
    },
    {
      when: "{{platform === 'darwin'}}",
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install numpy==2.4.6 scipy==1.17.1 soundfile==0.14.0 librosa==0.11.0 pyloudnorm==0.1.1 'pydantic>=2,<3' onnx-asr==0.11.0 onnxruntime==1.26.0 transformers==4.57.3 accelerate==1.12.0 sentencepiece==0.2.1 safetensors==0.8.0 einops==0.8.2 torchdiffeq==0.2.5 omegaconf==2.3.1 audio-separator==0.44.2 rapidocr==3.8.4 opencv-python==4.13.0.92 pillow==12.2.0 Resemblyzer==0.1.4 huggingface_hub==0.36.2 hf-xet==1.5.1 ffmpeg-python==0.2.0" }
    },

    // 6) llama-cpp-python (Gemma MT + vision) — REQUIRED. Per-platform build:
    //    NVIDIA Win/Linux = JamePeng cu128 GGUF wheel (cp311); Apple Silicon = Metal; everything else = CPU.
    {
      when: "{{gpu === 'nvidia' && platform === 'win32'}}",
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install https://github.com/JamePeng/llama-cpp-python/releases/download/v0.3.40-cu128-win-20260608/llama_cpp_python-0.3.40%2Bcu128-cp311-cp311-win_amd64.whl" }
    },
    {
      when: "{{gpu === 'nvidia' && platform === 'linux' && arch !== 'arm64'}}",
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install https://github.com/JamePeng/llama-cpp-python/releases/download/v0.3.40-cu128-linux-20260607/llama_cpp_python-0.3.40%2Bcu128-cp311-cp311-linux_x86_64.whl" }
    },
    {
      when: "{{platform === 'darwin' && arch === 'arm64'}}",
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/metal" }
    },
    {
      when: "{{!(gpu === 'nvidia' && platform === 'win32') && !(gpu === 'nvidia' && platform === 'linux' && arch !== 'arm64') && !(platform === 'darwin' && arch === 'arm64')}}",
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu" }
    },

    // 7) Qwen3-TTS engine (REQUIRED, cross-platform). The OPTIONAL Triton combo kernels are installed LAST
    //    (after verify), so their git build over a flaky/VPN connection can never abort the core install.
    {
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "uv pip install faster-qwen3-tts==0.2.6 qwen-tts==0.1.1" }
    },

    // 8) dub-engine (bundled in the repo) — put it on the env's import path via a .pth file.
    //    NOT `uv pip install -e`: a PEP 660 editable build fetches setuptools through build-isolation,
    //    which dies on flaky / VPN connections and ABORTS the whole install (that was the "/" 404 root —
    //    dubengine never registered, so the install stopped before building the SPA). A .pth needs no
    //    build backend and no network, so it cannot fail.
    {
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app",
        message: "python -c \"import sysconfig,os;open(os.path.join(sysconfig.get_paths()['purelib'],'dubengine.pth'),'w').write(os.path.abspath('dub-engine'))\"" }
    },

    // 9) build the React SPA — REQUIRED (FastAPI serves frontend/dist same-origin). Done BEFORE the optional
    //    Sortformer / voice-pack steps so a hiccup there can never leave the app without its UI (the "/" 404).
    {
      method: "shell.run",
      params: { path: "app/frontend", message: ["npm install --no-audit --no-fund", "npm run build"] }
    },
    // 10) verify the install is actually usable: the SPA built AND the core stack imports — else fail LOUD.
    {
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "python -c \"import os,sys;sys.exit(0 if os.path.isfile('frontend/dist/index.html') else 'SPA not built: frontend/dist missing - run Install again')\" && python -c \"import dubengine.pipeline,qwen_tts,faster_qwen3_tts,llama_cpp,torch\"" }
    },

    // 12) Qwen3-TTS Triton combo kernels — OPTIONAL (NVIDIA only). Faster TTS; engine falls back to bnb-NF4
    //     without it. Fully non-fatal (BOTH commands guarded) — a git build hiccup must never break the install.
    {
      when: "{{gpu === 'nvidia' && platform !== 'darwin'}}",
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: [
        "uv pip install hatchling editables {{platform === 'win32' ? '|| ver>nul' : '|| true'}}",
        "uv pip install --no-deps --no-build-isolation --ignore-requires-python git+https://github.com/newgrit1004/qwen3-tts-triton {{platform === 'win32' ? '|| ver>nul' : '|| true'}}"
      ] }
    },

    // 8b) Sortformer NeMo sub-venv — multi-speaker diarization (NVIDIA Win/Linux only, optional / fully non-fatal).
    //     The pipeline runs without it (single-speaker fallback); start.js points the engine at it when present.
    {
      when: "{{gpu === 'nvidia' && platform !== 'darwin'}}",
      method: "shell.run",
      params: { path: "app", message: [
        'uv venv .venv-sortformer --python 3.11 {{platform === "win32" ? "|| ver>nul" : "|| true"}}',
        'uv pip install --python {{platform === "win32" ? ".venv-sortformer/Scripts/python.exe" : ".venv-sortformer/bin/python"}} torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cu128 {{platform === "win32" ? "|| ver>nul" : "|| true"}}',
        'uv pip install --python {{platform === "win32" ? ".venv-sortformer/Scripts/python.exe" : ".venv-sortformer/bin/python"}} "nemo_toolkit[asr]" "cuda-python>=12.3" {{platform === "win32" ? "|| ver>nul" : "|| true"}}'
      ] }
    },

    // 11) base voice pack -> app/voices (OPTIONAL: clone mode works without it; get_voices.py never aborts,
    //     and the '|| true' guard means even a hard failure can't break the finished install).
    {
      method: "shell.run",
      params: { venv: "env", venv_python: "3.11", path: "app", message: "python {{path.resolve(cwd, 'get_voices.py')}} {{platform === 'win32' ? '|| ver>nul' : '|| true'}}" }
    },

    // done
    {
      method: "notify",
      params: { html: "Dub Studio installed. Click <b>Start</b>. Models (Gemma GGUF, Parakeet, Qwen3-TTS) download on the first run." }
    }
  ]
}
