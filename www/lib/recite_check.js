/* Quran Sathi - on-device recitation CHECK (never recites, never generates Quran text).
 * Compares what the speech model heard (hyp) with the Tanzil ayah text (ref), word by word.
 * Result per ref word: ok | missed | wrong ; plus extra words the learner added.
 * Spelling-insensitive: diacritics, small signs, alef/ya/ta-marbuta forms are normalised away, and a word counts as
 * ok when it is close enough (edit distance) - the model writes some Uthmani words in plain spelling. */
(function (root) {
  'use strict';
  function norm(w) {
    return String(w || '')
      .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ]/g, '') // harakat, small signs, tatweel
      .replace(/[ٱآأإٲٳ]/g, 'ا')   // alef forms -> ا
      .replace(/[ىی]/g, 'ي')                              // alef maqsura / farsi ya -> ي
      .replace(/ة/g, 'ه')                                      // ta marbuta -> ه
      .replace(/[ؤ]/g, 'و').replace(/[ئ]/g, 'ي')     // hamza seats
      .replace(/ء/g, '')                                            // lone hamza (spelled very differently)
      .replace(/ا(?=ا)/g, '')
      .replace(/[^ء-ي]/g, '');
  }
  function words(s) {
    var a = String(s || '').split(/\s+/).map(function (w) { return { raw: w, n: norm(w) }; })
      .filter(function (x) { return x.n.length > 0; }), out = [];
    // Uthmani joins the vocative ya to the next word (يَـٰٓأَيُّهَا, يَـٰلَيْتَنِى); plain writing splits it: join both sides
    for (var i = 0; i < a.length; i++) {
      if (a[i].n === '\u064A\u0627' && i + 1 < a.length) { out.push({ raw: a[i].raw + ' ' + a[i + 1].raw, n: norm('\u064A\u0627' + a[i + 1].n) }); i++; }
      else out.push(a[i]);
    }
    return out;
  }
  function dist(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function close(a, b) {
    if (a === b) return true;
    var L = Math.max(a.length, b.length);
    // Uthmani vs plain spelling differs mostly by dropped/added alef or waw: allow 1 edit (2 for long words)
    return dist(a, b) <= (L >= 7 ? 2 : (L >= 3 ? 1 : 0));
  }
  /* Align ref words (Tanzil) with hyp words (model) by edit distance over words. */
  function compare(refText, hypText) {
    var R = words(refText), H = words(hypText), m = R.length, n = H.length, i, j;
    var c = [], bt = [];
    for (i = 0; i <= m; i++) { c[i] = []; bt[i] = []; for (j = 0; j <= n; j++) { c[i][j] = 0; bt[i][j] = ''; } }
    for (i = 1; i <= m; i++) { c[i][0] = i; bt[i][0] = 'D'; }
    for (j = 1; j <= n; j++) { c[0][j] = j; bt[0][j] = 'I'; }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      var same = close(R[i - 1].n, H[j - 1].n);
      var best = c[i - 1][j - 1] + (same ? 0 : 1), op = same ? 'M' : 'S';
      if (c[i - 1][j] + 1 < best) { best = c[i - 1][j] + 1; op = 'D'; }
      if (c[i][j - 1] + 1 < best) { best = c[i][j - 1] + 1; op = 'I'; }
      c[i][j] = best; bt[i][j] = op;
    }
    var out = [], extra = [];
    i = m; j = n;
    while (i > 0 || j > 0) {
      var o = bt[i][j];
      if (o === 'M' || o === 'S') { out.unshift({ word: R[i - 1].raw, status: o === 'M' ? 'ok' : 'wrong', heard: H[j - 1].raw }); i--; j--; }
      else if (o === 'D') { out.unshift({ word: R[i - 1].raw, status: 'missed', heard: '' }); i--; }
      else { extra.unshift(H[j - 1].raw); j--; }
    }
    var okN = out.filter(function (x) { return x.status === 'ok'; }).length;
    return { words: out, extra: extra, ok: okN, total: m, score: m ? okN / m : 0,
             allOk: okN === m && extra.length === 0 };
  }
  var api = { norm: norm, compare: compare, words: words };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ReciteCheck = api;
})(this);
