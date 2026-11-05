"""Build www/data/pages15.json: 15-line IndoPak (Hafezi) mushaf, page -> first ayah, 611 pages.
Source: quran/quran_android (GPL-3.0), naskh flavour page tables (copy in tools/src/quran_android_naskh_QuranData.java).
Checked 5 Nov 2026 against QUL 'Indopak 15 lines layout (Qudratullah)' (id 12): 607/610 pages same first ayah,
Juz Amma (pages 587-611) 100% same. Page numbers only (which ayat on each page); Arabic text stays Tanzil."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / 'tools/src/quran_android_naskh_QuranData.java').read_text()
arr = lambda n: [int(x) for x in re.findall(r'\d+', re.search(n + r'\s*=\s*\{([^}]*)\}', src).group(1))]
ps, pa = arr('PAGE_SURA_START'), arr('PAGE_AYAH_START')
assert len(ps) == len(pa) == 612
# page = index + 1 (SURA_PAGE_START: Fatiha p2, Baqarah p3, Naba p587, Nas p611). Page 1 = title page (no Quran
# text, repeats 1:1), last entry (114:6, 'page 612') = closing dua page -> both dropped. Quran pages = 2..611.
sp = arr('SURA_PAGE_START')
starts = [[i + 1, ps[i], pa[i]] for i in range(1, 611)]
assert all(starts[[x[0] for x in starts].index(sp[k])][1:] == [k + 1, 1] for k in (1, 2, 77, 112)), 'page index check'
q = json.loads((ROOT / 'www/data/quran.json').read_text())
n_ayas = {s['sura']: len(s['ayas']) for s in q['suras']}
prev = (0, 0)
for p, s, a in starts:
    assert 1 <= a <= n_ayas[s] and (s, a) > prev, (p, s, a); prev = (s, a)
out = {
    'name': '15-line IndoPak (Hafezi) mushaf, 611 pages',
    'source': 'quran_android (github.com/quran/quran_android, GPL-3.0), naskh page tables',
    'checked': '2026-11-05 vs QUL Qudratullah 15-line: 607/610 pages same; Juz Amma (587-611) all same; naskh page = QUL page + 1 (title page)',
    'verified_from': 587,
    'differs_qul': [[372, '26:92', '26:91'], [404, '29:52', '29:53'], [495, '43:63', '43:64']],
    'pages': starts,
}
(ROOT / 'www/data/pages15.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
print(len(starts), 'pages; Juz Amma', [x for x in starts if x[0] >= 587][:3], '...', starts[-1])
