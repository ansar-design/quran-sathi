"""Make the transformers.js model folder for the on-device recitation check (tarteel-ai/whisper-base-ar-quran, Apache-2.0)."""
import os, shutil, sys
from onnxruntime.quantization import quantize_dynamic, QuantType
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(dst, 'onnx'), exist_ok=True)
for f in os.listdir(src):
    if not f.endswith('.onnx'):
        shutil.copy(os.path.join(src, f), dst)
for name in ('encoder_model', 'decoder_model_merged'):
    quantize_dynamic(os.path.join(src, name + '.onnx'), os.path.join(dst, 'onnx', name + '_quantized.onnx'),
                     weight_type=QuantType.QUInt8, extra_options={'EnableSubgraph': True})
print('done')
# onnxruntime-web/node (transformers.js) reads ONNX IR <= 10; the onnx package writes 12. Graph ops are unchanged.
import onnx
for name in ('encoder_model', 'decoder_model_merged'):
    p = os.path.join(dst, 'onnx', name + '_quantized.onnx')
    m = onnx.load(p)
    m.ir_version = 9
    onnx.save(m, p)
print('ir fixed')
