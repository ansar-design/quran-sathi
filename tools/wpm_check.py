#!/usr/bin/env python3
"""Words/min of bundled Husary clips at playback rate 1.0 (voice-speed rule). Appends to quality/quran-tutor/tests.txt."""
import json, subprocess, random, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(root + '/www/data/juz_amma.json'))
suras = d['suras'] if isinstance(d, dict) and 'suras' in d else d
random.seed(7)
rows = []
for s in suras:
    for a in s['ayas']:
        rows.append((s['sura'], a['n'], len(a['t'].split())))
pick = random.sample([r for r in rows if r[2] >= 3], 24)
res = []
for su, n, w in pick:
    f = '%s/www/audio/husary/%s_%s.mp3' % (root, su, n)
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip()
    dur = float(out)
    res.append((su, n, w, dur, w / dur * 60))
tot_w = sum(r[2] for r in res); tot_d = sum(r[3] for r in res)
lines = ['WPM check (Husary 64kbps, rate 1.0, %d clips >=3 words): overall %.0f wpm; min %.0f max %.0f' % (len(res), tot_w / tot_d * 60, min(r[4] for r in res), max(r[4] for r in res))]
lines += ['  %s:%s words=%d dur=%.1fs wpm=%.0f' % r for r in res]
lines.append('Slow option plays at 0.75x (~%.0f wpm); never sped up. Qari recitation = natural pace (rule: recitation = natural qari pace).' % (tot_w / tot_d * 60 * 0.75))
print('\n'.join(lines))
