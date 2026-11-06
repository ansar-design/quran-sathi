/* Quran Sathi - AI recitation CHECK, fully on the phone (no internet, voice never leaves the phone).
 * Model: tarteel-ai/whisper-base-ar-quran (Apache-2.0), 8-bit ONNX, run by transformers.js (Apache-2.0) in the WebView.
 * The AI only LISTENS to the learner and says which words it did not hear as written. It never recites and never
 * produces Quran text: the text shown is always the Tanzil text. Words only - tajweed is not judged.
 * window.AiCheck.check(blobUrl, refText, onStage) -> Promise<ReciteCheck result>
 */
(function () {
  'use strict';
  var asrP = null;
  function load(onStage) {
    if (asrP) return asrP;
    onStage && onStage('load');
    asrP = import('../vendor/transformers.min.js').then(function (T) {
      var env = T.env;
      env.allowRemoteModels = false; env.allowLocalModels = true; env.localModelPath = 'models/';
      env.useBrowserCache = false;
      env.backends.onnx.wasm.wasmPaths = new URL('vendor/', document.baseURI).href;
      env.backends.onnx.wasm.numThreads = (self.crossOriginIsolated && navigator.hardwareConcurrency > 1) ? Math.min(4, navigator.hardwareConcurrency) : 1;
      return T.pipeline('automatic-speech-recognition', 'quran-asr', { dtype: 'q8', device: 'wasm' });
    });
    asrP.catch(function () { asrP = null; });
    return asrP;
  }
  function pcm16k(url) {
    return fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      var AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      return new Promise(function (ok, bad) { ac.decodeAudioData(buf, ok, bad); }).then(function (ab) {
        try { ac.close(); } catch (e) {}
        var n = Math.max(1, Math.ceil(ab.duration * 16000)), oc = new OfflineAudioContext(1, n, 16000);
        var src = oc.createBufferSource(); src.buffer = ab; src.connect(oc.destination); src.start();
        return oc.startRendering();
      }).then(function (out) { return out.getChannelData(0); });
    });
  }
  function check(url, refText, onStage) {
    return Promise.all([load(onStage), pcm16k(url)]).then(function (r) {
      var asr = r[0], audio = r[1];
      if (audio.length < 16000 * 0.6) return { tooShort: true };
      var peak = 0; for (var i = 0; i < audio.length; i += 8) { var v = Math.abs(audio[i]); if (v > peak) peak = v; }
      if (peak < 0.02) return { silent: true };
      onStage && onStage('listen');
      var opt = audio.length > 16000 * 29 ? { chunk_length_s: 30, stride_length_s: 5 } : {};
      return asr(audio, opt).then(function (o) {
        var res = window.ReciteCheck.compare(refText, o && o.text);
        res.heard = o && o.text; return res;
      });
    });
  }
  window.AiCheck = { check: check, warm: load };
})();
