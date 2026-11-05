// Tajweed colour spans (www/data/tajweed.json, built by tools/build_tajweed.py from cpfair/quran-tajweed CC BY 4.0):
// every Juz Amma ayah has a row, spans lie inside the ayah text, known rule, and colouring never changes a character.
const fs = require('fs'), path = require('path'), assert = require('assert');
const W = path.join(__dirname, '../www');
const q = JSON.parse(fs.readFileSync(path.join(W, 'data/quran.json'), 'utf8'));
const tj = JSON.parse(fs.readFileSync(path.join(W, 'data/tajweed.json'), 'utf8'));
assert(/CC BY 4\.0/.test(tj.source));
let n = 0;
q.suras.filter(s => s.sura >= 78).forEach(s => {
  const rows = tj.suras[s.sura]; assert(rows && rows.length === s.ayas.length, 'rows ' + s.sura);
  rows.forEach((sp, i) => {
    const t = s.ayas[i].t; let pos = 0, rebuilt = '';
    sp.slice().sort((x, y) => x[1] - y[1]).forEach(([r, a, b]) => {
      assert(tj.rules[r], 'unknown rule ' + r); assert(0 <= a && a < b && b <= t.length, `span ${s.sura}:${i + 1}`);
      if (a < pos) return; rebuilt += t.slice(pos, a) + t.slice(a, b); pos = b; n++;
    });
    assert.strictEqual(rebuilt + t.slice(pos), t, 'text changed ' + s.sura + ':' + (i + 1));
  });
});
assert(n > 1500, 'too few spans ' + n);
console.log('tajweed.test OK: ' + n + ' coloured spans, Arabic unchanged');
