#!/bin/bash
# Put the on-device recitation-check model + runtime into www/ (run once after quantize.py; both are git-ignored).
#   ~/Tools/onnx-venv: optimum 1.17.1 + transformers 4.38.2 (newer exports need cache_position, which transformers.js 3.7 does not feed)
#   optimum-cli export onnx --model tarteel-ai/whisper-base-ar-quran --task automatic-speech-recognition-with-past out_fp32
#   python quantize.py out_fp32 model-base
set -euo pipefail
cd "$(dirname "$0")"; W=../../www
mkdir -p $W/vendor $W/models/quran-asr/onnx
D=node_modules/@huggingface/transformers/dist
cp $D/transformers.min.js $D/ort-wasm-simd-threaded.jsep.wasm $D/ort-wasm-simd-threaded.jsep.mjs $W/vendor/
cp $(dirname $D)/LICENSE $W/vendor/LICENSE-transformers.js.txt
for f in config.json generation_config.json preprocessor_config.json tokenizer.json tokenizer_config.json special_tokens_map.json added_tokens.json normalizer.json; do cp model-base/$f $W/models/quran-asr/; done
cp model-base/onnx/*_quantized.onnx $W/models/quran-asr/onnx/
du -sh $W/vendor $W/models
