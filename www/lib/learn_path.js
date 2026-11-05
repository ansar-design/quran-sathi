/* Practice navigation only: self-reported, never an assessment of recitation. */
(function (root) {
  'use strict';
  var labels = ['অক্ষর', 'হরকত', 'বানান', 'শব্দ', 'আয়াত'];
  function restore(raw, suras) {
    var p; try { p = JSON.parse(raw); } catch (_) {}
    if (!p || typeof p !== 'object') p = {};
    var s = suras.find(function (s) { return s.sura >= 78 && s.sura === p.sura; }) || suras.find(function (s) { return s.sura === 112; });
    return { sura: s.sura, ayah: Number.isInteger(p.ayah) && p.ayah >= 0 && p.ayah < s.ayas.length ? p.ayah : 0,
      step: Number.isInteger(p.step) && p.step >= 0 && p.step < labels.length ? p.step : 0 };
  }
  // Keep the Arabic source intact. Grapheme cards are teaching aids, not replacement Quran text.
  function letters(text) {
    return groups(text).map(function (group) {
      // Tanzil uses tatweel + combining hamza for an independent hamza.
      // Only this teaching card uses the standalone shape; source text is untouched.
      return group[0] === '\u0640' && group.indexOf('\u0654') !== -1 ? 'ء' : group[0];
    });
  }
  function groups(text) {
    var cards = [];
    var units = text.match(/[\u0621-\u063a\u0640-\u064a\u0671][\u064b-\u065f\u0670\u06d6-\u06ed]*/g) || [];
    units.forEach(function (unit) {
      if (unit[0] === '\u0640' && unit.indexOf('\u0654') === -1) {
        // Ordinary elongation and its marks still belong to the previous letter.
        if (cards.length) cards[cards.length - 1] += unit;
      } else cards.push(unit);
    });
    return cards;
  }
  var api = { labels: labels, restore: restore, letters: letters, groups: groups };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LearnPath = api;
})(this);
