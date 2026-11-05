"""Build www/data/juz_amma_bn.json from Tanzil bn.bengali (Muhiuddin Khan). Text kept verbatim.
Licence: Tanzil translations are non-commercial, text unchanged, credit translator + http://tanzil.net/trans/
Counts are asserted against juz_amma.json."""
import json, os, urllib.request
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ar = json.load(open(os.path.join(root, 'www/data/juz_amma.json'), encoding='utf-8'))
raw = urllib.request.urlopen('https://tanzil.net/trans/bn.bengali', timeout=60).read().decode('utf-8')
tr = {}
for line in raw.splitlines():
    if line.startswith('#') or '|' not in line:
        continue
    s, a, t = line.split('|', 2)
    tr[(int(s), int(a))] = t.strip()
out = {'source': 'Tanzil bn.bengali - Muhiuddin Khan (non-commercial, text unchanged) http://tanzil.net/trans/', 'suras': {}}
n = 0
for s in ar['suras']:
    lst = []
    for a in s['ayas']:
        t = tr[(s['sura'], a['n'])]
        assert t
        lst.append(t); n += 1
    assert len(lst) == len(s['ayas'])
    out['suras'][str(s['sura'])] = lst
assert n == 564, n
json.dump(out, open(os.path.join(root, 'www/data/juz_amma_bn.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('ok', n)
