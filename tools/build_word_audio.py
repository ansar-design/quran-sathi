#!/usr/bin/env python3
"""Word timings for tap-a-word-to-hear, Juz Amma (78-114) -> www/data/words_husary.json  (5 Nov 2026)

Source: cpfair/quran-align (Collin Fair), CC BY 4.0, https://github.com/cpfair/quran-align  (tools/src/Husary_64kbps.json)
Timings were made on everyayah Husary_64kbps; our bundled files (cdn.islamic.network ar.husary 64 kbps) are the SAME
recording: cross-correlation 0.997 / 0.995 at 0 ms lag (112:1, 103:3), durations within 52 ms (checked 5 Nov).
Words = Tanzil words with letters (pause-sign-only tokens skipped) = the app's spelling cards, same order.
Output {"source":..., "suras": {"78": [[[start_ms, end_ms] or null per word] per ayah]}}. Fails if word counts differ."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import translit_bn as T

al = {(x['surah'], x['ayah']): x['segments'] for x in json.load(open(os.path.join(ROOT, 'tools/src/Husary_64kbps.json')))}
q = json.load(open(os.path.join(ROOT, 'www/data/quran.json'), encoding='utf-8'))
out, missing, total = {}, 0, 0
for s in q['suras']:
    if s['sura'] < 78: continue
    rows = []
    for i, a in enumerate(s['ayas']):
        words = [w for w in a['t'].split() if T.parse_word(w)]
        seg = al[(s['sura'], i + 1)]
        times = [None] * len(words)
        for w0, w1, t0, t1 in seg:
            if w1 - w0 == 1 and 0 <= w0 < len(words):      # one word per segment only; merged segments are not sliced
                times[w0] = [t0, t1]
        if max(x[1] for x in seg) > len(words):
            sys.exit(f'word count mismatch {s["sura"]}:{i + 1} align {max(x[1] for x in seg)} vs app {len(words)}')
        total += len(words); missing += times.count(None)
        rows.append(times)
    out[str(s['sura'])] = rows
json.dump({'source': 'cpfair/quran-align (Collin Fair), CC BY 4.0; Husary 64 kbps word timings', 'suras': out},
          open(os.path.join(ROOT, 'www/data/words_husary.json'), 'w'), separators=(',', ':'))
print(f'words {total}, timed {total - missing}, untimed {missing}; wrote www/data/words_husary.json')
