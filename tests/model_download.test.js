// 7 Nov 2026: AI model is downloaded once on the phone (lib/ai_check.js). Fake Capacitor Filesystem:
// ready only when every file has the exact size; a wrong-size file is deleted and the download fails; retry finishes.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '../www/lib/ai_check.js'), 'utf8');
const sizes = {}; let breakNext = null, calls = 0;
const FS = {
  stat: ({ path: p }) => p in sizes ? Promise.resolve({ size: sizes[p] }) : Promise.reject(new Error('nf')),
  mkdir: () => Promise.resolve(), deleteFile: ({ path: p }) => { delete sizes[p]; return Promise.resolve(); },
  getUri: () => Promise.resolve({ uri: 'file:///data/asr' }), addListener: () => Promise.resolve({ remove() {} }),
  downloadFile: ({ url, path: p }) => { calls++; assert(url.startsWith('https://github.com/ansar-design/quran-sathi/releases/download/asr-model-v1/'));
    assert(!url.slice(80).includes('/onnx/'), 'release assets are flat');
    const want = { 'onnx/encoder_model_quantized.onnx': 23201316, 'onnx/decoder_model_merged_quantized.onnx': 80248990 }[p.replace('asr/quran-asr/', '')];
    sizes[p] = breakNext && p.endsWith(breakNext) ? 5 : (want || realSize(p)); if (breakNext && p.endsWith(breakNext)) breakNext = null; return Promise.resolve({}); }
};
// sizes come from ai_check.js itself, so the test also runs where the model is not on disk (public repo)
const SIZE = Object.fromEntries([...src.matchAll(/\['([^']+)', (\d+)\]/g)].map(m => [m[1], +m[2]]));
function realSize(p) { return SIZE[p.replace('asr/quran-asr/', '')]; }
const win = { Capacitor: { isNativePlatform: () => true, Plugins: { Filesystem: FS }, convertFileSrc: u => u.replace('file://', 'https://localhost/_capacitor_file_') } };
vm.runInNewContext(src, { window: win, document: { baseURI: 'https://localhost/' }, self: {}, navigator: {}, URL, Promise, Math, console });
const A = win.AiCheck;
(async () => {
  assert.strictEqual(await A.modelReady(), false, 'empty phone: not ready');
  breakNext = 'decoder_model_merged_quantized.onnx'; let pcs = [];
  await assert.rejects(A.download(p => pcs.push(p)), /size/, 'cut-off file is rejected');
  assert.strictEqual(await A.modelReady(), false);
  const before = calls; await A.download(p => pcs.push(p));
  assert.strictEqual(calls - before, 1, 'retry downloads only the missing file');
  assert.strictEqual(await A.modelReady(), true);
  assert(pcs.every(p => p >= 0 && p <= 99), 'progress 0-99');
  assert(A.sizeMB > 100 && A.sizeMB < 110, 'size shown to user ' + A.sizeMB);
  console.log('model_download.test OK: not ready when missing, bad size deleted + error, retry only missing, ready, progress');
})().catch(e => { console.error(e); process.exit(1); });
