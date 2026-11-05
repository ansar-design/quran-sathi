// spell_bn.json must cover every Juz Amma ayah word-for-word: Arabic word equals the ayah word, spelling is Bangla only.
var fs = require('fs'), path = require('path');
var W = path.join(__dirname, '..', 'www', 'data');
var p = JSON.parse(fs.readFileSync(path.join(W, 'spell_bn.json'), 'utf8')).suras;
var q = JSON.parse(fs.readFileSync(path.join(W, 'juz_amma.json'), 'utf8')).suras;
var bad = [], words = 0;
q.forEach(function (s) {
  var a = p[String(s.sura)];
  if (!a || a.length !== s.ayas.length) { bad.push('count ' + s.sura); return; }
  a.forEach(function (ws, i) {
    var src = s.ayas[i].t.split(/\s+/).filter(function (x) { return /[ء-يٱ]/.test(x); });  // pause-sign-only tokens carry no letters
    if (ws.length !== src.length) bad.push(s.sura + ':' + (i + 1) + ' words ' + ws.length + '/' + src.length);
    ws.forEach(function (w, k) {
      words++;
      if (w[0] !== src[k]) bad.push(s.sura + ':' + (i + 1) + ' word ' + k + ' differs');
      if (!w[1] || /[؀-ۿ]/.test(w[1])) bad.push(s.sura + ':' + (i + 1) + ' spelling empty/arabic');
    });
  });
});
if (bad.length) { console.error('spell.test FAIL', bad.slice(0, 10), 'total', bad.length); process.exit(1); }
console.log('spell.test OK: ' + q.length + ' suras, ' + words + ' words spelled');
