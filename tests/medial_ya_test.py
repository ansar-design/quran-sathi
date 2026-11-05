"""Expert E1-E4: prefixed ya must not insert an independent i vowel."""
import sys,json
from pathlib import Path
P=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(P/'tools'))
import translit_bn as T
checks={'لِيَوْمٍ عَظِيمٍ':'লিয়াওমিন ‘আযীম্','بِيَوْمِ':'বিয়াওম্','فَيَوْمَئِذٍ':'ফায়াওমা’ইয্','يَوْمٍ':'ইয়াওম্'}
for ar,bn in checks.items():assert T.convert_ayah(ar)==bn,(ar,T.convert_ayah(ar),bn)
src=json.loads((P/'www/data/quran.json').read_text())['suras']
pron=json.loads((P/'www/data/pron_bn.json').read_text())['suras']
for s in src:
 if s['sura']>=78:assert pron[str(s['sura'])]==[T.convert_ayah(a['t']) for a in s['ayas']]
print('PASS medial ya: li/bi/fa prefixes, initial ya, full corpus freshness')
