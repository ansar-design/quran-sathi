// Word checker used by the on-phone AI check (www/lib/recite_check.js). Model accuracy: tools/ai/eval_model.mjs.
const assert = require('assert'); const RC = require('../www/lib/recite_check.js');
const ja = require('../www/data/juz_amma.json');
const plain = t => t.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/ٱ/g, 'ا');
let n = 0;
for (const s of ja.suras) for (const a of s.ayas) {
  // a learner who read every word right (model writes plain spelling) = all ok
  const r = RC.compare(a.t, plain(a.t)); assert.ok(r.allOk, `${s.sura}:${a.n} plain spelling flagged`);
  const ws = a.t.split(/\s+/).filter(w => RC.norm(w).length); // pause signs are not words
  if (ws.length >= 3) { // skipped middle word = exactly one missed
    const r2 = RC.compare(a.t, plain(ws.filter((_, i) => i !== 1).join(' ')));
    assert.ok(!r2.allOk && r2.words.some(w => w.status === 'missed'), `${s.sura}:${a.n} skip not caught`);
  }
  n++;
}
// known model spellings that must count as right
assert.ok(RC.compare('يَـٰٓأَيُّهَا ٱلْإِنسَـٰنُ', 'يَا أَيُّهَا الْإِنْسَانُ').allOk);
assert.ok(RC.compare('ٱلصَّلَوٰةَ', 'الصَّلَاةَ').allOk);
// a really different word must not pass
assert.ok(!RC.compare('ٱلْيَتِيمَ', 'الْيَقِينَ').allOk);
assert.strictEqual(RC.compare('قُلْ هُوَ ٱللَّهُ أَحَدٌ', 'قل هو الله').words[3].status, 'missed');
assert.strictEqual(RC.compare('', '').total, 0);
console.log('recite_check ok', n, 'ayat');
