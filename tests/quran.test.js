// Full Quran data (MD 3 Nov): 114 suras, 6236 ayas, 30 juz, global ayah numbers for the qari CDN, Bangla meaning + names.
const fs = require('fs'), path = require('path'), assert = require('assert');
const W = path.join(__dirname, '../www');
const d = JSON.parse(fs.readFileSync(path.join(W, 'data/quran.json'), 'utf8'));
const tr = JSON.parse(fs.readFileSync(path.join(W, 'data/quran_bn.json'), 'utf8'));
const ja = JSON.parse(fs.readFileSync(path.join(W, 'data/juz_amma.json'), 'utf8'));
assert.strictEqual(d.suras.length, 114);
assert.strictEqual(d.juz.length, 30);
assert.deepStrictEqual(d.juz[29], [78, 1]);
let g = 1, total = 0;
d.suras.forEach((s, i) => {
  assert.strictEqual(s.sura, i + 1);
  assert.strictEqual(s.g0, g, 'global start ' + s.sura);           // cdn.islamic.network numbering 1..6236
  s.ayas.forEach((a, k) => { assert.strictEqual(a.n, k + 1); assert(/[؀-ۿ]/.test(a.t)); });
  assert.strictEqual(tr.suras[s.sura].length, s.ayas.length, 'meaning ' + s.sura);
  assert(tr.suras[s.sura].every(t => t && t.trim()), 'empty meaning ' + s.sura);
  assert(s.kb > 0);
  g += s.ayas.length; total += s.ayas.length;
});
assert.strictEqual(total, 6236);
assert.strictEqual(d.suras[77].g0, 5673);                            // same numbering fetch_audio.py used for the bundled clips
ja.suras.forEach(s => assert.deepStrictEqual(d.suras[s.sura - 1].ayas, s.ayas, 'juz amma text changed ' + s.sura));
const app = fs.readFileSync(path.join(W, 'app.js'), 'utf8');
for (let k = 1; k <= 114; k++) assert(new RegExp('[{ ,]' + k + ":'").test(app), 'bn name ' + k);
// Sura names must be plain Arabic letters: no orphan combining marks / tatweel (claude r8 dotted-circle claim, 4 Nov)
d.suras.forEach(s => assert(/^[ء-ي ]+$/.test(s.name_ar), 'name_ar plain letters ' + s.sura));
console.log('quran.test OK: 114 suras, 6236 ayas, 30 juz, meaning + names complete');
