#!/usr/bin/env python3
"""Tajweed colour spans for Juz Amma (78-114) on OUR exact Arabic text -> www/data/tajweed.json  (5 Nov 2026)

Source: cpfair/quran-tajweed (Collin Fair), CC BY 4.0, https://github.com/cpfair/quran-tajweed
  tools/src/cpfair_tajweed_hafs_uthmani.json  = output/tajweed.hafs.uthmani-pause-sajdah.json (character offsets)
  tools/src/cpfair_tajweed_text.txt           = the Tanzil Uthmani text those offsets point into (ayah 1 carries the Bismillah)
Our text (www/data/quran.json, Tanzil Uthmani v1.1 + tatweel + pause marks) differs only in display characters, so every
cpfair character is aligned to ours (difflib on the character sequence) and spans are moved; the Arabic is NEVER changed.
Check (fails the build): a moved span must cover exactly the same letters+marks as the source span, ignoring tatweel/pause marks.
Output: {"source": ..., "rules": {...}, "suras": {"78": [[[rule, start, end], ...] per ayah]}}  (offsets into a.t, end exclusive)
usage: python3 tools/build_tajweed.py"""
import difflib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'src')
IGN = re.compile('[\u0640\u06D6-\u06DC\u06DE\u06E9\u06DD\u06E2\u06ED\\s]')   # compare only: tatweel, pause/sajdah/hizb marks,
# small meem of iqlab/ikhfa tanween (Tanzil v1.1 has them, cpfair's copy not) and spaces
# Bangla names shown in the legend (teacher VERIFY wording)
RULES = {
    'hamzat_wasl': 'হামযাতুল ওয়াসল (পড়া হয় না)', 'lam_shamsiyyah': 'লাম শামসিয়া (পড়া হয় না)', 'silent': 'নীরব অক্ষর',
    'madd_2': 'মদ্দ ২ হরকত', 'madd_246': 'মদ্দ ২/৪/৬ (থামলে)', 'madd_munfasil': 'মদ্দ মুনফাসিল', 'madd_muttasil': 'মদ্দ মুত্তাসিল',
    'madd_6': 'মদ্দ লাযিম ৬ হরকত', 'ghunnah': 'গুন্নাহ', 'ikhfa': 'ইখফা', 'ikhfa_shafawi': 'ইখফা শাফাবি', 'iqlab': 'ইকলাব',
    'idghaam_ghunnah': 'ইদগাম গুন্নাহসহ', 'idghaam_no_ghunnah': 'ইদগাম গুন্নাহ ছাড়া', 'idghaam_mutajanisayn': 'ইদগাম মুতাজানিসাইন',
    'idghaam_mutaqaribayn': 'ইদগাম মুতাকারিবাইন', 'idghaam_shafawi': 'ইদগাম শাফাবি', 'qalqalah': 'কলকলা',
}


def main():
    ours = {s['sura']: [a['t'] for a in s['ayas']] for s in json.load(open(os.path.join(ROOT, 'www/data/quran.json'), encoding='utf-8'))['suras'] if s['sura'] >= 78}
    cpt = {}
    for line in open(os.path.join(SRC, 'cpfair_tajweed_text.txt'), encoding='utf-8'):
        p = line.rstrip('\n').split('|')
        if len(p) == 3 and p[0].isdigit():
            cpt[(int(p[0]), int(p[1]))] = p[2]
    ann = {(x['surah'], x['ayah']): x['annotations'] for x in json.load(open(os.path.join(SRC, 'cpfair_tajweed_hafs_uthmani.json'), encoding='utf-8')) if x['surah'] >= 78}
    out, bad, total, kept, skipped, unknown = {}, [], 0, 0, 0, set()
    for sura, ayas in sorted(ours.items()):
        rows = []
        for i, t in enumerate(ayas):
            src = cpt[(sura, i + 1)]
            shift = 0
            if i == 0 and sura not in (1, 9):          # cpfair puts the Bismillah in front of ayah 1: cut it, move offsets
                bare = lambda w: re.sub('[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]', '', w)
                w = src.split(' ')
                assert [bare(x) for x in w[:4]] == [bare(x) for x in cpt[(1, 1)].split(' ')], (sura, src[:50])
                shift = len(' '.join(w[:4])) + 1; src = src[shift:]
            sm = difflib.SequenceMatcher(None, src, t, autojunk=False)
            m = {}
            for blk in sm.get_matching_blocks():
                for k in range(blk.size):
                    m[blk.a + k] = blk.b + k
            spans = []
            for a in ann.get((sura, i + 1), []):
                total += 1
                if shift:
                    if a['end'] <= shift: skipped += 1; continue   # mark inside the Bismillah, not part of our ayah
                    a = dict(a, start=a['start'] - shift, end=a['end'] - shift)
                if a['rule'] not in RULES:
                    unknown.add(a['rule'])
                idx = [m[j] for j in range(a['start'], a['end']) if j in m]
                if not idx:
                    bad.append((sura, i + 1, a, 'unmapped')); continue
                s0, e0 = min(idx), max(idx) + 1
                if IGN.sub('', src[a['start']:a['end']]) != IGN.sub('', t[s0:e0]):
                    bad.append((sura, i + 1, a, src[a['start']:a['end']], t[s0:e0])); continue
                spans.append([a['rule'], s0, e0]); kept += 1
            rows.append(spans)
        out[str(sura)] = rows
    if unknown:
        print('UNKNOWN RULES (add a Bangla name):', unknown)
    print(f'annotations {total}, kept {kept}, Bismillah-prefix skipped {skipped}, failed {len(bad)}')
    for b in bad[:20]:
        print('  FAIL', b)
    if bad or unknown:
        sys.exit(1)
    json.dump({'source': 'cpfair/quran-tajweed (Collin Fair), CC BY 4.0, https://github.com/cpfair/quran-tajweed; offsets moved onto the app text, Arabic unchanged',
               'rules': RULES, 'suras': out}, open(os.path.join(ROOT, 'www/data/tajweed.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('wrote www/data/tajweed.json')


if __name__ == '__main__':
    main()
