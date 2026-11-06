/* Page practice: existing Tanzil text + local AiCheck, never generated Quran text.
 * Page takes/results are ephemeral. ASR suggestions do not update hifz progress. */
(function (root) {
  'use strict';
  var busy = false;
  var BISM = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
  function reference(items, rc) {
    var segments = [], offset = 0;
    function add(text, label, isBism) {
      var count = rc.words(text).length;
      segments.push({ text: text, label: label, start: offset, count: count, bism: !!isBism });
      offset += count;
    }
    items.forEach(function (it) {
      if (it.ayah === 1 && it.sura !== 9) add(BISM, 'বিসমিল্লাহ', true);
      add(it.text, it.name + ' · আয়াত ' + it.ayah, false);
    });
    return { text: segments.map(function (s) { return s.text; }).join(' '), segments: segments };
  }
  function groups(ref, result) {
    if (!result.words || result.words.length !== ref.segments.reduce(function (n, s) { return n + s.count; }, 0)) throw new Error('Alignment length mismatch');
    return ref.segments.map(function (s) {
      return { label: s.label, bism: s.bism, words: result.words.slice(s.start, s.start + s.count) };
    });
  }
  function open(page, items) {
    if (busy) { root.alert('আগের AI মিলানো শেষ হচ্ছে। একটু পরে আবার চেষ্টা করুন।'); return; }
    var ref = reference(items, root.ReciteCheck), closed = false, pending = false;
    var stream = null, recorder = null, url = null, timer = null, ticker = null, started = 0;
    var previous = document.activeElement;
    function el(tag, cls, text, parent) {
      var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text;
      if (parent) parent.appendChild(e); return e;
    }
    var ov = el('div', 'ov'), box = el('div', 'card aibox pagecheck', '', ov);
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'পুরো পাতা শোনান');
    el('h2', '', 'পাতা ' + page + ' · পুরো পাতা শোনান', box);
    el('p', '', '1. রেকর্ড শুরু করুন। 2. এই পাতার আয়াতগুলো ক্রমে পড়ুন; সূরার শুরুতে বিসমিল্লাহ বলুন। 3. থামিয়ে AI দিয়ে মিলান। সর্বোচ্চ 5 মিনিট।', box);
    el('p', 'muted', 'পরীক্ষামূলক শব্দ-মিলানো, তাজবীদ বা শুদ্ধতার রায় নয়। AI ভুল শুনতে পারে। সব কাজ ফোনে হয়; কণ্ঠ কোথাও যায় না। বন্ধ করলে এই রেকর্ড মুছে যায়।', box);
    var status = el('p', 'hint', 'প্রস্তুত হলে রেকর্ড শুরু করুন।', box); status.setAttribute('role', 'status');
    var playback = el('audio', '', '', box); playback.controls = true; playback.tabIndex = 0; playback.hidden = true; playback.setAttribute('aria-label', 'নিজের পাতার রেকর্ড শুনুন');
    var results = el('div', 'page-results', '', box), row = el('div', 'row', '', box);
    function button(text, cls, fn) { var b = el('button', 'btn ' + cls, text, row); b.onclick = fn; return b; }
    // First alt button is Android Back's cancellation target.
    var close = button('বন্ধ', 'alt', cleanup);
    var record = button('● রেকর্ড শুরু', '', start);
    var stop = button('■ রেকর্ড থামান', '', stopRecording); stop.hidden = true;
    var check = button('✓ পাতাটি AI দিয়ে মিলান', '', analyse); check.hidden = true;
    function stopTracks() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } }
    function clocksOff() { clearTimeout(timer); clearInterval(ticker); timer = ticker = null; }
    function cleanup() {
      if (closed) return; closed = true; clocksOff();
      if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch (e) {} }
      stopTracks(); playback.pause(); playback.removeAttribute('src'); if (url) { URL.revokeObjectURL(url); url = null; }
      root.removeEventListener('pagehide', cleanup); document.removeEventListener('visibilitychange', visibility);
      ov.remove(); if (previous && previous.isConnected) previous.focus();
    }
    function visibility() { if (document.hidden) cleanup(); }
    function stopRecording() { if (recorder && recorder.state === 'recording') { stop.disabled = true; recorder.stop(); clocksOff(); stopTracks(); } }
    function start() {
      if (pending || recorder || busy || closed) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !root.MediaRecorder) { status.textContent = 'এই ফোনে রেকর্ডিং চালু করা যায়নি।'; return; }
      pending = true; record.disabled = true; check.hidden = true; results.textContent = '';
      playback.pause(); playback.removeAttribute('src'); playback.hidden = true;
      if (url) { URL.revokeObjectURL(url); url = null; }
      status.textContent = 'মাইক্রোফোনের অনুমতি দিন…';
      Promise.resolve().then(function () { return navigator.mediaDevices.getUserMedia({ audio: true }); }).then(function (st) {
        pending = false;
        if (closed) { st.getTracks().forEach(function (t) { t.stop(); }); return; }
        stream = st;
        var parts = [], r = new MediaRecorder(st); recorder = r;
        r.ondataavailable = function (e) { if (!closed && e.data && e.data.size) parts.push(e.data); };
        r.onstop = function () {
          clocksOff(); stopTracks(); recorder = null;
          if (closed) return;
          stop.hidden = true; record.hidden = false; record.disabled = false; record.textContent = '● আবার রেকর্ড';
          if (!parts.length) { status.textContent = 'রেকর্ড পাওয়া যায়নি। আবার চেষ্টা করুন।'; return; }
          url = URL.createObjectURL(new Blob(parts, { type: r.mimeType || 'audio/webm' }));
          playback.src = url; playback.hidden = false;
          status.textContent = 'রেকর্ড প্রস্তুত। AI দিয়ে মিলিয়ে দেখতে পারেন।'; check.hidden = false;
        };
        r.onerror = function () { if (closed) return; cleanup(); root.alert('রেকর্ডিং বন্ধ হয়েছে। পাতায় ফিরে আবার চেষ্টা করুন।'); };
        r.start(); record.hidden = true; stop.hidden = false; stop.disabled = false; started = Date.now();
        function tick() { status.textContent = 'রেকর্ড হচ্ছে · ' + Math.floor((Date.now() - started) / 1000) + ' / 300 সেকেন্ড'; }
        tick(); ticker = setInterval(tick, 1000); timer = setTimeout(stopRecording, 300000);
      }).catch(function (err) {
        pending = false; stopTracks(); recorder = null;
        if (closed) return;
        record.disabled = false;
        status.textContent = err && err.name === 'NotAllowedError'
          ? '1. ফোনের সেটিংসে কুরআন সাথী খুলুন। 2. মাইক্রোফোনের অনুমতি দিন। 3. ফিরে রেকর্ড শুরু করুন।'
          : 'মাইক্রোফোন চালু হয়নি। অন্য কল বা রেকর্ডিং বন্ধ করে আবার চেষ্টা করুন।';
      });
    }
    function analyse() {
      if (closed || busy || !url) return;
      playback.pause();
      busy = true; check.disabled = true; record.hidden = false; record.disabled = true;
      results.textContent = ''; status.textContent = 'AI চালু হচ্ছে… প্রথমবার সময় লাগতে পারে।';
      Promise.resolve().then(function () { return root.AiCheck.check(url, ref.text, function (stage) {
        if (!closed && stage === 'listen') status.textContent = 'পাতার তিলাওয়াত শুনছে… দীর্ঘ রেকর্ডে সময় লাগবে।';
      }); }).then(function (r) {
        if (closed) return;
        if (r.silent || r.tooShort) { status.textContent = r.silent ? 'আওয়াজ পাওয়া যায়নি। আবার রেকর্ড করুন।' : 'রেকর্ড খুব ছোট। পাতাটি পড়ে আবার রেকর্ড করুন।'; return; }
        var rows = groups(ref, r);
        status.textContent = 'অনুশীলন করেছেন—এবার ক্বারীর সঙ্গে মিলিয়ে শুনুন। এটি AI-এর অনুমান, শুদ্ধতার সনদ নয়।';
        el('p', 'muted', 'সবুজ = মিলেছে · লাল = আলাদা শোনা গেছে · কমলা = AI শুনতে পায়নি। AI-এর ভুলও হতে পারে; সন্দেহ হলে উস্তাদকে শোনান।', results);
        rows.forEach(function (g) {
          var section = el('section', 'page-result', '', results);
          el('h3', '', g.label, section);
          var matched = g.words.filter(function (w) { return w.status === 'ok'; }).length;
          el('p', '', matched + '/' + g.words.length + ' শব্দ AI মিলিয়েছে', section);
          var words = el('div', 'aiwords', '', section); words.lang = 'ar'; words.dir = 'rtl';
          g.words.forEach(function (w) {
            var sp = el('span', 'aiw ' + w.status, w.word, words);
            sp.setAttribute('aria-label', w.word + ' · ' + (w.status === 'ok' ? 'মিলেছে' : w.status === 'missed' ? 'AI শুনতে পায়নি' : 'আলাদা শোনা গেছে'));
            words.appendChild(document.createTextNode(' '));
          });
        });
        if (r.extra.length) el('p', 'hint', r.extra.length + 'টি বাড়তি শব্দ AI শুনেছে। কোন আয়াতের তা নিশ্চিত নয়; নিজের পড়া ক্বারীর সঙ্গে মিলিয়ে নিন।', results);
      }).catch(function () { if (!closed) status.textContent = 'AI মিলাতে পারেনি। আবার চেষ্টা করুন বা নিজের পড়া ক্বারীর সঙ্গে মিলিয়ে নিন।'; })
        .finally(function () { busy = false; if (!closed) { check.disabled = false; record.disabled = false; record.hidden = false; } });
    }
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); cleanup(); }
      if (e.key === 'Tab') {
        var buttons = Array.from(box.querySelectorAll('button, audio[controls]')).filter(function (b) { return !b.hidden && !b.disabled; });
        var first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    root.addEventListener('pagehide', cleanup); document.addEventListener('visibilitychange', visibility);
    document.body.appendChild(ov); close.focus();
  }
  var api = { reference: reference, groups: groups, open: open };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PageCheck = api;
})(typeof window !== 'undefined' ? window : this);
