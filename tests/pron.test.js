// pron_bn.json must cover every Juz Amma ayah, hold only Bangla letters/marks, and never show raw Arabic.
var fs = require('fs'), path = require('path');
var W = path.join(__dirname, '..', 'www', 'data');
var p = JSON.parse(fs.readFileSync(path.join(W, 'pron_bn.json'), 'utf8')).suras;
var q = JSON.parse(fs.readFileSync(path.join(W, 'juz_amma.json'), 'utf8')).suras;
var bad = [];
q.forEach(function (s) {
  var a = p[String(s.sura)];
  if (!a || a.length !== s.ayas.length) { bad.push('count ' + s.sura); return; }
  a.forEach(function (t, i) {
    if (!t || /[؀-ۿ]/.test(t)) bad.push(s.sura + ':' + (i + 1) + ' arabic/empty');
    if (/[^ঀ-৿‘’\- ]/.test(t.replace('[শ্বাস না নিয়ে অল্পক্ষণ থামুন]', ''))) bad.push(s.sura + ':' + (i + 1) + ' odd char');
    if (/্্|^্| ্/.test(t)) bad.push(s.sura + ':' + (i + 1) + ' hasant');
  });
});
if (bad.length) { console.error('pron.test FAIL', bad.slice(0, 10)); process.exit(1); }
console.log('pron.test OK: ' + q.length + ' suras, Bangla pronunciation for every ayah');
