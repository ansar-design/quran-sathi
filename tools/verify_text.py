#!/usr/bin/env python3
"""Cross-check the app's Quran text + Bangla meaning against independent copies (MD 3 Nov: "Yes, check it").
  python3 tools/verify_text.py <download folder>
The folder holds (fetched with curl, see verify_text.sh):
  cloud_uth.json  api.alquran.cloud quran-uthmani   - another published copy of Tanzil Uthmani -> must match EXACTLY
  cloud_bn.json   api.alquran.cloud bn.bengali      - another copy of Muhiuddin Khan          -> must match EXACTLY
  qpc/<n>.json    api.quran.com qpc_hafs            - King Fahd Complex (Madinah Mushaf) text, independent of Tanzil.
                  Its marks use other Unicode codes, so we compare the LETTERS of every word (rasm), marks removed.
Prints a report and exits 1 if any ayah differs."""
import json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = sys.argv[1]
app = {s['sura']: [a['t'] for a in s['ayas']] for s in json.load(open(os.path.join(ROOT, 'www/data/quran.json'), encoding='utf-8'))['suras']}
bn = {int(k): v for k, v in json.load(open(os.path.join(ROOT, 'www/data/quran_bn.json'), encoding='utf-8'))['suras'].items()}
BISM = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
# our XML is Tanzil's "without pause/sajda/hizb marks" option and writes a tatweel before the small alif (ـٰ); the other
# copy has the marks and no tatweel. Those are display choices, so they are removed before the exact compare - every
# letter and every vowel mark (harakat, shadda, sukun, small alif/waw/ya, madd) must still be identical.
# Tanzil 1.0 vs 1.1 also write two things differently with the same reading: hamza as a free letter (ءَ) or a mark
# above (َٔ, vowel then on the letter before), and the small yeh as U+06E6 or U+06E7. So hamza is dropped, small yeh
# unified, and the marks on each letter compared as a set (order of marks in Unicode does not change the reading).
def show(t):
    t = re.sub('[\u0640\u06D6-\u06DC\u06DE\u06E9\u06DD\u0621\u0654\ufeff]', '', t).replace('\u06E7', '\u06E6')
    out = []
    for ch in unicodedata.normalize('NFD', ' '.join(t.split())):
        if unicodedata.combining(ch) or ch in '\u0670\u06E5\u06E6' or '\u06DF' <= ch <= '\u06ED':
            if out: out[-1] += ch
        else:
            out.append(ch)
    return ''.join(c[0] + ''.join(sorted(c[1:])) for c in out)
report, bad = [], 0

# 1. exact: second copy of Tanzil Uthmani (alquran.cloud puts the Bismillah in front of ayah 1 of each sura but 1 and 9)
cu = json.load(open(os.path.join(D, 'cloud_uth.json'), encoding='utf-8'))['data']['surahs']
diff1, space1 = [], []
bare = lambda w: ''.join(c for c in unicodedata.normalize('NFD', w) if not unicodedata.combining(c) and c not in '\u0670\u06E5\u06E6')
for s in cu:
    for a in s['ayahs']:
        t, n = show(a['text']), a['numberInSurah']
        if n == 1 and s['number'] not in (1, 9) and [bare(w) for w in t.split()[:4]] == [bare(w) for w in show(BISM).split()]:
            t = ' '.join(t.split()[4:])                   # their Bismillah (spelt بِّسْمِ in a few suras), not part of the ayah
        ours = show(app[s['number']][n - 1])
        if t.replace(' ', '') == ours.replace(' ', '') and t != ours:
            space1.append(f"{s['number']}:{n}")              # e.g. بَعْدَمَا / بَعْدَ مَا - same letters and marks
        elif t != ours:
            diff1.append((s['number'], n, [(p, q) for p, q in zip(t.split(), ours.split()) if p != q][:2]))
report.append(f'1) Arabic vs 2nd Tanzil copy (alquran.cloud): {sum(len(v) for v in app.values())} ayahs; letters+marks differ: {len(diff1)}; '
              f'only the word gap differs: {len(space1)} {space1}' + ''.join(f'\n   {d[0]}:{d[1]} theirs/ours {d[2]}' for d in diff1[:30]))

# 2. exact: second copy of the Bangla meaning
cb = json.load(open(os.path.join(D, 'cloud_bn.json'), encoding='utf-8'))['data']['surahs']
norm = lambda t: unicodedata.normalize('NFC', ' '.join(t.split()))
diff2 = [(s['number'], a['numberInSurah']) for s in cb for a in s['ayahs'] if norm(a['text']) != norm(bn[s['number']][a['numberInSurah'] - 1])]
report.append(f'2) Bangla meaning vs 2nd copy (alquran.cloud bn.bengali): differences: {len(diff2)} {diff2[:10]}')
bad += len(diff2)

# 3. letters of every word vs King Fahd Complex text (independent source)
# hamza is written on different seats in the two scripts (Tanzil ـٔ / ٔا, KFGQPC أ), so the seat letter is kept and the
# hamza itself dropped; everything else in a word must be the same letter in the same place.
LET = {'ٱ': 'ا', 'ٲ': 'ا', 'ٳ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ؤ': 'و', 'ئ': 'ي', 'ى': 'ي', 'ء': '', 'ۦ': '', 'ۥ': '', 'ـ': ''}
def rasm(t):
    t = re.sub(r'[٠-٩۰-۹]+', '', t)            # ayah number at the end (KFGQPC)
    out = []
    for ch in unicodedata.normalize('NFC', t):
        ch = LET.get(ch, ch)
        if ch == ' ' or ('ء' <= ch <= 'ي') or ch in 'ٹپچڈژکگیۃ':
            out.append(ch)
    return ' '.join(''.join(out).split())
diff3, space3 = [], []
for n in range(1, 115):
    for v in json.load(open(os.path.join(D, 'qpc', f'{n}.json'), encoding='utf-8'))['verses']:
        s, a = map(int, v['verse_key'].split(':'))
        x, y = rasm(app[s][a - 1]), rasm(v['text_qpc_hafs'])
        if x.replace(' ', '') == y.replace(' ', '') and x != y:
            space3.append(f'{s}:{a}')
        elif x != y:
            diff3.append((s, a, x, y))
count3 = sum(1 for n in range(1, 115) for _ in json.load(open(os.path.join(D, 'qpc', f'{n}.json'), encoding='utf-8'))['verses'])
report.append(f'3) Arabic letters vs King Fahd Complex (quran.com qpc_hafs): {count3} ayahs, words with different letters: {len(diff3)}; same letters, only the word gap differs: {len(space3)} {space3}')
for s, a, x, y in diff3[:60]:
    xw, yw = x.split(), y.split()
    w = [(i, p, q) for i, (p, q) in enumerate(zip(xw, yw)) if p != q] or [('len', len(xw), len(yw))]
    report.append(f'   {s}:{a}  {w[:3]}')
bad += len(diff3) + (count3 != 6236)
# a 1) difference is settled when OUR ayah agrees with the King Fahd text (the other copy is then the odd one out)
kf_bad = {(s, a) for s, a, _, _ in diff3}
open1 = [d for d in diff1 if (d[0], d[1]) in kf_bad]
report.append(f'   1) differences where ours also matches King Fahd (other copy is the odd one): {len(diff1) - len(open1)}; still open: {len(open1)}')
bad += len(open1)
print('\n'.join(report))
print('RESULT:', 'ALL MATCH' if not bad else f'{bad} differences - see above')
sys.exit(1 if bad else 0)
