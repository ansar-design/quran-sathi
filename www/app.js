/* কুরআন সাথী — full Quran (114 suras) reading + qari + recording + Juz Amma hifz plan. No ads, no tracking.
   Quran text: www/data/quran.json (Tanzil Uthmani, verbatim). Qari audio: Juz Amma bundled offline; other suras streamed
   or downloaded per sura into the phone (Filesystem, Data dir) from cdn.islamic.network (MD 3 Nov). Experimental on-device WORD check (6 Nov 2026, lib/ai_check.js): missed/different words only, no
   pronunciation or tajweed judgement, labelled experimental; learner-voice accuracy still VERIFY. */
(function () {
  'use strict';
  var SPELL_NOTE = 'পরীক্ষামূলক বানান: আলিফের উপর বা নিচে হামযা থাকলে এখানে «হামযা» বলা হয়েছে। তানবীনের মূল ধ্বনি আন্/ইন্/উন্ — শেষে ন্ থাকে। থামলে বা পরের শব্দের সঙ্গে মিলিয়ে পড়লে নিয়ম বদলায়। বানান জুড়ে পুরো আয়াত পড়বেন না; ক্বারীর তিলাওয়াত শুনুন ও শিক্ষককে দিয়ে মিলিয়ে নিন।';
  var BN_NAMES = { 1:'আল-ফাতিহা',2:'আল-বাকারাহ',3:'আলে ইমরান',4:'আন-নিসা',5:'আল-মায়িদাহ',6:'আল-আন‘আম',7:'আল-আ‘রাফ',8:'আল-আনফাল',9:'আত-তাওবাহ',
    10:'ইউনুস',11:'হূদ',12:'ইউসুফ',13:'আর-রা‘দ',14:'ইবরাহীম',15:'আল-হিজর',16:'আন-নাহল',17:'আল-ইসরা',18:'আল-কাহফ',19:'মারইয়াম',20:'ত্বোয়া-হা',
    21:'আল-আম্বিয়া',22:'আল-হাজ্জ',23:'আল-মু’মিনূন',24:'আন-নূর',25:'আল-ফুরকান',26:'আশ-শু‘আরা',27:'আন-নামল',28:'আল-কাসাস',29:'আল-আনকাবূত',30:'আর-রূম',
    31:'লুকমান',32:'আস-সাজদাহ',33:'আল-আহযাব',34:'সাবা',35:'ফাতির',36:'ইয়াসীন',37:'আস-সাফফাত',38:'সোয়াদ',39:'আয-যুমার',40:'গাফির',
    41:'ফুসসিলাত',42:'আশ-শূরা',43:'আয-যুখরুফ',44:'আদ-দুখান',45:'আল-জাসিয়াহ',46:'আল-আহকাফ',47:'মুহাম্মাদ',48:'আল-ফাতহ',49:'আল-হুজুরাত',50:'ক্বাফ',
    51:'আয-যারিয়াত',52:'আত-তূর',53:'আন-নাজম',54:'আল-কামার',55:'আর-রাহমান',56:'আল-ওয়াকি‘আহ',57:'আল-হাদীদ',58:'আল-মুজাদালাহ',59:'আল-হাশর',60:'আল-মুমতাহিনাহ',
    61:'আস-সাফ',62:'আল-জুমু‘আহ',63:'আল-মুনাফিকূন',64:'আত-তাগাবুন',65:'আত-তালাক',66:'আত-তাহরীম',67:'আল-মুলক',68:'আল-কলম',69:'আল-হাক্কাহ',70:'আল-মা‘আরিজ',
    71:'নূহ',72:'আল-জিন',73:'আল-মুযযাম্মিল',74:'আল-মুদ্দাসসির',75:'আল-কিয়ামাহ',76:'আল-ইনসান',77:'আল-মুরসালাত', 78:'আন-নাবা',79:'আন-নাযি‘আত',80:'আবাসা',81:'আত-তাকউইর',82:'আল-ইনফিতার',83:'আল-মুতাফফিফীন',84:'আল-ইনশিকাক',85:'আল-বুরুজ',
    86:'আত-তারিক',87:'আল-আ‘লা',88:'আল-গাশিয়াহ',89:'আল-ফাজর',90:'আল-বালাদ',91:'আশ-শামস',92:'আল-লাইল',93:'আদ-দুহা',94:'আশ-শারহ',95:'আত-তীন',
    96:'আল-আলাক',97:'আল-কদর',98:'আল-বাইয়্যিনাহ',99:'আয-যিলযাল',100:'আল-আদিয়াত',101:'আল-কারিআহ',102:'আত-তাকাসুর',103:'আল-আসর',104:'আল-হুমাযাহ',
    105:'আল-ফীল',106:'কুরাইশ',107:'আল-মাঊন',108:'আল-কাউসার',109:'আল-কাফিরূন',110:'আন-নাসর',111:'আল-লাহাব',112:'আল-ইখলাস',113:'আল-ফালাক',114:'আন-নাস' };
  var DIG = '০১২৩৪৫৬৭৮৯';
  // Latin digits everywhere: Bengali ১ is read as ৬ on small screens (judges r6/r7); DIG kept for reference.
  function bn(n) { return String(n); }
  // 5 Nov: counters use Latin digits too (same rule as line above; Bangla ১ was misread as ৬, and 'আয়াত নম্বর 5' is Latin)
  function bnCount(n) { return String(n); }
  var $ = function (id) { return document.getElementById(id); };
  var main = $('main'), bar = $('bar'), title = $('title'), back = $('back');
  var spell = null, showSpell = store('spell') === '1';
  // 5 Nov: tajweed colours (cpfair/quran-tajweed, CC BY 4.0; spans moved onto our exact text by tools/build_tajweed.py)
  var tajweed = null, showTj = store('tj') === '1';
  // 5 Nov: tap a word to hear it - Husary word timings (cpfair/quran-align, CC BY 4.0) on the bundled ayah audio
  var wordT = null, wp = null, wpTimer = null;
  // 5 Nov: 15-line IndoPak (Hafezi) page map, page -> first ayah (quran_android GPL-3.0 tables, tools/build_pages15.py).
  // Juz Amma pages (587-611) match the QUL Qudratullah layout 100%; page view is Juz Amma only for now.
  var pg15 = null, PG_FIRST = 587, PG_LAST = 611, pgp = null, pgSeq = null, pgPos = 0;
  var pgHide = store('pghide') === '1', pgShown = {};
  function stopWord() { if (wpTimer) { clearInterval(wpTimer); wpTimer = null; } if (wp) { var a = wp; wp = null; try { a.pause(); } catch (e) {} } }
  function playWord(sura, ayah, k) {
    var t = wordT && wordT.suras[sura] && wordT.suras[sura][ayah] && wordT.suras[sura][ayah][k];
    if (!t || sura < 78) return false;
    // A word tap must never feed qari audio into an active or pending learner take.
    if (micRequest || rec) { alert('শব্দ শুনতে আগে রেকর্ডিং থামান। রেকর্ডিং প্রস্তুত হলে আবার চাপুন।'); return false; }
    stopPlay();
    var a = new Audio('audio/husary/' + sura + '_' + (ayah + 1) + '.mp3'); wp = a;
    if (slow) { a.defaultPlaybackRate = 0.75; a.playbackRate = 0.75; }
    var end = (t[1] + 120) / 1000;
    a.onloadedmetadata = function () { if (wp === a) a.currentTime = Math.max(0, t[0] - 40) / 1000; };
    function finish(failed) {
      if (wp !== a) return;
      stopWord();
      if (view.name === 'sura') drawBar();
      if (failed) alert('শব্দটি বাজানো যায়নি। আবার চাপুন বা পুরো আয়াত শুনুন।');
    }
    a.onended = function () { finish(false); };
    a.onerror = function () { finish(true); };
    var pr = a.play(); if (pr && pr.catch) pr.catch(function () { finish(true); });
    wpTimer = setInterval(function () { if (wp === a && (a.ended || a.currentTime >= end)) finish(false); }, 40);
    if (view.name === 'sura') drawBar();
    return true;
  }
  var data = null, bnTr = null, pron = null, showPron = store('pron') === '1', showMean = store('mean') !== '0', view = { name: 'list' }, sel = 0, rec = null, chunks = [], takes = {}, recKey = null, stream = null, MAXSEC = 90;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clear() { main.textContent = ''; bar.textContent = ''; bar.hidden = true; }
  function btn(label, cls, fn, parent) { var b = el('button', 'btn' + (cls ? ' ' + cls : ''), label); b.onclick = fn; parent.appendChild(b); return b; }

  function stopRec() { try { if (rec && rec.state !== 'inactive') { rec.stop(); stopTimer(); if (view.name === 'sura') drawBar(); } } catch (e) {} }
  function releaseMic() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } }
  function key() { return view.sura + ':' + sel; }
  function curTake() { return takes[key()] || null; }
  // Stop a running recording (it is kept as that ayah's take); takes stay in memory until the app is closed.
  var player = null;
  var qFinished = false;
  var qp = null, qRep = 0, QREPS = [1, 3, 5, 10], qri = 0;
  var savedQ = parseInt(store('qrep'), 10); if (savedQ >= 0 && savedQ < QREPS.length) qri = savedQ;
  var slow = store('slow') === '1';
  function stopQari() { qFinished = false; qBism = false; if (qp) { var a = qp; qp = null; a.onended = a.onerror = null; try { a.pause(); } catch (e) {} } }
  // Husary recitation: Juz Amma bundled in www/audio/husary (offline); other suras from the phone after 'ডাউনলোড', else streamed.
  // Repeat N times, then go to the next ayah until the sura ends.
  var CDN = 'https://cdn.islamic.network/quran/audio/64/ar.husary/';
  var Cap = window.Capacitor, FS = Cap && Cap.Plugins && Cap.Plugins.Filesystem, dlBase = null;
  function dlMap() { try { var m = JSON.parse(store('dl')); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; } catch (e) { return {}; } }
  function saveDl(m) { try { localStorage.setItem('dl', JSON.stringify(m)); return true; } catch (e) { alert('ফোনে ডাউনলোডের তথ্য রাখা যায়নি। জায়গা খালি করে আবার চেষ্টা করুন।'); return false; } }
  function isDl(sura) { return !!dlMap()[sura]; }
  if (FS) FS.getUri({ path: 'qari', directory: 'DATA' }).then(function (r) { dlBase = r.uri; }).catch(function () {});
  // Progress safety copy (5 Nov device test: a damaged WebView storage lost saved Hifz after restart).
  // Hifz/Learn progress is also written to a small file in app storage; if the WebView copy is missing it is restored.
  function mirror(k, v) { if (FS && FS.writeFile) FS.writeFile({ path: 'state/' + k + '.json', data: v, directory: 'DATA', encoding: 'utf8', recursive: true }).catch(function () {}); }
  // 6 Nov judge fix: a present but damaged WebView copy (not valid JSON object) is also replaced from the safety file.
  function goodJson(v) { try { var o = JSON.parse(v); return !!o && typeof o === 'object' && !Array.isArray(o); } catch (e) { return false; } }
  if (FS && FS.readFile) ['hifz', 'learn-v1'].forEach(function (k) {
    var cur = store(k);
    if (cur !== null && goodJson(cur)) return;
    FS.readFile({ path: 'state/' + k + '.json', directory: 'DATA', encoding: 'utf8' }).then(function (r) {
      var now = store(k);
      if ((now === null || !goodJson(now)) && r && typeof r.data === 'string' && goodJson(r.data)) { store(k, r.data); if (data && (view.name === 'hifz' || view.name === 'learn')) render(); }
    }).catch(function () {});
  });
  function qariSrc(s, a, i) {
    if (s.sura >= 78) return 'audio/husary/' + s.sura + '_' + a.n + '.mp3';
    if (isDl(s.sura) && dlBase) return Cap.convertFileSrc(dlBase + '/' + s.sura + '_' + a.n + '.mp3');
    return CDN + (s.g0 + i) + '.mp3';
  }
  var dl = null;   // running download: {sura, done, total, stop}
  function downloadSura(s) {
    if (!FS || dl || removing) return;
    dl = { sura: s.sura, done: 0, total: s.ayas.length, stop: false, fail: 0 };
    var i = 0;
    function next() {
      if (dl.stop) { dl = null; if (view.name === 'sura') render(); return; }
      if (i >= s.ayas.length) {
        var ok = dl.fail === 0; dl = null;
        if (ok) { var m = dlMap(); m[s.sura] = s.ayas.length; saveDl(m); }
        else alert('কিছু আয়াত ডাউনলোড হয়নি। ইন্টারনেট দেখে আবার চাপুন।');
        if (view.name === 'sura') render(); return;
      }
      var a = s.ayas[i], k = i++;
      FS.downloadFile({ url: CDN + (s.g0 + k) + '.mp3', path: 'qari/' + s.sura + '_' + a.n + '.mp3', directory: 'DATA', recursive: true })
        .catch(function () { dl.fail++; }).then(function () { dl.done++; drawDl(); next(); });
    }
    drawDl();
    // the plugin does not create the folder itself (ENOENT seen on emulator 3 Nov)
    FS.mkdir({ path: 'qari', directory: 'DATA', recursive: true }).catch(function () {}).then(next);
  }
  var removing = null;
  function removeSura(s) {
    if (!FS || dl || removing) return;
    var m = dlMap(); delete m[s.sura];
    // Forget the offline claim before touching files. A failed save must leave audio intact.
    if (!saveDl(m)) return;
    stopQari();
    removing = s.sura;
    render();
    var failed = false;
    Promise.all(s.ayas.map(function (a) {
      return Promise.resolve().then(function () {
        return FS.deleteFile({ path: 'qari/' + s.sura + '_' + a.n + '.mp3', directory: 'DATA' });
      }).catch(function () { failed = true; });
    })).then(function () {
      removing = null;
      if (failed) alert('কিছু অডিও ফাইল মোছা যায়নি। আবার ডাউনলোড করে চেষ্টা করতে পারেন।');
      if (view.name === 'sura') render();
    });
  }
  function mb(kb) { return kb >= 1000 ? bn(Math.round(kb / 1000)) + ' MB' : bn(Math.max(0.1, Math.round(kb / 100) / 10)) + ' MB'; }
  function drawDl() {
    var box = $('dlbox'); if (!box || view.name !== 'sura') return;
    var s = curSura(); box.textContent = '';
    if (s.sura >= 78) return;
    if (removing === s.sura) {
      box.appendChild(el('span', 'muted', 'তিলাওয়াত মুছে ফেলা হচ্ছে… শেষ হওয়া পর্যন্ত অপেক্ষা করুন।'));
    } else if (dl && dl.sura === s.sura) {
      box.appendChild(el('span', 'muted', 'তিলাওয়াত ডাউনলোড হচ্ছে: ' + bn(dl.done) + '/' + bn(dl.total) + ' আয়াত'));
      btn('বাতিল', 'alt', function () { dl.stop = true; }, box);
    } else if (isDl(s.sura)) {
      box.appendChild(el('span', 'ok', '✓ তিলাওয়াত ফোনে আছে, ইন্টারনেট লাগবে না'));
      var remove = btn('মুছুন', 'alt', function () { confirmBox('এই সূরার তিলাওয়াত ফোন থেকে মুছবেন? পরে আবার ডাউনলোড করা যাবে।', function () { removeSura(s); }); }, box);
      remove.disabled = !!(dl || removing);
    } else {
      box.appendChild(el('span', 'muted', 'ইন্টারনেট থাকলে ক্বারী সরাসরি বাজবে। ইন্টারনেট ছাড়া শুনতে ডাউনলোড করুন।'));
      var b = btn('⬇ তিলাওয়াত ডাউনলোড (~' + mb(s.kb) + ')', '', function () { downloadSura(s); }, box);
      if (!FS || dl || removing) b.disabled = true;
    }
  }
  // 5 Nov: in-app Bangla dialogs instead of the phone's English OK/Cancel boxes.
  // ask(): yes/no in Bangla; falls back to native confirm() where the dialog cannot open (tests, old WebView).
  function ask(msg, yes, no) {
    var D = window.BanglaDialog;
    if (D && window.document === document) {
      var shown = false;
      try { shown = D.open({ title: 'নিশ্চিত করুন', message: msg, cancel: 'না', accept: 'হ্যাঁ' }, function (v) { if (v === null) { if (no) no(); } else yes(); }); } catch (e) { shown = false; }
      if (shown) return;
    }
    if (confirm(msg)) yes(); else if (no) no();
  }
  if (window.BanglaDialog && window.document === document && window.alert) {
    var nativeAlert = window.alert.bind(window);
    window.alert = function (m) {
      var shown = false;
      try { shown = window.BanglaDialog.open({ title: 'জানিয়ে রাখি', message: String(m), accept: 'ঠিক আছে' }); } catch (e) { shown = false; }
      if (!shown) nativeAlert(m);
    };
  }
  function confirmBox(msg, yes) {
    var ov = el('div', 'ov'), box = el('div', 'card'); box.appendChild(el('p', null, msg));
    var r = el('div', 'row'); btn('না', 'alt', function () { ov.remove(); }, r); btn('হ্যাঁ', '', function () { ov.remove(); yes(); }, r);
    box.appendChild(r); ov.appendChild(box); document.body.appendChild(ov);
  }
  // 5 Nov: Bismillah is recited before ayah 1 of every sura except Al-Fatiha (it is ayah 1 there) and At-Tawbah.
  // Husary's own Bismillah (Al-Fatiha 1:1, same source) is bundled as audio/husary/bismillah.mp3. On failure it is skipped.
  var qBism = false;
  function startQari() { stopPlay(); qRep = 0; var s = curSura(); if (sel === 0 && s.sura !== 1 && s.sura !== 9) playBism(); else playQari(); }
  function qariFailure(au, error, bundled) {
    if (qp !== au) return; // Ignore stopped/replaced players and duplicate error events.
    qp = null; qBism = false; qFinished = false; qRep = 0;
    au.onended = au.onerror = null; a_pause(au);
    if (view.name === 'sura') drawBar();
    alert(error && error.name === 'NotAllowedError'
      ? 'ফোন তিলাওয়াত চালু করতে দেয়নি। আবার ক্বারী বোতাম চাপুন।'
      : bundled
        ? 'তিলাওয়াতের অডিও চালু করা যায়নি। আবার ক্বারী বোতাম চাপুন। সমস্যা থাকলে অ্যাপ বন্ধ করে আবার খুলুন।'
        : 'তিলাওয়াত চালু করা যায়নি। ইন্টারনেট দেখে আবার ক্বারী চাপুন, অথবা সূরাটি ডাউনলোড করুন।');
  }
  function playBism() {
    qFinished = false; qBism = true;
    var au = new Audio('audio/husary/bismillah.mp3'); qp = au;
    if (slow) { au.defaultPlaybackRate = 0.75; au.playbackRate = 0.75; }
    au.onended = au.onerror = function () { if (qp !== au) return; qBism = false; playQari(); };
    var pr = au.play(); if (pr && pr.catch) pr.catch(function (e) { qariFailure(au, e, true); });
    if (view.name === 'sura') drawBar();
  }
  function playQari(done) {
    qFinished = false;
    var s = curSura(), a = s.ayas[sel], au = new Audio(qariSrc(s, a, sel));
    qp = au;
    if (slow) { au.defaultPlaybackRate = 0.75; au.playbackRate = 0.75; }
    au.onended = function () {
      if (qp !== au) return;
      qRep++;
      if (qRep < QREPS[qri]) { playQari(); return; }
      qRep = 0;
      if (sel < s.ayas.length - 1) { sel++; render(); var e = document.querySelector('.ayah.sel'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' }); playQari(); }
      else { qp = null; qFinished = true; if (view.name === 'sura') drawBar(); }
    };
    au.onerror = function () { qariFailure(au, null, s.sura >= 78 || isDl(s.sura)); };
    // streamed (not on phone) and nothing played for 10 s: stop the repeat loop and say so
    if (!(s.sura >= 78 || isDl(s.sura))) setTimeout(function () {
      if (qp === au && au.currentTime === 0) { qp = null; a_pause(au); if (view.name === 'sura') drawBar(); alert('ইন্টারনেট ধীর বা নেই। সূরাটি ডাউনলোড করে নিন, অথবা পরে চেষ্টা করুন।'); }
    }, 10000);
    var pr = au.play(); if (pr && pr.catch) pr.catch(function (e) { qariFailure(au, e, s.sura >= 78 || isDl(s.sura)); });
    if (view.name === 'sura') drawBar();
  }
  function a_pause(a) { try { a.pause(); } catch (e) {} }
  function stopPlay() { stopWord(); stopQari(); stopPage(); if (player) { var a = player; player = null; try { a.pause(); } catch (e) {} } }
  function stopActive() { cancelMicRequest(); stopPlay(); stopTimer(); if (rec && rec.state === 'recording') { stopRec(); } else { releaseMic(); } }
  function dropAll() { cancelMicRequest(); stopPlay(); stopTimer(); if (rec) { rec.onstop = null; } stopRec(); releaseMic(); Object.keys(takes).forEach(function (k) { URL.revokeObjectURL(takes[k]); }); takes = {}; chunks = []; rec = null; }

  function guard(next) { next(); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  function go(v, ayahIndex) { stopActive(); view = v; sel = ayahIndex === undefined ? 0 : ayahIndex; if (v.name === 'sura') store('lastSura', String(v.sura)); render(); window.scrollTo(0, 0); }

  var SIZES = [26, 32, 40, 48], szi = 1;
  var savedSz = parseInt(store('sz'), 10); if (savedSz >= 0 && savedSz < SIZES.length) szi = savedSz;
  function applySize() { document.documentElement.style.setProperty('--az', SIZES[szi] + 'px'); }
  applySize();
  function drawSize(parent) {
    var box = el('div', 'szrow reading-size');
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'পড়ার লেখার আকার');
    var label = el('span', 'size-label'); label.setAttribute('aria-live', 'polite'); box.appendChild(label);
    function change(delta) {
      var next = szi + delta;
      if (next < 0 || next >= SIZES.length) return;
      try { localStorage.setItem('sz', String(next)); }
      catch (_) { alert('লেখার আকার সেভ করা যায়নি। ফোনে জায়গা আছে কি না দেখুন।'); return; }
      szi = next; applySize(); update();
    }
    var smaller = btn('লেখা ছোট করুন', 'alt', function () { change(-1); }, box);
    var larger = btn('লেখা বড় করুন', 'alt', function () { change(1); }, box);
    function update() {
      label.textContent = 'পড়ার লেখার আকার: ' + ['ছোট', 'মাঝারি', 'বড়', 'সবচেয়ে বড়'][szi];
      smaller.disabled = szi === 0; larger.disabled = szi === SIZES.length - 1;
    }
    update(); parent.appendChild(box);
  }

  function render() {
    clear();
    main.className = view.name === 'learn' ? 'learn-view' : view.name === 'list' ? 'list-view' : '';
    back.hidden = view.name === 'list' || view.name === 'hifz';
    if (!data) { main.appendChild(el('p', 'muted', 'লোড হচ্ছে…')); return; }
    if (view.name === 'list') return renderList();
    if (view.name === 'sura') return renderSura();
    if (view.name === 'hifz') return renderHifz();
    if (view.name === 'page') return renderPage();
    if (view.name === 'learn') return renderLearn();
    if (view.name === 'feedback') return renderFeedback();
    if (view.name === 'about') return renderAbout();
  }

  // Search keys only: never normalize the displayed Quran text or names.
  var listQuery = '';
  function suraSearchKey(value) {
    return String(value).normalize('NFC').toLowerCase()
      .replace(/[০-৯]/g, function (c) { return String(c.charCodeAt(0) - 0x09e6); })
      .replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); })
      .replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 0x06f0); })
      .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/[\s\-–—'’‘ـ]/g, '');
  }
  function renderList() {
    title.textContent = 'কুরআন সাথী';
    var n = el('div', 'note', 'এটি শেখার সহায়ক। আয়াত পড়ুন, নিজের তিলাওয়াত রেকর্ড করে নিজে শুনুন। কোনো আলেম বা ক্বারীর বিকল্প নয়।');
    main.appendChild(n);
    drawTabs('list'); drawSize(main);
    var last = null;
    try { last = JSON.parse(store('reading-v1')); } catch (e) {}
    var lsObj = last && data.suras.filter(function (s) { return s.sura === last.sura; })[0];
    var lastIndex = lsObj ? lsObj.ayas.findIndex(function (a) { return a.n === last.ayah; }) : -1;
    if (lastIndex < 0) {
      var ls = Number(store('lastSura'));
      lsObj = data.suras.filter(function (s) { return s.sura === ls; })[0];
      lastIndex = 0;
    }
    if (lsObj) {
      var cb = btn('↻ আগের পড়া: ' + (BN_NAMES[lsObj.sura] || lsObj.name_ar) + ' · আয়াত ' + bn(lsObj.ayas[lastIndex].n), '', function () {
        go({ name: 'sura', sura: lsObj.sura }, lastIndex);
        var e = document.querySelector('.ayah.sel'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' });
      }, main); cb.style.margin = '8px 0';
    }
    var jr = el('div', 'szrow'); jr.appendChild(el('span', 'muted', 'পারায় যান'));
    var js = el('select'); js.id = 'juz'; js.setAttribute('aria-label', 'পারা বাছুন');
    data.juz.forEach(function (j, k) { var o = el('option', null, 'পারা ' + bn(k + 1) + ' · ' + (BN_NAMES[j[0]] || '') + (j[1] > 1 ? ' ' + bn(j[1]) : '')); o.value = k + 1; js.appendChild(o); });
    var ph = el('option', null, 'পারা বাছুন'); ph.value = ''; js.insertBefore(ph, js.firstChild); js.value = '';
    js.onchange = function () { if (!js.value) return; clearSearch(false); var e = $('sura-' + data.juz[js.value - 1][0]); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' }); };
    jr.appendChild(js); btn('আমপারা', 'alt', function () { clearSearch(false); var e = $('juz-30'); if (e) e.scrollIntoView({ block: 'start' }); }, jr);
    main.appendChild(jr);
    var search = el('div', 'sura-search');
    var label = el('label', null, 'সূরা খুঁজুন'); label.htmlFor = 'sura-search';
    var input = el('input'); input.id = 'sura-search'; input.type = 'search';
    input.placeholder = 'নাম বা নম্বর: ফাতিহা / 1'; input.value = listQuery;
    input.setAttribute('aria-describedby', 'sura-search-help');
    input.setAttribute('autocomplete', 'off'); input.setAttribute('autocapitalize', 'off');
    var help = el('p', 'muted', 'বাংলা বা আরবি নাম, অথবা সূরার নম্বর লিখুন।'); help.id = 'sura-search-help';
    search.appendChild(label); search.appendChild(input); search.appendChild(help);
    var clear = btn('সব সূরা দেখান', 'alt', function () { clearSearch(true); }, search);
    var status = el('p', 'muted'); status.id = 'sura-search-status'; status.setAttribute('role', 'status');
    search.appendChild(status); main.appendChild(search);
    var list = el('div', 'suras'), rows = [], headings = [];
    function clearSearch(focus) { input.value = ''; listQuery = ''; filterSuras(); if (focus) input.focus(); }
    function filterSuras() {
      listQuery = input.value;
      var key = suraSearchKey(listQuery), count = 0;
      rows.forEach(function (row) {
        var match = !key || (/^[0-9]+$/.test(key)
          ? Number(key) === row.number
          : row.name.indexOf(key) !== -1 || row.arabic.indexOf(key) !== -1);
        row.element.hidden = !match; if (match) count++;
      });
      headings.forEach(function (heading) { heading.hidden = !!key; });
      clear.hidden = !listQuery;
      status.textContent = !key ? '' : count ? bn(count) + 'টি সূরা পাওয়া গেছে' : 'সূরা পাওয়া যায়নি। নামের কিছু অংশ বা 1–114 নম্বর লিখুন।';
    }
    input.oninput = filterSuras;
    var lastJ = 0;
    data.suras.forEach(function (s) {
      var j1 = juzOf(s.sura, 1), j2 = juzOf(s.sura, s.ayas.length);
      if (j1 !== lastJ) { var h = el('h2', 'juzh', 'পারা ' + bn(j1) + (j1 === 30 ? ' (আমপারা)' : '')); h.id = 'juz-' + j1; list.appendChild(h); headings.push(h); lastJ = j1; }
      var b = el('button', 'sura'); b.id = 'sura-' + s.sura; b.onclick = function () { go({ name: 'sura', sura: s.sura }); };
      b.appendChild(el('span', 'no', bn(s.sura)));
      var mid = el('span', 'bn', BN_NAMES[s.sura] || s.name_ar); mid.appendChild(el('div', 'meta', s.ayas.length + ' আয়াত · সূরা ' + s.sura + ' · পারা ' + bn(j1) + (j2 > j1 ? '–' + bn(j2) : '') + (s.sura < 78 && isDl(s.sura) ? ' · ✓ ডাউনলোড' : '')));
      b.appendChild(mid); b.appendChild(el('span', 'ar', s.name_ar));
      list.appendChild(b);
      rows.push({ element: b, number: s.sura, name: suraSearchKey(BN_NAMES[s.sura] || ''), arabic: suraSearchKey(s.name_ar) });
    });
    main.appendChild(list); filterSuras();
  }

  function juzOf(sura, ayah) { var k = 0; data.juz.forEach(function (j, i) { if (j[0] < sura || (j[0] === sura && j[1] <= ayah)) k = i; }); return k + 1; }

  function drawTabs(active) {
    var t = el('div', 'tabs');
    btn('সূরা', active === 'list' ? '' : 'alt', function () { if (active !== 'list') go({ name: 'list' }); }, t);
    btn('হিফজ', active === 'hifz' ? '' : 'alt', function () { if (active !== 'hifz') go({ name: 'hifz' }); }, t);
    btn('শিখি', active === 'learn' ? '' : 'alt', function () { if (active !== 'learn') go({ name: 'learn' }); }, t);
    main.appendChild(t);
  }

  // Sister app নূর কায়দা (com.amirahsworld.nurqaida, live on Play Store): for readers who cannot read Arabic letters yet.
  var NQ_URL = 'https://play.google.com/store/apps/details?id=com.amirahsworld.nurqaida';
  function nqCard(parent) {
    var c = el('div', 'card');
    c.appendChild(el('h2', null, 'পড়তে পারেন না? শুরু থেকে শিখুন'));
    c.appendChild(el('p', null, 'নূর কায়দা: হরফ চেনা থেকে সূরা ফাতিহা পর্যন্ত, ৩০ দিনে, বড়দের জন্য। ইন্টারনেট ছাড়া চলে, ফ্রি, বিজ্ঞাপন নেই। একই দলের অ্যাপ।'));
    var a = el('a', 'btn alt', 'নূর কায়দা খুলুন'); a.href = NQ_URL; a.target = '_blank'; a.rel = 'noopener';
    a.style.display = 'inline-block'; a.style.textDecoration = 'none'; a.style.lineHeight = '28px';
    c.appendChild(a); parent.appendChild(c);
  }

  // Guided practice uses existing source data; no automatic pass/fail or pronunciation score.
  function renderLearn() {
    title.textContent = 'ধাপে ধাপে শিখি'; drawTabs('learn'); drawSize(main);
    main.appendChild(el('div', 'note', 'আমপারার অনুশীলন: অক্ষর → হরকত → বানান → শব্দ → আয়াত। এটি পূর্ণ কায়দা কোর্স নয়। বাংলা বানান পরীক্ষামূলক; শিক্ষক এখনো যাচাই করেননি। আরবির সঠিক উচ্চারণ শিক্ষকের কাছে শিখুন। ভুল পেলে উপরের মতামত বোতামে জানান।'));
    nqCard(main);
    if (!spell) { main.appendChild(el('p', null, 'বানানের সহায়িকা পাওয়া যায়নি। সূরা ট্যাবে পড়া ও শোনা যাবে।')); return; }
    var p = LearnPath.restore(store('learn-v1'), data.suras);
    var s = data.suras.find(function (s) { return s.sura === p.sura; }), a = s.ayas[p.ayah];
    function save(next) {
      try { var j = JSON.stringify(next); localStorage.setItem('learn-v1', j); mirror('learn-v1', j); }
      catch (_) {
        // A select changes before its handler runs; restore the labels to the displayed ayah.
        ss.value = p.sura; aa.value = p.ayah;
        alert('অগ্রগতি সেভ করা যায়নি। ফোনে জায়গা আছে কি না দেখুন।'); return;
      }
      stopWord();
      render(); window.scrollTo(0, 0);
    }
    var choices = el('div', 'szrow'), ss = el('select'), aa = el('select');
    ss.setAttribute('aria-label', 'শেখার সূরা'); aa.setAttribute('aria-label', 'শেখার আয়াত');
    data.suras.filter(function (s) { return s.sura >= 78; }).forEach(function (s) {
      var o = el('option', null, BN_NAMES[s.sura]); o.value = s.sura; ss.appendChild(o);
    }); ss.value = p.sura;
    s.ayas.forEach(function (a, i) { var o = el('option', null, 'আয়াত ' + a.n); o.value = i; aa.appendChild(o); }); aa.value = p.ayah;
    ss.onchange = function () { save({ sura: +ss.value, ayah: 0, step: 0 }); };
    aa.onchange = function () { save({ sura: p.sura, ayah: +aa.value, step: 0 }); };
    choices.appendChild(ss); choices.appendChild(aa); main.appendChild(choices);
    var steps = el('div', 'szrow');
    LearnPath.labels.forEach(function (label, i) {
      var b = btn((i + 1) + ' · ' + label, i === p.step ? '' : 'alt', function () { save({ sura: p.sura, ayah: p.ayah, step: i }); }, steps);
      b.setAttribute('aria-pressed', String(i === p.step));
    }); main.appendChild(steps);
    var c = el('section', 'card'); c.appendChild(el('h2', null, 'ধাপ ' + (p.step + 1) + '/5 · ' + LearnPath.labels[p.step]));
    var hints = ['এই আয়াতের অক্ষরগুলো ডান দিক থেকে চিনুন। যুক্ত হলে অক্ষরের রূপ বদলায়।', 'আয়াতের অক্ষরের সঙ্গে থাকা চিহ্ন দেখুন। শিক্ষককে দেখিয়ে পড়ুন।', 'শব্দের নিচে পরীক্ষামূলক বাংলা বানান আছে। শিক্ষককে দিয়ে মিলিয়ে নিন।', 'ডান দিক থেকে শব্দ ধরে পড়ার চেষ্টা করুন। কোনো শব্দে চাপ দিলে ক্বারীর কণ্ঠে শুনবেন; নিচে পুরো আয়াতও শুনতে পারবেন।', 'পুরো আয়াত পড়ুন, তারপর ক্বারীর তিলাওয়াতের সঙ্গে মিলিয়ে অনুশীলন করুন।'];
    c.appendChild(el('p', null, hints[p.step]));
    if (p.step === 2) c.appendChild(el('p', 'pronnote', SPELL_NOTE));
    var row = el('div', 'learn-cards');
    if (p.step < 2) {
      var chars = p.step === 0 ? LearnPath.letters(a.t) : LearnPath.groups(a.t);
      chars.forEach(function (ch) { var e = el('span', 'swa', ch); e.lang = 'ar'; e.dir = 'rtl'; row.appendChild(e); });
    } else if (p.step < 4) {
      var words = spell.suras[s.sura] && spell.suras[s.sura][p.ayah];
      if (!words) row.appendChild(el('p', null, 'এই আয়াতের বানান পাওয়া যায়নি।'));
      else words.forEach(function (w, k) {
        var card = el('div', 'sw'), ar = el('span', 'swa', w[0]); ar.lang = 'ar'; card.appendChild(ar); if (p.step === 2) card.appendChild(el('span', 'swb', w[1])); row.appendChild(card);
        if (wordT && s.sura >= 78) { card.className = 'sw tap'; card.setAttribute('role', 'button'); card.setAttribute('aria-label', 'শব্দটি শুনুন'); card.onclick = function () { playWord(s.sura, p.ayah, k); }; }
      });
      if (words && wordT && s.sura >= 78) c.appendChild(el('p', 'muted', '🔊 যেকোনো শব্দে চাপ দিলে ক্বারী হুসারির কণ্ঠে শব্দটি শুনবেন।'));
    } else { var full = el('div', 'bism', a.t); full.lang = 'ar'; row.appendChild(full); }
    c.appendChild(row); main.appendChild(c);
    btn('পুরো আয়াত শুনি ও পড়ি', '', function () {
      stopActive(); view = { name: 'sura', sura: p.sura, from: 'learn' }; sel = p.ayah; render();
      var selected = document.querySelector('.ayah.sel'); if (selected) selected.scrollIntoView({ block: 'center' });
      startQari();   // the button says "শুনি" - start the qari too (5 Nov device test: it opened silently)
    }, main);
    main.appendChild(el('p', 'muted', 'পড়ার পর পিছনে চাপলে এই ধাপে ফিরে আসবেন। অ্যাপ উচ্চারণ বা তাজবীদ যাচাই করে না (রেকর্ডের পর পরীক্ষামূলক AI শুধু শব্দ মেলায়)। অগ্রগতি এই ফোনে থাকে; অ্যাপ মুছলে হারাবে।'));
    if (p.step < 4) btn('অনুশীলন করেছি · পরের ধাপ', '', function () { save({ sura: p.sura, ayah: p.ayah, step: p.step + 1 }); }, main);
    else if (p.ayah + 1 < s.ayas.length) btn('পরের আয়াত শিখি', '', function () { save({ sura: p.sura, ayah: p.ayah + 1, step: 0 }); }, main);
    else main.appendChild(el('p', 'ok', 'এই সূরার শেষ আয়াত। আবার অনুশীলন করুন বা উপরে অন্য সূরা বাছুন।'));
  }

  // ---- Hifz tab: daily plan (sabaq / sabqi / manzil), self-marked, saved on the phone only ----
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dayNo(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(s)) return NaN;
    var a = s.split('-').map(Number), d = new Date(0);
    // setUTCFullYear preserves years 0000–0099; Date.UTC would add 1900.
    d.setUTCFullYear(a[0], a[1] - 1, a[2]);
    if (d.getUTCFullYear() !== a[0] || d.getUTCMonth() !== a[1] - 1 || d.getUTCDate() !== a[2]) return NaN;
    return d.getTime() / 86400000;
  }
  function hzLoad() {
    var h = null; try { h = JSON.parse(store('hifz')); } catch (e) {}
    if (!h || typeof h !== 'object' || Array.isArray(h)) h = {};
    return {
      start: Number.isFinite(dayNo(h.start)) ? h.start : today(),
      size: [1, 2, 3].indexOf(h.size) >= 0 ? h.size : 2,
      order: h.order === 'forward' ? 'forward' : 'reverse',
      done: Number.isSafeInteger(h.done) && h.done > 0 ? h.done : 0,
      markedOn: Number.isFinite(dayNo(h.markedOn)) ? h.markedOn : ''
    };
  }
  function hzSuras() { return data.suras.filter(function (s) { return s.sura >= 78; }); }   // hifz plan = Juz Amma (v1)
  function hzSave(h, onError) {
    try { var j = JSON.stringify(h); localStorage.setItem('hifz', j); mirror('hifz', j); return true; }
    catch (e) { (onError || alert)('অগ্রগতি সেভ হয়নি। ফোনে জায়গা খালি করে আবার চেষ্টা করুন।'); return false; }
  }
  // Backup code: HZ1-<start>-<size>-<f|r>-<done>. Plain text, no server.
  function hzExport(h) { return ['HZ1', h.start, h.size, h.order === 'forward' ? 'f' : 'r', h.done].join('-'); }
  function hzImport(s) {
    var m = /^HZ1-(\d{4}-\d\d-\d\d)-([123])-([fr])-(\d{1,3})$/.exec(String(s).trim());
    if (!m || !Number.isFinite(dayNo(m[1]))) return null;
    var h = { start: m[1], size: +m[2], order: m[3] === 'f' ? 'forward' : 'reverse', done: +m[4], markedOn: '' };
    var n = HifzPlan.buildLessons(hzSuras(), h.size, h.order).length;
    return h.done <= n ? h : null;
  }
  function lessonName(l) {
    var s = data.suras.filter(function (x) { return x.sura === l.sura; })[0];
    return (BN_NAMES[l.sura] || s.name_ar) + ' · আয়াত ' + l.from + (l.to !== l.from ? '–' + l.to : '');
  }
  function openLesson(l) {
    stopActive(); var s = data.suras.filter(function (x) { return x.sura === l.sura; })[0];
    view = { name: 'sura', sura: l.sura }; sel = 0;
    s.ayas.forEach(function (a, i) { if (a.n === l.from) sel = i; });
    store('lastSura', String(l.sura)); render();
    var e = document.querySelector('.ayah.sel'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'start' });
  }
  function lessonRow(l, parent) {
    var b = el('button', 'lesson'); b.onclick = function () { openLesson(l); };
    var lb = el('span', 'bn', lessonName(l)); var lp = pageOf(l.sura, l.from);
    if (lp) lb.appendChild(el('div', 'meta muted', 'হাফেজি পাতা ' + lp)); b.appendChild(lb);
    var s = data.suras.filter(function (x) { return x.sura === l.sura; })[0];
    b.appendChild(el('span', 'ar', s.name_ar)); parent.appendChild(b);
  }
  function section(title, hint, list, parent) {
    var c = el('div', 'card hz'); c.appendChild(el('h2', null, title)); c.appendChild(el('p', 'muted', hint));
    if (!list.length) c.appendChild(el('p', 'muted', 'আজ নেই।'));
    list.forEach(function (l) { lessonRow(l, c); });
    parent.appendChild(c);
  }
  function renderHifz() {
    title.textContent = 'হিফজ পরিকল্পনা';
    drawTabs('hifz');
    var h = hzLoad(), lessons = HifzPlan.buildLessons(hzSuras(), h.size, h.order);
    if (h.done > lessons.length) h.done = lessons.length;
    var di = Math.max(0, dayNo(today()) - dayNo(h.start)), p = HifzPlan.dayPlan(lessons, h.done, di);
    main.appendChild(el('div', 'note', 'এটি মুখস্থের রুটিন। পারলাম কি না আপনি নিজে ঠিক করেন। সূরায় রেকর্ডের পর পরীক্ষামূলক AI শুধু শব্দ বাদ পড়ল কি না দেখায়, উচ্চারণ বা তাজবীদ নয়। আলেম বা ক্বারীর বিকল্প নয়।'));
    var top = el('div', 'card hz'); top.appendChild(el('h2', null, 'অগ্রগতি'));
    top.appendChild(el('p', null, 'মুখস্থ সবক: ' + h.done + ' / ' + lessons.length));
    if (h.markedOn === today() && h.done > 0) {
      var saved = el('p', 'note', 'সেভ হয়েছে: ' + lessonName(lessons[h.done - 1]) + '। এটি আপনার নিজের মূল্যায়ন; অ্যাপ তিলাওয়াত যাচাই করেনি।');
      saved.setAttribute('role', 'status'); top.appendChild(saved);
    }
    main.appendChild(top);
    if (pg15) {
      var pc = el('div', 'card hz'); pc.appendChild(el('h2', null, 'হাফেজি পাতা (15 লাইন)'));
      pc.appendChild(el('p', 'muted', 'যে 15 লাইনের হাফেজি কুরআন থেকে মুখস্থ করেন, তার পাতা ধরে আমপারা পড়ুন ও দোহরান। প্রতিটি পাতা আয়াতের শেষে থামে।'));
      var tp = p.finished ? PG_FIRST : (pageOf(p.sabaq.sura, p.sabaq.from) || PG_FIRST);
      btn('📖 পাতা ' + tp + ' খুলুন' + (p.finished ? '' : ' (আজকের সবক)'), '', function () { go({ name: 'page', page: tp }); }, pc);
      main.appendChild(pc);
    }
    if (p.finished) { var f = el('div', 'card hz'); f.appendChild(el('h2', null, 'মাশাআল্লাহ, সব সবক শেষ')); f.appendChild(el('p', 'muted', 'এখন নিচের পুরোনো সবকগুলো ঘুরিয়ে ঘুরিয়ে দোহরান।')); main.appendChild(f); }
    else section(h.markedOn === today() ? 'পরের দিনের সবক' : 'সবক (নতুন)', h.markedOn === today() ? 'আজকের অগ্রগতি সেভ হয়েছে। পরের অংশ আগে থেকে পড়তে পারেন; পারলাম চিহ্ন দিতে পারবেন আগামী দিন।' : 'আজকের নতুন অংশ। বারবার শুনে পড়ুন, তারপর না দেখে বলার চেষ্টা করুন।', [p.sabaq], main);
    section('সবকী (সাম্প্রতিক দোহরান)', 'গত কয়েকটি সবক আজও একবার পড়ুন।', p.sabqi, main);
    section('আমুখতা (পুরোনো দোহরান)', 'পুরোনো সবক প্রায় ৩০ দিনে একবার ঘুরে আসে।', p.manzil, main);
    var st = el('div', 'card hz'); st.appendChild(el('h2', null, 'সেটিংস'));
    var r1 = el('p'); r1.appendChild(document.createTextNode('সবকের আকার: '));
    var ssel = el('select'); [[1, 'ছোট'], [2, 'মাঝারি'], [3, 'বড়']].forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; if (o[0] === h.size) op.selected = true; ssel.appendChild(op); });
    ssel.onchange = function () { ask('আকার বদলালে সবকের ভাগ বদলে যায় এবং অগ্রগতি শুরু থেকে গোনা হবে। বদলাবেন?', function () { h.size = +ssel.value; h.done = 0; h.start = today(); h.markedOn = ''; hzSave(h); render(); }, render); };
    r1.appendChild(ssel); st.appendChild(r1);
    var r2 = el('p'); r2.appendChild(document.createTextNode('ক্রম: '));
    var osel = el('select'); [['reverse', 'শেষ থেকে (নাস → নাবা)'], ['forward', 'শুরু থেকে (নাবা → নাস)']].forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; if (o[0] === h.order) op.selected = true; osel.appendChild(op); });
    osel.onchange = function () { ask('ক্রম বদলালে অগ্রগতি শুরু থেকে গোনা হবে। বদলাবেন?', function () { h.order = osel.value; h.done = 0; h.start = today(); h.markedOn = ''; hzSave(h); render(); }, render); };
    r2.appendChild(osel); st.appendChild(r2);
    var rs = btn('শুরু থেকে আবার শুরু', 'alt', function () { ask('সব অগ্রগতি মুছে শুরু থেকে শুরু করবেন?', function () { h = { start: today(), size: h.size, order: h.order, done: 0, markedOn: '' }; hzSave(h); render(); }); }, st);
    rs.style.marginTop = '6px';
    var bk = el('div', 'card hz'); bk.appendChild(el('h2', null, 'ব্যাকআপ'));
    bk.appendChild(el('p', 'muted', 'ফোন বদলালে বা অ্যাপ মুছলে অগ্রগতি হারাবে। কোডটি কপি করে নিজের কাছে (যেমন নোটে) রাখুন; পরে এখানে বসালেই ফিরে আসবে।'));
    btn('ব্যাকআপ কোড দেখান', 'alt', function () {
      BanglaDialog.open({ title: 'আপনার ব্যাকআপ কোড', message: 'কোডটি চেপে ধরে কপি করে নিজের নোটে রাখুন। এতে অগ্রগতি থাকবে; রেকর্ডিং থাকবে না।', value: hzExport(hzLoad()), readOnly: true, accept: 'বন্ধ করুন' });
    }, bk);
    var rb = btn('কোড থেকে ফিরিয়ে আনুন', 'alt', restoreBackup, bk);
    rb.style.marginTop = '6px';
    main.appendChild(st); main.appendChild(bk);
    bar.hidden = false;
    if (!p.finished) {
      var marked = h.markedOn === today();
      var mb = btn(marked ? '✓ আজকের সবক হয়েছে' : '✓ পারলাম (আজকের সবক)', marked ? 'alt' : '', function () {
        // Re-read before committing: repeated taps/stale handlers cannot mark a second lesson.
        var current = hzLoad();
        if (current.markedOn === today() || current.done !== h.done || current.size !== h.size || current.order !== h.order || current.start !== h.start) { render(); return; }
        ask(lessonName(p.sabaq) + '\nনা দেখে পড়ে নিজের রেকর্ড বা ক্বারীর তিলাওয়াতের সঙ্গে মিলিয়েছেন? পারলে এই সবকটি সেভ করুন। এটি আপনার নিজের মূল্যায়ন—অ্যাপ শুদ্ধতা যাচাই করে না।', function () {
          // the dialog waits for the reader: re-check nothing changed meanwhile, so a lesson is never marked twice
          var cur = hzLoad();
          if (cur.markedOn === today() || cur.done !== h.done || cur.size !== h.size || cur.order !== h.order || cur.start !== h.start) { render(); return; }
          var next = { start: h.start, size: h.size, order: h.order, done: h.done + 1, markedOn: today() };
          if (!hzSave(next)) return;
          render(); window.scrollTo(0, 0);
        });
      }, bar);
      mb.disabled = marked;
    }
  }

  function backupNotice(message) {
    BanglaDialog.open({ title: 'ব্যাকআপ', message: message, accept: 'ঠিক আছে' });
  }
  function restoreBackup() {
    BanglaDialog.open({ title: 'অগ্রগতি ফিরিয়ে আনুন', message: 'আপনার রাখা পুরো ব্যাকআপ কোডটি বসান।', value: '', cancel: 'বাতিল', accept: 'পরের ধাপ' }, function (code) {
      if (code === null) return;
      var restored = hzImport(code);
      if (!restored) { backupNotice('কোডটি ঠিক নয়। পুরো কোড কপি করেছেন কি না দেখুন।'); return; }
      // A delayed confirmation must never overwrite a more recent saved plan.
      var before = store('hifz');
      BanglaDialog.open({ title: 'অগ্রগতি বদলাবেন?', message: 'বর্তমান অগ্রগতির জায়গায় এই কোডের অগ্রগতি বসবে। মুখস্থ সবক: ' + bn(restored.done), cancel: 'বাতিল', accept: 'ফিরিয়ে আনুন' }, function (accepted) {
        if (accepted === null) return;
        if (store('hifz') !== before) { backupNotice('এর মধ্যে অগ্রগতি বদলেছে। নতুন অগ্রগতি দেখে আবার চেষ্টা করুন।'); return; }
        if (hzSave(restored, backupNotice)) render();
      });
    });
  }

  function curSura() { return data.suras.filter(function (s) { return s.sura === view.sura; })[0]; }

  // Arabic ayah text, optionally coloured by tajweed rule. Text characters are never changed, only wrapped.
  function tjText(sura, i, t) {
    var box = el('span', 't');
    var spans = showTj && tajweed && tajweed.suras[sura] && tajweed.suras[sura][i];
    if (!spans || !spans.length) { box.textContent = t; return box; }
    var pos = 0;
    spans.slice().sort(function (x, y) { return x[1] - y[1]; }).forEach(function (sp) {
      if (sp[1] < pos) return;                       // overlapping rule: keep the first
      if (sp[1] > pos) box.appendChild(document.createTextNode(t.slice(pos, sp[1])));
      var c = el('span', 'tj-' + sp[0], t.slice(sp[1], sp[2])); c.title = tajweed.rules[sp[0]] || ''; box.appendChild(c);
      pos = sp[2];
    });
    if (pos < t.length) box.appendChild(document.createTextNode(t.slice(pos)));
    return box;
  }
  function tjLegend(sura) {
    var used = {}; tajweed.suras[sura].forEach(function (r) { r.forEach(function (sp) { used[sp[0]] = 1; }); });
    var lg = el('div', 'tjlegend');
    Object.keys(tajweed.rules).forEach(function (k) { if (!used[k]) return; var it = el('span', 'tjl'); it.appendChild(el('span', 'tj-' + k, '●')); it.appendChild(document.createTextNode(' ' + tajweed.rules[k])); lg.appendChild(it); });
    lg.appendChild(el('div', 'muted', 'রঙের তথ্য: quran-tajweed (Collin Fair), CC BY 4.0। নিয়ম শিক্ষকের কাছে শিখুন।'));
    return lg;
  }
  // ---- Hafezi page view (15-line IndoPak, Juz Amma) ----
  function pageOf(sura, ayah) {   // page holding this ayah (null if no map / outside Juz Amma)
    if (!pg15 || sura < 78) return null;
    var pg = null; pg15.pages.forEach(function (x) { if (x[1] < sura || (x[1] === sura && x[2] <= ayah)) pg = x[0]; });
    return pg >= PG_FIRST ? pg : null;
  }
  function pageStart(sura, ayah) { var r = null; if (pg15) pg15.pages.forEach(function (x) { if (x[1] === sura && x[2] === ayah && x[0] >= PG_FIRST) r = x[0]; }); return r; }
  function pageItems(pg) {        // [{s: sura object, i: ayah index}] in reading order
    var k = -1; pg15.pages.forEach(function (x, j) { if (x[0] === pg) k = j; });
    if (k < 0) return [];
    var a = pg15.pages[k], b = pg15.pages[k + 1], out = [];
    data.suras.forEach(function (s) {
      s.ayas.forEach(function (ay, i) {
        var afterStart = s.sura > a[1] || (s.sura === a[1] && ay.n >= a[2]);
        var beforeEnd = !b || s.sura < b[1] || (s.sura === b[1] && ay.n < b[2]);
        if (afterStart && beforeEnd) out.push({ s: s, i: i });
      });
    });
    return out;
  }
  function stopPage() { if (pgp) { var a = pgp; pgp = null; a.onended = a.onerror = null; try { a.pause(); } catch (e) {} } pgSeq = null; markPage(-1); }
  function markPage(k) {
    if (!document.querySelectorAll) return;
    var els = document.querySelectorAll('.pgay'); for (var j = 0; j < els.length; j++) els[j].classList.toggle('sel', +els[j].getAttribute('data-k') === k);
    var e = k >= 0 && document.querySelector('.pgay[data-k="' + k + '"]'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' });
  }
  function playPage(items) {      // whole page once, Bismillah before ayah 1 of each sura (not 9)
    stopPlay(); pgSeq = []; pgPos = 0;
    items.forEach(function (it, k) { if (it.i === 0 && it.s.sura !== 9) pgSeq.push({ src: 'audio/husary/bismillah.mp3', k: k }); pgSeq.push({ src: qariSrc(it.s, it.s.ayas[it.i], it.i), k: k }); });
    nextPage(); drawPageBar(items);
  }
  function nextPage() {
    if (!pgSeq) return;
    if (pgPos >= pgSeq.length) { pgp = null; pgSeq = null; markPage(-1); if (view.name === 'page') drawPageBar(pageItems(view.page)); return; }
    var it = pgSeq[pgPos++], au = new Audio(it.src); pgp = au; markPage(it.k);
    if (slow) { au.defaultPlaybackRate = 0.75; au.playbackRate = 0.75; }
    au.onended = function () { if (pgp === au) nextPage(); };
    au.onerror = function () { if (pgp !== au) return; stopPage(); if (view.name === 'page') drawPageBar(pageItems(view.page)); alert('তিলাওয়াতের অডিও চালু করা যায়নি। আবার চেষ্টা করুন।'); };
    var pr = au.play(); if (pr && pr.catch) pr.catch(function () { if (pgp === au) au.onerror(); });
  }
  function drawPageBar(items) {
    bar.textContent = ''; bar.hidden = false;
    var pg = view.page;
    var nx = btn('← পরের', 'alt', function () { go({ name: 'page', page: pg + 1 }); }, bar); nx.disabled = pg >= PG_LAST; nx.setAttribute('aria-label', 'পরের পাতা');
    if (pgp) btn('■ থামুন', 'rec', function () { stopPage(); drawPageBar(items); }, bar);
    else btn('🔊 পাতা শুনুন', '', function () { playPage(items); }, bar);
    var pv = btn('আগের →', 'alt', function () { go({ name: 'page', page: pg - 1 }); }, bar); pv.disabled = pg <= PG_FIRST; pv.setAttribute('aria-label', 'আগের পাতা');
    bar.classList && bar.classList.add('pgbar');
  }
  function renderPage() {
    var pg = Math.min(PG_LAST, Math.max(PG_FIRST, view.page || PG_FIRST)); view.page = pg;
    title.textContent = 'হাফেজি পাতা ' + pg;
    if (!pg15) { main.appendChild(el('p', 'muted', 'লোড হচ্ছে…')); return; }
    var items = pageItems(pg);
    var head = el('div', 'szrow pghead');
    var ps = el('select'); ps.setAttribute('aria-label', 'পাতা বাছুন');
    for (var q = PG_FIRST; q <= PG_LAST; q++) {
      var f = pageItems(q)[0], o = el('option', null, 'পাতা ' + q + ' · ' + (BN_NAMES[f.s.sura] || f.s.name_ar) + ' ' + f.s.ayas[f.i].n);
      o.value = q; ps.appendChild(o);
    }
    ps.value = pg; ps.onchange = function () { go({ name: 'page', page: +ps.value }); };
    head.appendChild(ps);
    var hb = btn(pgHide ? 'না দেখে পড়ি ✓' : 'না দেখে পড়ি', 'alt', function () { pgHide = !pgHide; pgShown = {}; store('pghide', pgHide ? '1' : '0'); render(); }, head);
    hb.setAttribute('aria-pressed', pgHide ? 'true' : 'false');
    main.appendChild(head);
    if (pgHide && window.PageCheck && window.AiCheck) btn('🎙 পুরো পাতা শোনান', '', function () {
      stopActive();
      window.PageCheck.open(pg, items.map(function (it) {
        var a = it.s.ayas[it.i];
        return { sura: it.s.sura, ayah: a.n, text: a.t, name: BN_NAMES[it.s.sura] || it.s.name_ar };
      }));
    }, main);
    main.appendChild(el('p', 'muted', pgHide
      ? 'আয়াত ঢাকা আছে: মুখে বলুন, তারপর আয়াতে চাপ দিয়ে মিলিয়ে নিন।'
      : '15 লাইনের হাফেজি কুরআনের এই পাতার আয়াতগুলো। লাইন ভাঙা ছাপার মতো নয়। আয়াতে চাপ দিলে সূরায় গিয়ে রেকর্ড, বানান ও উচ্চারণ পাবেন।'));
    var swipeEl = el('div', 'pgbody');
    var flow = null;
    items.forEach(function (it, k) {
      var s = it.s, a = s.ayas[it.i];
      if (it.i === 0 || !flow) flow = null;
      if (it.i === 0) {
        swipeEl.appendChild(el('h2', 'juzh', 'সূরা ' + (BN_NAMES[s.sura] || s.name_ar) + ' · ' + s.name_ar));
        if (s.sura !== 9) swipeEl.appendChild(el('div', 'bism', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'));
      }
      var key = s.sura + ':' + a.n, hidden = pgHide && !pgShown[key];
      if (!flow) { flow = el('div', 'pgflow'); flow.lang = 'ar'; flow.dir = 'rtl'; swipeEl.appendChild(flow); }
      var b = el('span', 'pgay' + (hidden ? ' pghid' : '')); b.setAttribute('data-k', k); b.setAttribute('data-n', a.n);
      b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0');
      b.setAttribute('aria-label', (BN_NAMES[s.sura] || s.name_ar) + ' · আয়াত ' + a.n + (hidden ? ' · দেখতে চাপুন' : ''));
      if (hidden) { var cv = el('span', 'pgcover', 'আয়াত ' + a.n); cv.dir = 'ltr'; b.appendChild(cv); }
      else { var tt = tjText(s.sura, it.i, a.t); tt.className = (tt.className || '') + ' pgt'; b.appendChild(tt); }
      if (!hidden) b.appendChild(el('span', 'pgend', '\u06DD' + String(a.n).replace(/\d/g, function (d) { return '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669'.charAt(d); })));
      b.onclick = function () {
        if (hidden) { pgShown[key] = 1; render(); var e = document.querySelector('.pgay[data-k="' + k + '"]'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' }); return; }
        stopPlay(); view = { name: 'sura', sura: s.sura, from: 'page', page: pg }; sel = it.i; store('lastSura', String(s.sura)); render();
        var e2 = document.querySelector('.ayah.sel'); if (e2 && e2.scrollIntoView) e2.scrollIntoView({ block: 'center' });
      };
      flow.appendChild(b); flow.appendChild(document.createTextNode(' '));
    });
    // swipe like turning a mushaf page: finger to the right = next page (Arabic books open right to left)
    var x0 = null, y0 = 0;
    if (swipeEl.addEventListener) swipeEl.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
    if (swipeEl.addEventListener) swipeEl.addEventListener('touchend', function (e) {
      if (x0 === null) return; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
      if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2) return;
      var np = pg + (dx > 0 ? 1 : -1); if (np >= PG_FIRST && np <= PG_LAST) go({ name: 'page', page: np });
    }, { passive: true });
    main.appendChild(swipeEl);
    main.appendChild(el('p', 'muted pgsrc', 'পাতা ভাগ: 15 লাইনের ইন্দো-পাক (হাফেজি) কুরআন, 611 পাতা। পাতা নম্বর একটি ছাপা কপির সঙ্গে মিলিয়ে নিন।'));
    drawPageBar(items);
  }

  // Typos in the Tanzil Bangla source: text is shown unchanged (licence), with a short note under it.
  var TR_NOTE = { '79:31': 'অনুবাদের উৎসে ছাপার ভুল: “ঘাম” নয়। আরবি مَرْعَىٰ অর্থ চারণভূমি / ঘাস (পানি ও ঘাস)।' };
  function renderSura() {
    var s = curSura();
    // One local record keeps sura and ayah together, including Learn/Hifz and qari advancement.
    var reading = JSON.stringify({ sura: s.sura, ayah: s.ayas[sel].n });
    if (store('reading-v1') !== reading) store('reading-v1', reading);
    title.textContent = 'সূরা ' + (BN_NAMES[s.sura] || s.name_ar);
    main.appendChild(el('p', 'muted', 'একটি আয়াত বেছে নিন, নিচের বোতামে রেকর্ড করে নিজে শুনুন।'));
    // 5 Nov: size + অর্থ/উচ্চারণ/বানান sit in one collapsible "দেখার ধরন" row so the Quran text starts higher.
    var vw = el('details', 'viewopts'); if (store('vopen') === '1') vw.open = true;
    vw.ontoggle = function () { store('vopen', vw.open ? '1' : '0'); };
    vw.appendChild(el('summary', null, '⚙ দেখার ধরন: অর্থ ' + (showMean ? '✓' : '✗') + (pron && pron.suras[s.sura] ? ' · উচ্চারণ ' + (showPron ? '✓' : '✗') : '') + (spell && spell.suras[s.sura] ? ' · বানান ' + (showSpell ? '✓' : '✗') : '') + ' · লেখার আকার'));
    main.appendChild(vw);
    drawSize(vw);
    var sz = el('div', 'szrow');
    var mt = btn(showMean ? 'অর্থ ✓' : 'অর্থ ✗', 'alt', function () { showMean = !showMean; store('mean', showMean ? '1' : '0'); render(); }, sz);
    mt.setAttribute('aria-pressed', showMean ? 'true' : 'false');
    if (pron && pron.suras[s.sura]) {
      var pt = btn(showPron ? 'উচ্চারণ ✓' : 'উচ্চারণ ✗', 'alt', function () { showPron = !showPron; store('pron', showPron ? '1' : '0'); render(); }, sz);
      pt.setAttribute('aria-pressed', showPron ? 'true' : 'false');
    }
    if (spell && spell.suras[s.sura]) {
      var st = btn(showSpell ? 'বানান ✓' : 'বানান ✗', 'alt', function () { showSpell = !showSpell; store('spell', showSpell ? '1' : '0'); render(); }, sz);
      st.setAttribute('aria-pressed', showSpell ? 'true' : 'false');
    }
    if (tajweed && tajweed.suras[s.sura]) {
      var tj = btn(showTj ? 'তাজবীদ রং ✓' : 'তাজবীদ রং ✗', 'alt', function () { showTj = !showTj; store('tj', showTj ? '1' : '0'); render(); }, sz);
      tj.setAttribute('aria-pressed', showTj ? 'true' : 'false');
    }
    vw.appendChild(sz);
    if (showTj && tajweed && tajweed.suras[s.sura]) vw.appendChild(tjLegend(s.sura));
    if (s.sura < 78) { var dbx = el('div', 'dlbox'); dbx.id = 'dlbox'; main.appendChild(dbx); }
    if (s.sura !== 1 && s.sura !== 9) main.appendChild(el('div', 'bism', '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0640\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650'));
    if (showPron && pron && pron.suras[s.sura]) main.appendChild(el('p', 'pronnote', 'পরীক্ষামূলক: কোনো আলেম/ক্বারী এখনো যাচাই করেননি। বাংলা উচ্চারণ শুধু সহায়ক — সঠিক উচ্চারণ আরবিতে; ক্বারীর তিলাওয়াত শুনে মিলিয়ে নিন। ঁ = নাকে গুন্নাহসহ (ইখফা/ইদগাম); ‘ = আইন (ع), ’ = হামযা (ء) — দুটি আলাদা আরবি হরফের চিহ্ন; বাদ দেবেন না। এই চিহ্ন দেখে থামবেন না। ক্বারীর কণ্ঠে পার্থক্য শুনে শিক্ষককে দিয়ে মিলিয়ে নিন। ইকলাব ম আর ইখফা/ইদগামের গুন্নাহ ঁ দিয়ে মোটামুটি দেখানো হয়েছে; কিন্তু টানের মাপ (মাদ্দ ২/৪/৬), গুন্নাহর দৈর্ঘ্য ও কলকলা বাংলা অক্ষরে দেখানো যায় না: এগুলো জানতে ‘দেখার ধরন’-এ ‘তাজবীদ রং’ চালু করুন।'));
    if (showSpell && spell && spell.suras[s.sura]) main.appendChild(el('p', 'pronnote', SPELL_NOTE));
    if (showSpell && spell && spell.suras[s.sura] && wordT && s.sura >= 78) main.appendChild(el('p', 'muted', '🔊 বাছাই করা আয়াতের বানানে যেকোনো শব্দে চাপ দিলে ক্বারী হুসারির কণ্ঠে শব্দটি শুনবেন।'));
    s.ayas.forEach(function (a, i) {
      var b = el('button', 'ayah' + (i === sel ? ' sel' : ''));
      b.appendChild(tjText(s.sura, i, a.t));
      if (showPron && pron && pron.suras[s.sura] && pron.suras[s.sura][i]) b.appendChild(el('span', 'pron', pron.suras[s.sura][i]));
      if (showSpell && i === sel && spell && spell.suras[s.sura] && spell.suras[s.sura][i]) {
        var sp = el('span', 'spell');
        spell.suras[s.sura][i].forEach(function (ws, k) {
          var r = el('span', 'sw'); r.appendChild(el('span', 'swa', ws[0])); r.appendChild(el('span', 'swb', ws[1])); sp.appendChild(r);
          if (wordT && s.sura >= 78) { r.className = 'sw tap'; r.setAttribute('role', 'button'); r.setAttribute('aria-label', 'শব্দটি শুনুন'); r.onclick = function (e) { if (e && e.stopPropagation) e.stopPropagation(); playWord(s.sura, i, k); }; }
        });
        b.appendChild(sp);
      }
      if (showMean && bnTr && bnTr.suras[s.sura] && bnTr.suras[s.sura][i]) {
        b.appendChild(el('span', 'mean', bnTr.suras[s.sura][i]));
        if (TR_NOTE[s.sura + ':' + a.n]) b.appendChild(el('span', 'mean trnote', TR_NOTE[s.sura + ':' + a.n]));
      }
      var ap = s.sura >= 78 && pg15 && pageStart(s.sura, a.n);
      b.appendChild(el('span', 'n', 'আয়াত নম্বর ' + a.n + (ap ? ' · হাফেজি পাতা ' + ap + ' শুরু' : '') + (i === sel ? ' · বাছাই করা হয়েছে — নিচে ক্বারী চাপুন' : '')));
      b.setAttribute('aria-pressed', i === sel ? 'true' : 'false');
      b.onclick = function () { if (i === sel) return; guard(function () { stopActive(); sel = i; render(); var e = document.querySelector('.ayah.sel'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'center' }); }); };
      main.appendChild(b);
    });
    drawBar(); drawDl();
  }

  var tmr = null, t0 = 0;
  function fmt(sec) { return bn(Math.floor(sec / 60)) + ':' + bn(('0' + (sec % 60)).slice(-2)); }
  function stopTimer() { if (tmr) { clearInterval(tmr); tmr = null; } }

  function drawBar() {
    bar.textContent = ''; bar.hidden = false;
    if (micRequest) {
      var pending = el('span', 'hint', 'মাইক্রোফোনের অপেক্ষায়… অনুমতি চাইলে অনুমতি দিন।');
      pending.setAttribute('role', 'status'); bar.appendChild(pending);
      btn('বাতিল', 'alt', function () { cancelMicRequest(); drawBar(); }, bar);
      return;
    }
    if (rec && rec.state === 'inactive') {
      var saving = el('span', 'hint', 'রেকর্ডিং প্রস্তুত হচ্ছে…');
      saving.setAttribute('role', 'status'); bar.appendChild(saving); return;
    }
    var recording = rec && rec.state === 'recording';
    if (recording) {
      var tt = el('span', 'timer', '● ' + fmt(Math.floor((Date.now() - t0) / 1000)));
      bar.appendChild(tt);
      btn('■ থামুন', 'rec', function () { stopRec(); }, bar);
      stopTimer(); tmr = setInterval(function () { tt.textContent = '● ' + fmt(Math.floor((Date.now() - t0) / 1000)); }, 500);
    } else {
      stopTimer();
      if (wp) {
        btn('■ শব্দ থামান', 'rec', function () { stopWord(); drawBar(); }, bar);
        var wordStatus = el('span', 'hint', 'শব্দের তিলাওয়াত শুনছেন'); wordStatus.setAttribute('role', 'status'); bar.appendChild(wordStatus);
        return;
      }
      var tk = curTake();
      if (qp) { btn('■ ক্বারী থামান', 'rec', function () { stopQari(); qRep = 0; drawBar(); }, bar); bar.appendChild(el('span', 'timer', qBism ? 'বিসমিল্লাহ · তারপর আয়াত ' + bnCount(curSura().ayas[sel].n) : 'আয়াত ' + bnCount(curSura().ayas[sel].n) + ' · শুনছেন ' + bnCount(qRep + 1) + '/' + bnCount(QREPS[qri]) + ' বার' + (slow ? ' · ধীরে' : ''))); return; }
      if (qFinished) { var finished = el('div', 'hint', 'সূরার শেষ আয়াত পর্যন্ত শোনা হয়েছে। এই আয়াত আবার শুনতে ক্বারী চাপুন।'); finished.setAttribute('role', 'status'); bar.appendChild(finished); }
      var controls = el('div', 'practice-controls');
      bar.appendChild(controls);
      btn('🔊 ক্বারী', 'alt', startQari, controls);
      var sb = btn(slow ? 'ধীরে ✓' : 'ধীরে', 'alt', function () { slow = !slow; store('slow', slow ? '1' : '0'); drawBar(); }, controls);
      sb.setAttribute('aria-pressed', slow ? 'true' : 'false');
      btn('শুনব ' + bnCount(QREPS[qri]) + ' বার', 'alt', function () { qri = (qri + 1) % QREPS.length; store('qrep', String(qri)); drawBar(); }, controls).setAttribute('aria-label', 'প্রতি আয়াত ' + bnCount(QREPS[qri]) + ' বার শোনা; চাপলে সংখ্যা বদলাবে');
      btn(tk ? '● আবার রেকর্ড' : '● রেকর্ড', '', askMic, controls);
      bar.appendChild(el('div', 'muted hint', 'রেকর্ড শুধু এখন শোনার জন্য, অ্যাপ বন্ধ করলে মুছে যায়'));
      if (tk && window.AiCheck) btn('✓ AI দিয়ে মিলান', '', function () { aiCheck(tk); }, bar).setAttribute('aria-label', 'আমার রেকর্ড করা তিলাওয়াত AI দিয়ে শব্দ ধরে মিলিয়ে দেখুন');
      if (tk) {
        if (player) {
          btn('■ থামুন', 'rec', function () { stopPlay(); drawBar(); }, bar);
          bar.appendChild(el('span', 'timer', '♪ বাজছে'));
        } else {
          btn('▶ শুনুন', 'alt', function () {
            var a = new Audio(tk); player = a;
            a.onended = a.onerror = function () { if (player === a) { player = null; if (view.name === 'sura') drawBar(); } };
            var p = a.play(); if (p && p.catch) p.catch(function () { if (player !== a) return; player = null; a_pause(a); if (view.name === 'sura') drawBar(); alert('রেকর্ডিং বাজানো যায়নি। ফোনের ভলিউম দেখে আবার চেষ্টা করুন।'); });
            drawBar();
          }, bar);
        }
      }
    }
  }

  // 6 Nov 2026 (MD: built-in AI, beat competitors): on-phone AI check of the learner's own recording, word by word.
  // AI only listens; it never recites or writes Quran text. Words only, not tajweed. Voice never leaves the phone.
  var aiBusy = false;
  function aiNotice(go) {
    if (store('ai-ok') === '1') return go();
    var ov = el('div', 'ov'), box = el('div', 'card');
    box.appendChild(el('h2', null, 'AI দিয়ে মিলিয়ে দেখা (পরীক্ষামূলক)'));
    box.appendChild(el('p', null, 'আপনার রেকর্ড শুনে AI দেখাবে কোন শব্দ ঠিক শুনেছে, কোনটা বাদ গেছে বা অন্যরকম শুনেছে।'));
    box.appendChild(el('p', 'aibul', '• পরীক্ষামূলক: আসল শিক্ষার্থীর কণ্ঠে এখনো পুরো যাচাই হয়নি। AI ভুল করতে পারে, বিশেষ করে বাচ্চাদের কণ্ঠে। এটা শুধু সাহায্য, উস্তাদ বা ক্বারীর বিকল্প নয়।\n• শুধু শব্দ মেলায়, তাজবীদ (মাদ্দ, গুন্নাহ) বিচার করে না।\n• পুরো কাজ ফোনেই হয়, ইন্টারনেট লাগে না, আপনার কণ্ঠ কোথাও যায় না।'));
    var row = el('div', 'row');
    btn('এখন নয়', 'alt', function () { ov.remove(); }, row);
    btn('বুঝেছি, মিলাই', '', function () { ov.remove(); store('ai-ok', '1'); go(); }, row);
    box.appendChild(row); ov.appendChild(box); document.body.appendChild(ov);
  }
  function aiCheck(tk) {
    if (aiBusy) return;
    aiNotice(function () {
      var s = curSura(), i = sel, a = s.ayas[i], myKey = key();
      stopPlay(); aiBusy = true;
      var ov = el('div', 'ov'), box = el('div', 'card aibox'); box.setAttribute('role', 'dialog');
      var st = el('p', 'hint', 'AI চালু হচ্ছে… প্রথমবার একটু সময় লাগে।'); st.setAttribute('role', 'status');
      box.appendChild(el('h2', null, 'আয়াত ' + a.n + ' · AI দিয়ে মিলানো')); box.appendChild(st);
      ov.appendChild(box); document.body.appendChild(ov);
      var t0c = Date.now();
      window.AiCheck.check(tk, a.t, function (stage) { if (stage === 'listen') st.textContent = 'আপনার তিলাওয়াত শুনছে…'; })
        .then(function (r) { aiBusy = false; showAi(box, ov, r, s, i, myKey, Date.now() - t0c); })
        .catch(function () { aiBusy = false; st.textContent = 'AI চালু করা যায়নি। অ্যাপ বন্ধ করে আবার খুলে চেষ্টা করুন।'; var row = el('div', 'row'); btn('বন্ধ', 'alt', function () { ov.remove(); }, row); box.appendChild(row); });
    });
  }
  function showAi(box, ov, r, s, i, myKey, ms) {
    box.textContent = '';
    var a = s.ayas[i];
    box.appendChild(el('h2', null, 'আয়াত ' + a.n + ' · AI দিয়ে মিলানো'));
    var row = el('div', 'row');
    if (r.tooShort || r.silent) {
      box.appendChild(el('p', null, r.silent ? 'রেকর্ডে কোনো আওয়াজ পাওয়া যায়নি। ফোন মুখের কাছে রেখে জোরে পড়ে আবার রেকর্ড করুন।' : 'রেকর্ড খুব ছোট। পুরো আয়াত পড়ে আবার রেকর্ড করুন।'));
    } else {
      var bad = r.total - r.ok;
      box.appendChild(el('p', 'aisum ' + (r.allOk ? 'good' : 'warn'), r.allOk ? 'মাশাআল্লাহ! সব ' + r.total + 'টি শব্দ ঠিকঠাক শোনা গেছে।'
        : (bad ? bad + 'টি শব্দ AI ঠিকমতো মেলাতে পারেনি' : 'সব শব্দ মিলেছে') + (r.extra.length ? (bad ? ', আর ' : ', তবে ') + r.extra.length + 'টি বাড়তি শব্দ শোনা গেছে' : '') + '। ক্বারীর তিলাওয়াত শুনে আবার পড়ে দেখুন; AI নিজেও ভুল শুনতে পারে।'));
      var fl = el('div', 'aiwords'); fl.lang = 'ar'; fl.dir = 'rtl';
      r.words.forEach(function (w) {
        var sp = el('span', 'aiw ' + w.status, w.word);
        sp.setAttribute('aria-label', w.status === 'ok' ? 'ঠিক' : (w.status === 'missed' ? 'বাদ পড়েছে' : 'অন্যরকম শোনা গেছে'));
        fl.appendChild(sp); fl.appendChild(document.createTextNode(' '));
      });
      box.appendChild(fl);
      if (!r.allOk) {
        var lg = el('p', 'muted'); lg.textContent = '';
        lg.appendChild(el('span', 'aiw ok', 'সবুজ')); lg.appendChild(document.createTextNode(' = ঠিক · '));
        lg.appendChild(el('span', 'aiw wrong', 'লাল')); lg.appendChild(document.createTextNode(' = অন্যরকম শোনা গেছে · '));
        lg.appendChild(el('span', 'aiw missed', 'কমলা')); lg.appendChild(document.createTextNode(' = বাদ পড়েছে'));
        box.appendChild(lg);
      }
      box.appendChild(el('p', 'muted', 'AI ভুল করতে পারে; সন্দেহ হলে উস্তাদকে শোনান। শুধু শব্দ মেলানো হয়েছে, তাজবীদ নয়।'));
    }
    btn('বন্ধ', 'alt', function () { ov.remove(); }, row);
    btn('🔊 ক্বারী শুনুন', 'alt', function () { ov.remove(); if (view.name === 'sura' && key() === myKey) startQari(); }, row);
    btn('● আবার রেকর্ড', '', function () { ov.remove(); if (view.name === 'sura' && key() === myKey) askMic(); }, row);
    box.appendChild(row);
    try { var log = JSON.parse(store('ai-log') || '[]'); log.push([Date.now(), s.sura, a.n, r.ok || 0, r.total || 0, ms]); store('ai-log', JSON.stringify(log.slice(-200))); } catch (e) {}
  }

  var micExplained = false, micRequest = null;
  function cancelMicRequest() { micRequest = null; }
  function askMic() {
    if (micExplained) return startRec();
    var ov = el('div', 'ov'), box = el('div', 'card');
    box.appendChild(el('h2', null, 'মাইক্রোফোন লাগবে'));
    box.appendChild(el('p', null, 'আপনার তিলাওয়াত রেকর্ড করে নিজে শুনতে মাইক্রোফোন দরকার। রেকর্ডিং শুধু ফোনে থাকে, কোথাও পাঠানো হয় না, অ্যাপ বন্ধ করলে মুছে যায়। একবারে সর্বোচ্চ ৯০ সেকেন্ড রেকর্ড হয়।'));
    var row = el('div', 'row');
    btn('এখন নয়', 'alt', function () { ov.remove(); }, row);
    btn('ঠিক আছে', '', function () { ov.remove(); micExplained = true; startRec(); }, row);
    box.appendChild(row); ov.appendChild(box); document.body.appendChild(ov);
  }

  function startRec() {
    if (micRequest || rec || view.name !== 'sura') return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { alert('এই ফোনে রেকর্ডিং চালু করা যায়নি।'); return; }
    stopPlay();
    var request = { key: key() }; micRequest = request; drawBar();
    Promise.resolve().then(function () {
      return navigator.mediaDevices.getUserMedia({ audio: true });
    }).then(function (st) {
      if (micRequest !== request || view.name !== 'sura' || key() !== request.key) {
        st.getTracks().forEach(function (track) { track.stop(); }); return;
      }
      stream = st;
      var recorder = new MediaRecorder(st), parts = [], myKey = request.key;
      rec = recorder; recKey = myKey;
      recorder.ondataavailable = function (e) { if (e.data && e.data.size) parts.push(e.data); };
      recorder.onstop = function () {
        st.getTracks().forEach(function (track) { track.stop(); });
        if (parts.length) {
          var old = takes[myKey]; if (old) URL.revokeObjectURL(old);
          takes[myKey] = URL.createObjectURL(new Blob(parts, { type: recorder.mimeType || 'audio/webm' }));
        }
        if (rec === recorder) {
          rec = null; if (stream === st) stream = null; stopTimer();
          if (view.name === 'sura') drawBar();
        }
      };
      t0 = Date.now(); recorder.start(); micRequest = null; drawBar();
      setTimeout(function () { if (rec === recorder && recorder.state === 'recording') stopRec(); }, MAXSEC * 1000);
      var se = document.querySelector('.ayah.sel'); if (se && se.scrollIntoView) se.scrollIntoView({ block: 'center' });
    }).catch(function (err) {
      if (micRequest !== request) return;
      micRequest = null; releaseMic(); rec = null;
      if (view.name === 'sura') drawBar();
      var n = err && err.name;
      if (n === 'NotAllowedError') alert('মাইক্রোফোনের অনুমতি দরকার।\n1. ফোনের সেটিংসে কুরআন সাথী অ্যাপ খুঁজুন।\n2. অনুমতি থেকে মাইক্রোফোন চালু করুন।\n3. এখানে ফিরে রেকর্ড চাপুন।');
      else if (n === 'NotFoundError') alert('এই ফোনে মাইক্রোফোন পাওয়া যায়নি।');
      else if (n === 'NotReadableError' || n === 'AbortError') alert('মাইক্রোফোন চালু হয়নি।\nকল বা অন্য অ্যাপে রেকর্ডিং চললে বন্ধ করুন।\nতারপর আবার রেকর্ড চাপুন।');
      else if (n === 'SecurityError') alert('এখানে মাইক্রোফোন ব্যবহার বন্ধ আছে।\nকুরআন সাথী অ্যাপ আবার খুলে চেষ্টা করুন।');
      else alert('রেকর্ডিং শুরু হয়নি।\nআবার রেকর্ড চাপুন। কাজ না হলে অ্যাপ বন্ধ করে খুলুন।');
    });
  }

  function renderFeedback() {
    var s = curSura(), a = s.ayas[view.ayah];
    title.textContent = 'ফলাফল';
    var c = el('div', 'card'); c.appendChild(el('h2', null, 'সূরা ' + (BN_NAMES[s.sura] || s.name_ar) + ' · আয়াত ' + a.n));
    var ay = el('div', 'ayah'); ay.appendChild(el('span', 't', a.t)); c.appendChild(ay); main.appendChild(c);
    var f = el('div', 'card');
    f.appendChild(el('h2', null, 'উচ্চারণ ও তাজবীদ যাচাই এখনো নেই'));
    f.appendChild(el('p', null, 'এই সংস্করণে উচ্চারণ ও তাজবীদ যাচাই হয় না; আমরা কোনো বানানো ফলাফল দেখাই না। রেকর্ডের পর ‘✓ AI দিয়ে মিলান’ শুধু শব্দ মেলায় (পরীক্ষামূলক)।'));
    f.appendChild(el('p', 'muted', 'এখন যা করতে পারেন: নিজের রেকর্ডিং শুনে আয়াতের সাথে মিলিয়ে নিন, বা কোনো ক্বারীর তিলাওয়াতের সাথে তুলনা করুন। আপনার রেকর্ডিং ফোনের বাইরে যায় না এবং অ্যাপ বন্ধ করলে মুছে যায়।'));
    main.appendChild(f);
    bar.hidden = false;
    btn('← আবার পড়ুন', '', function () { view = { name: 'sura', sura: s.sura }; render(); }, bar);
  }

  function renderAbout() {
    title.textContent = 'তথ্য';
    var c = el('div', 'card');
    c.appendChild(el('h2', null, 'কুরআন সাথী'));
    c.appendChild(el('p', null, 'পুরো কুরআনের ১১৪টি সূরা পড়ুন, বাংলা অর্থ দেখুন, ক্বারীর তিলাওয়াত শুনুন, নিজের তিলাওয়াত রেকর্ড করে শুনুন। বিজ্ঞাপন নেই, সম্পূর্ণ বিনামূল্যে।'));
    c.appendChild(el('p', null, 'পরীক্ষামূলক AI শব্দ-মিলানো: রেকর্ডের পর AI দেখায় কোন শব্দ বাদ পড়েছে বা অন্যরকম শোনা গেছে। এটি উচ্চারণ ও তাজবীদ বিচার করে না, আসল শিক্ষার্থীর কণ্ঠে এখনো পুরো যাচাই হয়নি, ভুল করতে পারে। এটি শুধু অনুশীলনের সহায়ক; আলেম বা ক্বারীর বিকল্প নয়। সন্দেহ হলে যোগ্য শিক্ষকের কাছে যাচাই করুন।'));
    c.appendChild(el('p', null, 'ক্বারী শেখ মাহমুদ খলীল আল-হুসারী (রহ.)-এর তিলাওয়াত: আমপারা অ্যাপের ভেতরেই আছে (ইন্টারনেট লাগে না); অন্য সূরা ইন্টারনেটে বাজে, অথবা সূরা ধরে ডাউনলোড করে ইন্টারনেট ছাড়া শোনা যায়; প্রতি আয়াত ১, ৩, ৫ বা ১০ বার শুনে পরের আয়াতে যায়। অডিও: Islamic Network / alquran.cloud। এটি রেকর্ডিং, কৃত্রিম বুদ্ধিমত্তার তৈরি কণ্ঠ নয়।'));
    c.appendChild(el('p', 'muted', 'বাংলা অর্থ: মুহিউদ্দীন খান-এর অনুবাদ (Tanzil.net থেকে, অপরিবর্তিত)। http://tanzil.net/trans/ । অনুবাদ কুরআনের পূর্ণ ব্যাখ্যা নয়; বুঝতে অসুবিধা হলে আলেমের কাছে জানুন।'));
    c.appendChild(el('p', 'muted', 'কুরআনের আরবি পাঠ: Tanzil.net (Uthmani, v1.1), লাইসেন্স CC BY 3.0। আরবি অক্ষর ও হরকত অপরিবর্তিত (ওয়াকফ-চিহ্ন সহ)। ভুল পেলে উপরের "মতামত" বোতামে জানান।'));
    c.appendChild(el('p', 'muted', 'তাজবীদের রং: quran-tajweed, শব্দে শব্দে তিলাওয়াতের সময়: quran-align (দুটিই Collin Fair, CC BY 4.0, github.com/cpfair)। আরবি পাঠ বদলানো হয়নি, শুধু রং ও সময় যোগ।'));
    c.appendChild(el('p', 'muted', 'AI দিয়ে মিলানো: tarteel-ai/whisper-base-ar-quran মডেল (Apache-2.0), ফোনেই চলে transformers.js (Apache-2.0, Hugging Face) দিয়ে। AI শুধু আপনার পড়া শোনে, নিজে কখনো তিলাওয়াত করে না; AI ভুল করতে পারে।'));
    c.appendChild(el('p', 'muted', 'হাফেজি পাতার ভাগ (15 লাইন, 611 পাতা): quran_android (Quran.com-এর ওপেন সোর্স অ্যাপ, GPL-3.0, github.com/quran/quran_android)। শুধু কোন পাতায় কোন আয়াত, তা নেওয়া হয়েছে; আরবি পাঠ Tanzil-এরই।'));
    c.appendChild(el('p', 'muted', 'ওপেন সোর্স: এই অ্যাপের কোড GPL-3.0 লাইসেন্সে সবার জন্য খোলা: github.com/ansar-design/quran-sathi । কুরআনের পাঠ, অনুবাদ, তিলাওয়াত ও ফন্ট নিজ নিজ লাইসেন্সে থাকে (NOTICE.md)।'));
    c.appendChild(el('p', 'muted', 'ব্যবহারকারীর তথ্য: আপনার রেকর্ডিং ও অগ্রগতি শুধু এই ফোনে থাকে; অ্যাপ এগুলো কোথাও আপলোড করে না। অনলাইনে তিলাওয়াত শুনলে বা ডাউনলোড করলে অডিও সার্ভার আপনার আইপি ঠিকানা ও কোন আয়াতের অডিও চাওয়া হলো তা দেখতে পারে।'));
    main.appendChild(c);
    nqCard(main);
  }

  back.onclick = function () {
    if (view.name === 'feedback') { view = { name: 'sura', sura: view.sura }; render(); }
    else if (view.name === 'page') go({ name: 'hifz' });
    else if (view.name === 'sura' && view.from === 'page') go({ name: 'page', page: view.page });
    else guard(function () { go({ name: view.name === 'sura' && view.from === 'learn' ? 'learn' : 'list' }); });
  };
  // Bottom bar fit (5 Nov device test at largest system text, 360dp: bar took half the screen and hid the last ayah).
  // Over ~28% of the screen -> compact bar (hints hidden, smaller buttons); reading area always ends above the bar.
  function fitBar() {
    if (!bar.classList || !window.innerHeight) return;
    bar.classList.remove('compact');
    if (!bar.hidden && bar.offsetHeight > window.innerHeight * 0.28) bar.classList.add('compact');
    main.style.paddingBottom = (bar.hidden ? 24 : bar.offsetHeight + 24) + 'px';
  }
  if (typeof MutationObserver === 'function') new MutationObserver(fitBar).observe(bar, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('resize', fitBar);
  // Long title on a narrow screen: drop the word "সূরা " so the sura name itself stays readable.
  function fitTitle() {
    if (!title.scrollWidth || title.scrollWidth <= title.clientWidth) return;
    var t = title.textContent; if (t.indexOf('সূরা ') === 0) title.textContent = t.slice(5);
  }
  if (typeof MutationObserver === 'function') new MutationObserver(fitTitle).observe(title, { childList: true, characterData: true, subtree: true });
  // Android Back key (5 Nov device test: it did nothing, readers were stuck inside a sura).
  // Open dialog -> its cancel button; inner screen -> same as the header ←; sura list -> leave the app.
  var AppP = Cap && Cap.Plugins && Cap.Plugins.App;
  if (AppP && AppP.addListener) AppP.addListener('backButton', function () {
    var ovs = document.querySelectorAll('.ov, dialog[open]');
    if (ovs.length) { var o = ovs[ovs.length - 1], c = o.querySelector('button.alt'); if (c) c.click(); else o.remove(); return; }
    if (view.name === 'list') { stopActive(); AppP.exitApp(); return; }
    back.onclick();
  });
  $('about-btn').onclick = function () { guard(function () { go({ name: 'about' }); }); };
  window.addEventListener('pagehide', dropAll);
  window.addEventListener('resize', function () { var se = document.querySelector('.ayah.sel'); if (view.name === 'sura' && se && se.scrollIntoView) se.scrollIntoView({ block: 'center' }); });

  fetch('data/quran.json').then(function (r) { return r.json(); }).then(function (d) { data = d; render(); return fetch('data/quran_bn.json').then(function (r) { return r.json(); }).then(function (t) { bnTr = t; if (view.name !== 'list') render(); return fetch('data/pron_bn.json').then(function (r) { return r.json(); }).then(function (p) { pron = p; if (view.name !== 'list') render(); return fetch('data/spell_bn.json').then(function (r) { return r.json(); }).then(function (q) { spell = q; if (view.name !== 'list') render(); return fetch('data/tajweed.json').then(function (r) { return r.json(); }).then(function (tj) { tajweed = tj; if (view.name !== 'list') render(); return fetch('data/words_husary.json').then(function (r) { return r.json(); }).then(function (wt) { wordT = wt; if (view.name !== 'list') render(); }); }).catch(function () {}); }); }).catch(function () {}); }).catch(function () {}); })
    .catch(function () { main.textContent = 'ডেটা লোড করা যায়নি।'; });
  fetch('data/pages15.json').then(function (r) { return r.json(); }).then(function (d) { pg15 = d; if (data && (view.name === 'hifz' || view.name === 'sura')) render(); }).catch(function () {});
  render();
})();
