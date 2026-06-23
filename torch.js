// Cross-platform torch installer for Dub Studio (torch 2.8.0). First matching branch wins (next: null).
// Optional accelerators are non-fatal (|| ...): the engine falls back (triton->bnb->bf16; flash->sdpa).
module.exports = {
  run: [
    // NVIDIA Windows — cu128 + triton-windows (Qwen3-TTS kernels) + Flash-Attention 2 (torch2.8 cp311 wheel)
    {
      "when": "{{gpu === 'nvidia' && platform === 'win32'}}",
      "method": "shell.run",
      "params": {
        "venv": "{{args && args.venv ? args.venv : null}}",
        "venv_python": "{{args && args.venv_python ? args.venv_python : null}}",
        "path": "{{args && args.path ? args.path : '.'}}",
        "message": [
          "uv pip install torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cu128",
          "{{args && args.triton ? 'uv pip install triton-windows==3.7.0.post26 || ver>nul' : ''}}",
          "{{args && args.flashattention ? 'uv pip install https://github.com/kingbri1/flash-attention/releases/download/v2.8.3/flash_attn-2.8.3%2Bcu128torch2.8.0cxx11abiFALSE-cp311-cp311-win_amd64.whl || ver>nul' : ''}}"
        ]
      },
      "next": null
    },
    // NVIDIA Linux — cu128 (torch already bundles triton on linux; no torch2.8 flash wheel exists -> engine uses SDPA)
    {
      "when": "{{gpu === 'nvidia' && platform === 'linux'}}",
      "method": "shell.run",
      "params": {
        "venv": "{{args && args.venv ? args.venv : null}}",
        "venv_python": "{{args && args.venv_python ? args.venv_python : null}}",
        "path": "{{args && args.path ? args.path : '.'}}",
        "message": "uv pip install torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cu128"
      },
      "next": null
    },
    // AMD Windows — DirectML
    {
      "when": "{{gpu === 'amd' && platform === 'win32'}}",
      "method": "shell.run",
      "params": {
        "venv": "{{args && args.venv ? args.venv : null}}",
        "venv_python": "{{args && args.venv_python ? args.venv_python : null}}",
        "path": "{{args && args.path ? args.path : '.'}}",
        "message": "uv pip install torch==2.8.0 torch-directml torchaudio==2.8.0 torchvision==0.23.0"
      },
      "next": null
    },
    // AMD Linux — ROCm 6.3
    {
      "when": "{{gpu === 'amd' && platform === 'linux'}}",
      "method": "shell.run",
      "params": {
        "venv": "{{args && args.venv ? args.venv : null}}",
        "venv_python": "{{args && args.venv_python ? args.venv_python : null}}",
        "path": "{{args && args.path ? args.path : '.'}}",
        "message": "uv pip install torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/rocm6.3"
      },
      "next": null
    },
    // Apple Silicon — default wheel (MPS built in)
    {
      "when": "{{platform === 'darwin' && arch === 'arm64'}}",
      "method": "shell.run",
      "params": {
        "venv": "{{args && args.venv ? args.venv : null}}",
        "venv_python": "{{args && args.venv_python ? args.venv_python : null}}",
        "path": "{{args && args.path ? args.path : '.'}}",
        "message": "uv pip install torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0"
      },
      "next": null
    },
    // Intel Mac — last CPU wheel with Intel-mac support
    {
      "when": "{{platform === 'darwin' && arch !== 'arm64'}}",
      "method": "shell.run",
      "params": {
        "venv": "{{args && args.venv ? args.venv : null}}",
        "venv_python": "{{args && args.venv_python ? args.venv_python : null}}",
        "path": "{{args && args.path ? args.path : '.'}}",
        "message": "uv pip install torch==2.2.2 torchvision==0.17.2 torchaudio==2.2.2"
      },
      "next": null
    },
    // CPU fallback (no GPU)
    {
      "method": "shell.run",
      "params": {
        "venv": "{{args && args.venv ? args.venv : null}}",
        "venv_python": "{{args && args.venv_python ? args.venv_python : null}}",
        "path": "{{args && args.path ? args.path : '.'}}",
        "message": "uv pip install torch==2.8.0 torchvision==0.23.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cpu"
      }
    }
  ]
}
