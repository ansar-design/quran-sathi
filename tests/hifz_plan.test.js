// Hifz plan: lessons cover every ayah exactly once, in order; sabqi/manzil windows are correct.
const fs = require('fs'), path = require('path'), assert = require('assert');
const H = require('../www/lib/hifz_plan.js');
const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../www/data/juz_amma.json'), 'utf8'));
[1, 2, 3].forEach(size => ['reverse', 'forward'].forEach(order => {
  const L = H.buildLessons(d.suras, size, order);
  const seen = {};
  L.forEach(l => { assert(l.from <= l.to); for (let n = l.from; n <= l.to; n++) { const k = l.sura + ':' + n; assert(!seen[k], 'dup ' + k); seen[k] = 1; } });
  assert.strictEqual(Object.keys(seen).length, 564, 'all ayas covered');
  assert.strictEqual(L[0].sura, order === 'reverse' ? 114 : 78);
  // no lesson crosses a sura; consecutive lessons of one sura are contiguous
  for (let i = 1; i < L.length; i++) if (L[i].sura === L[i - 1].sura) assert.strictEqual(L[i].from, L[i - 1].to + 1);
}));
const L = H.buildLessons(d.suras, 2, 'reverse');
let p = H.dayPlan(L, 0, 0);
assert(p.sabaq === L[0] && p.sabqi.length === 0 && p.manzil.length === 0);
p = H.dayPlan(L, 5, 3);
assert.strictEqual(p.sabqi.length, 5); assert.strictEqual(p.manzil.length, 0);
p = H.dayPlan(L, 20, 10);
assert.strictEqual(p.sabqi.length, 7); assert(p.manzil.length >= 1);
p.manzil.forEach(m => assert(L.indexOf(m) < 13, 'manzil only from older lessons'));
// manzil rotation visits every older lesson within the cycle
const old = new Set();
for (let day = 0; day < H.MANZIL_CYCLE_DAYS; day++) H.dayPlan(L, 40, day).manzil.forEach(m => old.add(L.indexOf(m)));
assert.strictEqual(old.size, 33);
p = H.dayPlan(L, L.length, 99);
assert(p.finished && p.sabaq === null);
console.log('hifz_plan.test OK: ' + L.length + ' lessons (medium)');
