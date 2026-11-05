// Hifz daily plan: sabaq (new lesson), sabqi (recent revision), manzil (older revision rotation).
// Pure functions, no DOM, no network. Works in the app (window.HifzPlan) and in node tests.
(function (root) {
  var SIZE_CHARS = { 1: 90, 2: 170, 3: 280 }; // small / medium / large lesson (Arabic letters incl. marks)
  var SABQI_LESSONS = 7;      // revise the last 7 lessons every day
  var MANZIL_CYCLE_DAYS = 30; // older lessons are all revised once in about 30 days

  // order: 'reverse' (114 -> 78, how madrasas start Amma para) or 'forward' (78 -> 114)
  // suras: [{sura, ayas:[{n,t}]}] as in data/juz_amma.json
  function buildLessons(suras, size, order) {
    var max = SIZE_CHARS[size] || SIZE_CHARS[2];
    var list = suras.slice().sort(function (a, b) { return order === 'forward' ? a.sura - b.sura : b.sura - a.sura; });
    var lessons = [];
    list.forEach(function (s) {
      var from = 1, len = 0;
      s.ayas.forEach(function (a, i) {
        var l = a.t.length;
        if (len > 0 && len + l > max) { lessons.push({ sura: s.sura, from: from, to: s.ayas[i - 1].n }); from = a.n; len = 0; }
        len += l;
      });
      lessons.push({ sura: s.sura, from: from, to: s.ayas[s.ayas.length - 1].n });
    });
    return lessons;
  }

  // done = number of lessons already memorised (and passed). dayIndex = days since the plan started (0, 1, 2...).
  function dayPlan(lessons, done, dayIndex) {
    var sabaq = done < lessons.length ? lessons[done] : null;
    var sabqiFrom = Math.max(0, done - SABQI_LESSONS);
    var sabqi = lessons.slice(sabqiFrom, done);
    var oldCount = sabqiFrom;
    var manzil = [];
    if (oldCount > 0) {
      var perDay = Math.max(1, Math.ceil(oldCount / MANZIL_CYCLE_DAYS));
      var start = (dayIndex * perDay) % oldCount;
      for (var k = 0; k < Math.min(perDay, oldCount); k++) manzil.push(lessons[(start + k) % oldCount]);
    }
    return { sabaq: sabaq, sabqi: sabqi, manzil: manzil, finished: done >= lessons.length };
  }

  var api = { buildLessons: buildLessons, dayPlan: dayPlan, SABQI_LESSONS: SABQI_LESSONS, MANZIL_CYCLE_DAYS: MANZIL_CYCLE_DAYS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HifzPlan = api;
})(typeof window !== 'undefined' ? window : this);
