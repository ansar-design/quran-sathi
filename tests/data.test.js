// Quran data integrity: Juz Amma = suras 78-114, official ayah counts, non-empty verbatim text.
const fs = require('fs'), path = require('path'), assert = require('assert');
const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../www/data/juz_amma.json'), 'utf8'));
const COUNTS = { 78:40,79:46,80:42,81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,90:20,91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,101:11,102:8,103:3,104:9,105:5,106:4,107:7,108:3,109:6,110:3,111:5,112:4,113:5,114:6 };
assert.strictEqual(d.suras.length, 37);
let total = 0;
d.suras.forEach(s => {
  assert.strictEqual(s.ayas.length, COUNTS[s.sura], 'sura ' + s.sura);
  s.ayas.forEach((a, i) => { assert.strictEqual(a.n, i + 1); assert(a.t.trim().length > 0); assert(/[؀-ۿ]/.test(a.t)); });
  total += s.ayas.length;
});
assert.strictEqual(total, 564);
// every sura has a Bangla name in the UI
const app = fs.readFileSync(path.join(__dirname, '../www/app.js'), 'utf8');
Object.keys(COUNTS).forEach(k => assert(new RegExp('\\b' + k + ':').test(app), 'bn name ' + k));
console.log('data.test OK: 37 suras, 564 ayas');
