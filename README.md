# Dub Studio — Pinokio launcher

One-click, **cross-platform** install of [**Dub Studio**](https://github.com/timoncool/dub-studio) via [Pinokio](https://pinokio.co) — no `install.bat`, no manual Python/CUDA wheels. Pinokio sets up the right stack for your machine and the engine falls back gracefully where an accelerator isn't available.

<p>
<a href="https://pinokio.co/item?uri=https://github.com/timoncool/dub-studio-pinokio"><img src="https://img.shields.io/badge/🚀_Install_on-Pinokio-7c3aed?style=for-the-badge" alt="Install on Pinokio"></a>
<a href="https://beta.pinokio.co/apps/github-com-timoncool-dub-studio-pinokio"><img src="https://img.shields.io/badge/📂_Open_in-Pinokio-6d28d9?style=for-the-badge" alt="Open in Pinokio"></a>
<a href="https://github.com/timoncool/dub-studio"><img src="https://img.shields.io/badge/App-source-24292e?style=for-the-badge&logo=github" alt="App source"></a>
<a href="https://dalink.to/nerual_dreming"><img src="https://img.shields.io/badge/💖_Donate-ff4d6d?style=for-the-badge" alt="Donate"></a>
</p>

![Pinokio](https://img.shields.io/badge/Pinokio-launcher-7c3aed?style=flat-square)
![License](https://img.shields.io/github/license/timoncool/dub-studio-pinokio?style=flat-square)
![Last commit](https://img.shields.io/github/last-commit/timoncool/dub-studio-pinokio?style=flat-square)
![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat-square&logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple&logoColor=white)
![NVIDIA](https://img.shields.io/badge/NVIDIA-76B900?style=flat-square&logo=nvidia&logoColor=white)
![AMD](https://img.shields.io/badge/AMD-ED1C24?style=flat-square&logo=amd&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.8-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)

## What is Dub Studio?

Dub & translate **any short video — entirely on your machine, offline**. Drop a clip; it auto-analyzes once (separate audio → recognize speech → tell speakers apart → translate → read on-screen text), then you control every detail with a live preview:

- **Voices** — clone the original, auto-cast a distinct pack voice per speaker, or pick one.
- **On-screen text** localized in place; **subtitle styling** (font, color, outline, shadow, plate).
- **Mask covers** — blur *or* a solid rectangle over the original burned-in text.
- **Funny re-dub** — Gemma rewrites the script, then re-voices it.
- One process: FastAPI serves the React SPA same-origin. 6 UI languages.

## Install (1 click)

1. Install [Pinokio](https://pinokio.co).
2. Open **[this launcher in Pinokio](https://pinokio.co/item?uri=https://github.com/timoncool/dub-studio-pinokio)** (or paste the repo URL into Pinokio → *Discover → Download from URL*).
3. Click **Install**, then **Start**. Models (Gemma GGUF + mmproj, Parakeet ASR, Qwen3-TTS) download on the first run.

## Cross-platform support

Everything **runs everywhere PyTorch runs** — the launcher installs the best acceleration your machine supports and the engine degrades gracefully (Triton → bnb → bf16 TTS; Flash-Attn → SDPA; Sortformer → single-speaker).

| Platform | Compute | TTS | Multi-speaker |
|---|---|---|---|
| **Windows · NVIDIA** | CUDA 12.8 + Triton + Flash-Attn 2 | Qwen3-TTS combo (nf4 + Triton) | ✅ Sortformer |
| **Linux · NVIDIA (x64)** | CUDA 12.8 + Triton | Qwen3-TTS combo (nf4 + Triton) | ✅ Sortformer |
| **Windows · AMD** | DirectML | Qwen3-TTS (bf16) | single-speaker |
| **Linux · AMD** | ROCm 6.3 | Qwen3-TTS (bf16) | single-speaker |
| **macOS · Apple Silicon** | MPS + Metal (llama.cpp) | Qwen3-TTS (bf16) | single-speaker |
| **Intel Mac / any CPU** | CPU | Qwen3-TTS (bf16, slow) | single-speaker |

ASR runs on `onnxruntime-gpu` (NVIDIA/CPU on Win/Linux) or `onnxruntime` (macOS). The Gemma MT/vision model uses the JamePeng CUDA `llama-cpp-python` wheels on NVIDIA, Metal on Apple Silicon, and CPU elsewhere. Nothing is installed system-wide — delete the launcher folder and it's gone.

## Menu

- **Start** — launch the server, then *Open Web UI*.
- **Files** — open the app folder (your `workspace/` exports live there).
- **Update** — `git pull` the app + rebuild the SPA.
- **Save Disk Space** — deduplicate venv libraries (hardlinks).
- **Reset** — revert to a clean pre-install state.

## Links

- **App:** [timoncool/dub-studio](https://github.com/timoncool/dub-studio) · [Releases](https://github.com/timoncool/dub-studio/releases)
- **Model stack:** [Parakeet-TDT](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3) ASR · Gemma-4 (MT + vision) · [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) · NVIDIA Sortformer diarization
- **Pinokio:** [pinokio.co](https://pinokio.co)

## Author

Built by **[Nerual Dreming](https://t.me/nerual_dreming)** — founder of [ArtGeneration.me](https://artgeneration.me). Channel **[Нейро-Софт](https://t.me/neuroport)** — portable AI builds.

I make local AI tools for free — no cloud, no subscriptions. Donations help me keep building: **[Card / PayPal](https://dalink.to/nerual_dreming)** · **[Boosty](https://boosty.to/neuro_art)** · see [DONATE.md](DONATE.md) for crypto. Thank you! 🙏
