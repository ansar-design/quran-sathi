// Optional AI slow voice (6 Nov): every listed ayah has its file, only Juz Amma, no unlisted files shipped.
const fs = require('fs'), path = require('path'), assert = require('assert');
const D = path.join(__dirname, '..', 'www', 'audio', 'gemini'), J = path.join(D, 'index.json');
if (!fs.existsSync(J)) { console.log('SKIP gemini voice: no index yet'); process.exit(0); }
const j = JSON.parse(fs.readFileSync(J, 'utf8')), set = new Set(j.ayat);
for (const k of j.ayat) { const [s, a] = k.split('_').map(Number); assert(s >= 78 && s <= 114 && a >= 1, k); assert(fs.existsSync(path.join(D, k + '.mp3')), 'missing ' + k); }
for (const f of fs.readdirSync(D)) if (f.endsWith('.mp3') && f !== 'bismillah.mp3') assert(set.has(f.slice(0, -4)), 'unlisted file ' + f);
if (j.bismillah) assert(fs.existsSync(path.join(D, 'bismillah.mp3')));
const app = fs.readFileSync(path.join(__dirname, '..', 'www', 'app.js'), 'utf8');
assert(/function gemHas[^]*voice === 'gemini' && s\.sura >= 78/.test(app), 'Gemini only for Juz Amma when chosen');
assert(/store\('voice'\) === 'gemini' \? 'gemini' : 'husary'/.test(app), 'Husary is the default');
console.log('PASS gemini voice: ' + j.ayat.length + ' ayat listed, files match, Husary default + fallback');
