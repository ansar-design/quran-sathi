"""Put Tanzil's pause/sakta marks back into www/data/quran.json + juz_amma.json.
Our text came from a Tanzil variant WITHOUT pause marks (found by expert panel 3 Nov: sakta at 83:14 missing).
Source of marks: alquran.cloud quran-uthmani (= Tanzil Uthmani WITH pause marks). Rule: an ayah is replaced ONLY if,
after removing pause marks and spaces, it is identical to ours; otherwise ours is kept and listed.
Usage: python3 tools/add_pause_marks.py [--write]"""
import json, os, sys, re, urllib.request
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www', 'data') + os.sep
PAUSE = set(chr(c) for c in range(0x06D6, 0x06DD)) | {'۞', '۩'}  # small waqf signs, sakta (06DC), rub el hizb, sajda


def norm(s):
    return ''.join(('\u0621' if c == '\u0654' else c) for c in s if c not in PAUSE and c != '\u0640' and not c.isspace())


def merge(ours, theirs):
    """our letters/spacing unchanged, only their pause marks inserted (space + mark) after the word they follow."""
    out, j = '', 0
    for c in theirs:
        if c in PAUSE and j < len(ours) and ours[j] == c:  # mark already in our text (mid-word sakta etc.)
            out += c
            j += 1
        elif c in PAUSE:
            out +=(' ' + c) if out and out[-1] != ' ' else c
        elif c.isspace() or c == '\u0640':
            continue
        else:
            while j < len(ours) and (ours[j].isspace() or ours[j] == '\u0640'):
                if not (ours[j].isspace() and out and out[-1] in PAUSE and False):
                    out += ours[j]
                j += 1
            assert norm(ours[j]) == norm(c), (ours, theirs)
            out += ours[j]
            j += 1
    out += ours[j:]
    return out


q = json.load(open(W + 'quran.json', encoding='utf8'))
ja = json.load(open(W + 'juz_amma.json', encoding='utf8'))
theirs = {}
for n in range(1, 115):
    d = json.load(urllib.request.urlopen('https://api.alquran.cloud/v1/surah/%d/quran-uthmani' % n, timeout=60))
    for a in d['data']['ayahs']:
        theirs[(n, a['numberInSurah'])] = a['text']
assert len(theirs) == 6236, len(theirs)
changed = kept = 0
kept_list = []
for doc in (q, ja):
    for s in doc['suras']:
        for a in s['ayas']:
            t = theirs[(s['sura'], a['n'])]
            if s['sura'] != 1 and a['n'] == 1 and t.startswith('بِسْمِ ٱللَّهِ'):
                pass  # alquran.cloud prefixes the bismillah to ayah 1 of most suras; handled below
            if norm(t) == norm(a['t']):
                m = merge(a['t'], t)
                if m != a['t']:
                    changed += 1
                a['t'] = m
            else:
                # alquran.cloud puts the bismillah in front of ayah 1 (except 1 and 9): strip it
                bis = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
                if a['n'] == 1 and norm(t).startswith(norm(bis)) and norm(t[len(bis):]) == norm(a['t']):
                    a['t'] = merge(a['t'], t[len(bis):].strip())
                    changed += 1
                else:
                    kept += 1
                    kept_list.append('%d:%d' % (s['sura'], a['n']))
print('changed', changed, 'kept', kept, kept_list[:40])
marks = sum(1 for doc in (q,) for s in doc['suras'] for a in s['ayas'] for c in a['t'] if c in PAUSE)
print('pause marks now in quran.json:', marks)
if '--write' in sys.argv:
    q['source'] = 'Tanzil Uthmani v1.1 (tanzil.net, CC BY 3.0) with pause marks, via alquran.cloud copy; ayahs that differ only in letters kept from earlier build: ' + ','.join(sorted(set(kept_list)))
    ja['source'] = q['source']
    json.dump(q, open(W + 'quran.json', 'w', encoding='utf8'), ensure_ascii=False)
    json.dump(ja, open(W + 'juz_amma.json', 'w', encoding='utf8'), ensure_ascii=False)
    print('written')
