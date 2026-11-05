// Every ayah has exactly one bundled non-empty Husary clip (<sura>_<n>.mp3), no strays; Bangla meaning covers every ayah;
// Hifz plan covers each of the 564 ayahs exactly once as new lesson (sabaq) material.
const fs = require('fs'), path = require('path'), assert = require('assert');
const W = path.join(__dirname, '../www');
const d = JSON.parse(fs.readFileSync(path.join(W, 'data/juz_amma.json'), 'utf8'));
const files = new Set(fs.readdirSync(path.join(W, 'audio/husary')).filter(f => f.endsWith('.mp3')));
let n = 0;
d.suras.forEach(s => s.ayas.forEach(a => {
  const f = s.sura + '_' + a.n + '.mp3';
  assert(files.has(f), 'missing audio ' + f);
  assert(fs.statSync(path.join(W, 'audio/husary', f)).size > 2000, 'tiny audio ' + f);
  files.delete(f); n++;
}));
// bismillah.mp3 = Husary Al-Fatiha 1:1 (same source), recited before ayah 1 of other suras (5 Nov)
assert(files.has('bismillah.mp3') && fs.statSync(path.join(W, 'audio/husary/bismillah.mp3')).size > 2000, 'missing bismillah.mp3');
files.delete('bismillah.mp3');
assert.strictEqual(files.size, 0, 'stray audio files: ' + [...files].slice(0, 5));
assert.strictEqual(n, 564);
const trFile = fs.readdirSync(path.join(W, 'data')).find(f => /bn|mean|tr/i.test(f) && f !== 'juz_amma.json');
if (trFile) {
  const tr = JSON.parse(fs.readFileSync(path.join(W, 'data', trFile), 'utf8'));
  d.suras.forEach(s => { const t = tr.suras[s.sura]; assert(t && t.length === s.ayas.length && t.every(x => x && x.trim()), 'meaning ' + s.sura); });
}
console.log('audio_map.test OK: 564 clips 1:1 with ayas' + (trFile ? ', meaning complete (' + trFile + ')' : ''));
