// Audio URL = CDN + global ayah number (1..6236). Check every sura's g0 and that all 6236 numbers are used once, in order.
const fs = require('fs'), path = require('path');
const q = JSON.parse(fs.readFileSync(path.join(__dirname, '../www/data/quran.json'), 'utf8'));
let g = 1, seen = 0;
q.suras.forEach(function (s) {
  if (s.g0 !== g) throw new Error('sura ' + s.sura + ' g0 ' + s.g0 + ' expected ' + g);
  s.ayas.forEach(function (a, i) { if (s.g0 + i !== g + i) throw new Error('bad index'); seen++; });
  g += s.ayas.length;
});
if (seen !== 6236 || g - 1 !== 6236) throw new Error('total ' + seen);
// known anchors (global numbers): 1:1=1, 2:1=8, 2:286=293, 3:1=294, 9:1=1236, 36:1=3706, 78:1=5672, 114:6=6236
const anchors = [[1, 1, 1], [2, 1, 8], [2, 286, 293], [3, 1, 294], [9, 1, 1236], [36, 1, 3706], [78, 1, 5673], [114, 6, 6236]];
anchors.forEach(function (x) {
  const s = q.suras[x[0] - 1];
  if (s.g0 + x[1] - 1 !== x[2]) throw new Error('anchor ' + x[0] + ':' + x[1] + ' = ' + (s.g0 + x[1] - 1) + ' expected ' + x[2]);
});
console.log('qari_url.test OK: g0 contiguous 1..6236, 8 anchors match');
