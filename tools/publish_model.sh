#!/bin/bash
# MD 7 Nov 2026 ("Ha"): put the AI check model (Apache-2.0) on the PUBLIC quran-sathi GitHub release asr-model-v1,
# so the phone app downloads it once instead of carrying 100 MB. Re-running is safe (skips if already there).
set -euo pipefail
cd "$(dirname "$0")/../www/models/quran-asr"
R=ansar-design/quran-sathi; T=asr-model-v1
if ! gh release view $T -R $R >/dev/null 2>&1; then
  gh release create $T -R $R --title "AI check model v1 (whisper-base-ar-quran, int8 ONNX)" --notes "AI recitation-check model for Quran Sathi. The app downloads it once, on first use of the AI check. Model: tarteel-ai/whisper-base-ar-quran (Apache-2.0), 8-bit ONNX for transformers.js, unchanged files. It only listens; it never produces Quran text." *.json onnx/*.onnx
fi
echo "Checking the download..."
A=$(curl -sL https://github.com/$R/releases/download/$T/encoder_model_quantized.onnx | shasum -a 256 | cut -c1-64)
B=$(shasum -a 256 onnx/encoder_model_quantized.onnx | cut -c1-64)
[[ $A == "$B" ]] && echo "DONE: model is online and correct." || { echo "PROBLEM: downloaded file does not match"; exit 1; }
