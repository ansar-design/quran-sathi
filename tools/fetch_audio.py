"""Fetch Juz Amma ayah audio (Husary, 64 kbps) from Islamic Network CDN into www/audio/husary/<sura>_<ayah>.mp3.
Juz Amma = last 564 ayahs of the Quran, so global number = 5672 + running index. Bundled in the APK (offline, no INTERNET permission).
Reciter audio is the reciter's copyright: credit in About; drop the folder + audio.js flag to remove."""
import json, os, urllib.request
from concurrent.futures import ThreadPoolExecutor
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ar = json.load(open(os.path.join(root, 'www/data/juz_amma.json'), encoding='utf-8'))
out = os.path.join(root, 'www/audio/husary'); os.makedirs(out, exist_ok=True)
jobs = []; g = 5672
for s in ar['suras']:
    for a in s['ayas']:
        g += 1; jobs.append((g, os.path.join(out, '%d_%d.mp3' % (s['sura'], a['n']))))
assert g == 6236, g
jobs.append((1, os.path.join(out, 'bismillah.mp3')))   # Husary Al-Fatiha 1:1, recited before ayah 1 of other suras
def get(j):
    g, p = j
    if os.path.exists(p) and os.path.getsize(p) > 1000: return 0
    for _ in range(3):
        try:
            d = urllib.request.urlopen(urllib.request.Request('https://cdn.islamic.network/quran/audio/64/ar.husary/%d.mp3' % g, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
            if len(d) > 1000:
                open(p, 'wb').write(d); return 0
        except Exception as e:
            err = e
    print('FAIL', g, p); return 1
with ThreadPoolExecutor(6) as ex: fails = sum(ex.map(get, jobs))
tot = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out))
print('files', len(os.listdir(out)), 'fails', fails, 'MB', round(tot / 1e6, 1))
# --small: re-encode ayah clips to 32 kbps mono 22.05 kHz with ffmpeg (what the released app bundles, ~20 MB instead of ~40 MB).
# Word timings (words_husary.json) are the same recording, so they still fit. bismillah.mp3 is kept as downloaded.
import sys, subprocess, shutil
if '--small' in sys.argv:
    assert shutil.which('ffmpeg'), 'ffmpeg needed for --small'
    for f in sorted(os.listdir(out)):
        if not f.endswith('.mp3') or f == 'bismillah.mp3': continue
        p = os.path.join(out, f); t = p + '.tmp.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-ac', '1', '-ar', '22050', '-b:a', '32k', t], check=True); os.replace(t, p)
    print('re-encoded to 32 kbps mono, MB', round(sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) / 1e6, 1))
