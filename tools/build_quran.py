#!/usr/bin/env python3
"""Build the FULL Quran data (MD 3 Nov: all 114 suras; qari audio downloaded per sura inside the app).
  www/data/quran.json    - Tanzil Uthmani text, verbatim (same XML as extract_juz_amma.py), + juz starts, global ayah start
                           (for cdn.islamic.network/quran/audio/64/ar.husary/<global>.mp3) and an audio size estimate per sura
  www/data/quran_bn.json - Tanzil bn.bengali (Muhiuddin Khan), verbatim
Counts and juz starts are asserted against Tanzil's official metadata (tanzil.net/res/text/metadata/quran-data.js)."""
import json, os, re, urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Tanzil Uthmani XML (no pause marks), e.g. from the quran_transcript pip package: quran-script/quran-uthmani-without-pause-sajda-hizb-marks.xml
SRC = os.environ.get("QURAN_XML", "quran-uthmani-without-pause-sajda-hizb-marks.xml")
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read().decode('utf-8')

meta = get('https://tanzil.net/res/text/metadata/quran-data.js')
sura_meta = [tuple(map(int, m.groups())) for m in re.finditer(r"\[(\d+), (\d+), \d+, \d+, '", meta.split('QuranData.Sura')[1].split('];')[0])]
assert len(sura_meta) == 114, len(sura_meta)                      # (global start index 0-based, ayah count)
juz = [list(map(int, m.groups())) for m in re.finditer(r'\[(\d+), (\d+)\]', meta.split('QuranData.Juz')[1].split('];')[0])][:30]
assert len(juz) == 30 and juz[0] == [1, 1] and juz[29] == [78, 1], juz

# bytes of Husary 64 kbps per Arabic letter, measured on the bundled Juz Amma clips (size ~ text length, r=0.958)
husary = os.path.join(ROOT, 'www/audio/husary')
suras, total = [], 0
for s in ET.parse(SRC).getroot().iter('sura'):
    idx = int(s.get('index'))
    ayas = [{'n': int(a.get('index')), 't': a.get('text')} for a in s.iter('aya')]
    start, count = sura_meta[idx - 1]
    assert len(ayas) == count, (idx, len(ayas), count)
    suras.append({'sura': idx, 'name_ar': s.get('name'), 'name_en': s.get('tname'), 'g0': start + 1, 'ayas': ayas})
    total += count
assert len(suras) == 114 and total == 6236, (len(suras), total)
chars = sum(len(a['t']) for s in suras if s['sura'] >= 78 for a in s['ayas'])
bpc = sum(os.path.getsize(os.path.join(husary, f)) for f in os.listdir(husary)) / chars
for s in suras:
    s['kb'] = round(bpc * sum(len(a['t']) for a in s['ayas']) / 1024)
json.dump({'source': 'Tanzil Uthmani v1.1 (tanzil.net, CC BY 3.0), unchanged', 'juz': juz, 'suras': suras},
          open(os.path.join(ROOT, 'www/data/quran.json'), 'w', encoding='utf-8'), ensure_ascii=False)

tr = {}
for line in get('https://tanzil.net/trans/bn.bengali').splitlines():
    if line.startswith('#') or '|' not in line:
        continue
    a, b, t = line.split('|', 2)
    tr[(int(a), int(b))] = t.strip()
out = {'source': 'Tanzil bn.bengali - Muhiuddin Khan (non-commercial, text unchanged) http://tanzil.net/trans/', 'suras': {}}
for s in suras:
    lst = [tr[(s['sura'], a['n'])] for a in s['ayas']]
    assert all(lst), s['sura']
    out['suras'][str(s['sura'])] = lst
assert sum(len(v) for v in out['suras'].values()) == 6236
json.dump(out, open(os.path.join(ROOT, 'www/data/quran_bn.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

# the Juz Amma part must stay byte-identical to the checked juz_amma.json
old = {s['sura']: s['ayas'] for s in json.load(open(os.path.join(ROOT, 'www/data/juz_amma.json'), encoding='utf-8'))['suras']}
assert all(s['ayas'] == old[s['sura']] for s in suras if s['sura'] >= 78)
print('OK 114 suras, 6236 ayas, 30 juz; audio est total MB', round(sum(s['kb'] for s in suras) / 1024), '| bytes/char', round(bpc))
