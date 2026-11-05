// Word timings (www/data/words_husary.json, tools/build_word_audio.py, cpfair/quran-align CC BY 4.0):
// one entry per spelling word of every Juz Amma ayah, ordered, inside the bundled clip length window.
const fs = require('fs'), path = require('path'), assert = require('assert');
const W = path.join(__dirname, '../www');
const sp = JSON.parse(fs.readFileSync(path.join(W, 'data/spell_bn.json'), 'utf8')).suras;
const wt = JSON.parse(fs.readFileSync(path.join(W, 'data/words_husary.json'), 'utf8'));
assert(/CC BY 4\.0/.test(wt.source));
let n = 0;
for (const [s, rows] of Object.entries(sp)) rows.forEach((words, i) => {
  const t = wt.suras[s][i]; assert(t && t.length === words.length, `count ${s}:${i + 1}`);
  let prev = -1;
  t.forEach(x => { assert(x && x[0] >= 0 && x[1] > x[0] && x[1] - x[0] < 15000, `time ${s}:${i + 1}`); assert(x[0] >= prev - 50, `order ${s}:${i + 1}`); prev = x[0]; n++; });
  assert(fs.existsSync(path.join(W, `audio/husary/${s}_${i + 1}.mp3`)));
});
assert.strictEqual(n, 2308);
console.log('words_audio.test OK: ' + n + ' word slices on bundled Husary clips');
