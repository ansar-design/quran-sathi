// Accuracy test of the on-device recitation check: Husary bundled audio (32 kbps mono) vs Tanzil text.
// node eval_model.mjs <modelDir> [N]
import { pipeline, env } from '@huggingface/transformers';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const RC = require('../../www/lib/recite_check.js');
const W = path.resolve('../../www');
const modelDir = path.resolve(process.argv[2] || 'model-base'), N = +(process.argv[3] || 60);
env.allowRemoteModels = false; env.localModelPath = path.dirname(modelDir);
const asr = await pipeline('automatic-speech-recognition', path.basename(modelDir), { dtype: 'q8', device: 'cpu' });
const ja = JSON.parse(fs.readFileSync(W + '/data/juz_amma.json'));
const all = []; for (const s of ja.suras) for (const a of s.ayas) all.push({ k: `${s.sura}_${a.n}`, t: a.t });
const step = Math.max(1, Math.floor(all.length / N)), pick = all.filter((_, i) => i % step === 0).slice(0, N);
function pcm(f) { const b = execFileSync('ffmpeg', ['-v', 'quiet', '-i', f, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  return new Float32Array(b.buffer, b.byteOffset, b.length / 4); }
let falseAlarm = 0, words = 0, wrongWords = 0, t = 0, caughtSkip = 0, skipN = 0, caughtSwap = 0, swapN = 0; const bad = [];
for (let i = 0; i < pick.length; i++) {
  const a = pick[i], audio = pcm(`${W}/audio/husary/${a.k}.mp3`);
  const t0 = Date.now(); const r = await asr(audio); t += Date.now() - t0;
  const c = RC.compare(a.t, r.text); words += c.total; wrongWords += c.total - c.ok;
  if (!c.allOk) { falseAlarm++; bad.push(`${a.k}: ${c.words.filter(w => w.status !== 'ok').map(w => w.word + '->' + (w.heard || '-')).join(' ')} +[${c.extra.join(' ')}] | heard: ${r.text}`); }
  // simulated mistake 1: learner skipped a word = reference has one more word than audio
  const ws = a.t.split(/\s+/); if (ws.length >= 3) { skipN++; const other = pick[(i + 7) % pick.length].t.split(/\s+/)[1] || 'كَلَّا';
    const ref2 = [...ws.slice(0, 2), other, ...ws.slice(2)].join(' '); if (!RC.compare(ref2, r.text).allOk) caughtSkip++; }
  // simulated mistake 2: recited a different ayah
  const o = pick[(i + 1) % pick.length]; swapN++; if (!RC.compare(o.t, r.text).allOk) caughtSwap++;
}
console.log(JSON.stringify({ model: path.basename(modelDir), ayat: pick.length, falseAlarmAyat: falseAlarm, wordErrPct: +(100 * wrongWords / words).toFixed(2),
  skippedWordCaught: `${caughtSkip}/${skipN}`, otherAyahCaught: `${caughtSwap}/${swapN}`, msPerAyah: Math.round(t / pick.length) }));
console.log(bad.slice(0, 15).join('\n'));
