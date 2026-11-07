/* Quran Sathi - AI recitation CHECK, fully on the phone (no internet, voice never leaves the phone).
 * Model: tarteel-ai/whisper-base-ar-quran (Apache-2.0), 8-bit ONNX, run by transformers.js (Apache-2.0) in the WebView.
 * On the phone the model is downloaded once (see REL below); after that the check needs no internet.
 * The AI only LISTENS to the learner and says which words it did not hear as written. It never recites and never
 * produces Quran text: the text shown is always the Tanzil text. Words only - tajweed is not judged.
 * window.AiCheck.check(blobUrl, refText, onStage) -> Promise<ReciteCheck result>
 */
(function () {
  'use strict';
  var asrP = null, checking = false;
  // MD 7 Nov 2026: the model (~105 MB) is NOT inside the phone app any more. On the phone it is downloaded ONCE, on first
  // AI check, from the public GitHub release of quran-sathi, into app storage (asr/quran-asr/). Every file's size is
  // checked before use. In a browser (tests, dev) the copy in www/models/ is used as before.
  var REL = 'https://github.com/ansar-design/quran-sathi/releases/download/asr-model-v1/';
  var FILES = [['added_tokens.json', 2108], ['config.json', 1272], ['generation_config.json', 276], ['normalizer.json', 52666],
    ['preprocessor_config.json', 339], ['special_tokens_map.json', 2178], ['tokenizer.json', 2203236], ['tokenizer_config.json', 20493],
    ['onnx/encoder_model_quantized.onnx', 23201316], ['onnx/decoder_model_merged_quantized.onnx', 80248990]];
  var TOTAL = FILES.reduce(function (t, f) { return t + f[1]; }, 0);
  var Cap = window.Capacitor, FS = Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.Plugins && Cap.Plugins.Filesystem;
  function have(f) { return FS.stat({ path: 'asr/quran-asr/' + f[0], directory: 'DATA' }).then(function (st) { return +st.size === f[1]; }, function () { return false; }); }
  function modelReady() {
    if (!FS) return Promise.resolve(true);
    return Promise.all(FILES.map(have)).then(function (r) { return r.every(Boolean); });
  }
  var dlP = null;
  function download(onProgress) {
    if (!FS) return Promise.resolve();
    if (dlP) return dlP;
    var done = 0, cur = null, h = null;
    function tell(extra) { onProgress && onProgress(Math.min(99, Math.floor((done + (extra || 0)) * 100 / TOTAL))); }
    var listen = FS.addListener ? Promise.resolve(FS.addListener('progress', function (e) { if (cur && e && e.url === REL + cur[0].split('/').pop()) tell(e.bytes || 0); })).then(function (x) { h = x; }, function () {}) : Promise.resolve();
    dlP = listen.then(function () { return FS.mkdir({ path: 'asr/quran-asr/onnx', directory: 'DATA', recursive: true }).catch(function () {}); })
      .then(function () {
        var chain = Promise.resolve();
        FILES.forEach(function (f) {
          chain = chain.then(function () { return have(f); }).then(function (ok) {
            if (ok) { done += f[1]; tell(); return; }
            cur = f;
            return FS.downloadFile({ url: REL + f[0].split('/').pop(), path: 'asr/quran-asr/' + f[0], directory: 'DATA', recursive: true, progress: true })
              .then(function () { return have(f); }).then(function (good) {
                if (!good) { FS.deleteFile({ path: 'asr/quran-asr/' + f[0], directory: 'DATA' }).catch(function () {}); throw new Error('size'); }
                done += f[1]; tell();
              });
          });
        });
        return chain;
      }).finally(function () { cur = null; dlP = null; if (h && h.remove) h.remove(); });
    return dlP;
  }
  function modelPath() {
    if (!FS) return Promise.resolve('models/');
    return FS.getUri({ path: 'asr', directory: 'DATA' }).then(function (r) { return Cap.convertFileSrc(r.uri) + '/'; });
  }
  function load(onStage) {
    if (asrP) return asrP;
    onStage && onStage('load');
    asrP = Promise.all([import('../vendor/transformers.min.js'), modelPath()]).then(function (x) {
      var T = x[0], env = T.env;
      env.allowRemoteModels = false; env.allowLocalModels = true; env.localModelPath = x[1];
      env.useBrowserCache = false;
      env.backends.onnx.wasm.wasmPaths = new URL('vendor/', document.baseURI).href;
      env.backends.onnx.wasm.numThreads = (self.crossOriginIsolated && navigator.hardwareConcurrency > 1) ? Math.min(4, navigator.hardwareConcurrency) : 1;
      return T.pipeline('automatic-speech-recognition', 'quran-asr', { dtype: 'q8', device: 'wasm' });
    });
    asrP.catch(function () { asrP = null; });
    return asrP;
  }
  function pcm16k(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('Recording unavailable'); return r.arrayBuffer(); }).then(function (buf) {
      var AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      return Promise.resolve().then(function () { return ac.decodeAudioData(buf); }).finally(function () {
        // Release hardware on decode success AND failure before permitting a retry.
        return Promise.resolve().then(function () { return ac.close(); }).catch(function () {});
      }).then(function (ab) {
        var n = Math.max(1, Math.ceil(ab.duration * 16000)), oc = new OfflineAudioContext(1, n, 16000);
        var src = oc.createBufferSource(); src.buffer = ab; src.connect(oc.destination); src.start();
        return oc.startRendering();
      }).then(function (out) { return out.getChannelData(0); });
    });
  }
  function check(url, refText, onStage) {
    if (checking) return Promise.reject(new Error('AI check already running'));
    checking = true;
    return Promise.resolve().then(function () { return pcm16k(url); }).then(function (audio) {
      if (audio.length < 16000 * 0.6) return { tooShort: true };
      var peak = 0; for (var i = 0; i < audio.length; i += 8) { var v = Math.abs(audio[i]); if (v > peak) peak = v; }
      if (peak < 0.02) return { silent: true };
      return load(onStage).then(function (asr) {
      onStage && onStage('listen');
      var opt = audio.length > 16000 * 29 ? { chunk_length_s: 30, stride_length_s: 5 } : {};
      return asr(audio, opt).then(function (o) {
        var res = window.ReciteCheck.compare(refText, o && o.text);
        res.heard = o && o.text; return res;
      });
      });
    }).finally(function () { checking = false; });
  }
  window.AiCheck = { check: check, warm: load, modelReady: modelReady, download: download, sizeMB: Math.round(TOTAL / 1e6) };
})();
