#!/usr/bin/env python3
"""Conservative spelling diagnostics, not religious clearance or a gate replacement.

Reads packaged output independently of spell_bn/translit_bn. Exit 1 when
findings remain; --report-only exits 0 for inventory work. JSON goes to stdout.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def findings(word, spelling):
    issues = []
    # Word-level evidence is conservative: a real mark elsewhere in the word
    # suppresses this check. It cannot verify attribution to a particular letter.
    for label, signs, code in [
        ('খাড়া জবর', 'ٰ', 'unwritten_standing_fatha'),
        ('খাড়া জের', 'ٖۦ', 'unwritten_standing_kasra'),
        ('উল্টা পেশ', 'ٗۥ', 'unwritten_inverted_damma'),
    ]:
        if label in spelling and not any(c in word for c in signs):
            issues.append(code)
    # Bare dotless ya after kasra is a madd carrier, not another y consonant.
    # Exact bounded pattern excludes sukun/diphthong, shadda, hamza and silent
    # carrier marks; 89:23's silent-alif bridge is deliberately not recognized.
    # Multiple ya letters make whole-word attribution ambiguous: skip them.
    if (sum(word.count(c) for c in 'يى') == 1
            and re.search('ِى[ٓ]?(?=[ء-يٱ]|$)', word)
            and 'ইয়া-সাকিন-য়্' in spelling):
        issues.append('madd_ya_extra_consonant')
    if 'আলিফ-সাকিন-্' in spelling:
        issues.append('alif_isolated_hasanta')
    return issues


def audit(path):
    raw = path.read_bytes()
    data = json.loads(raw)['suras']
    rows = []
    words = 0
    for sura, ayahs in data.items():
        for ayah, pairs in enumerate(ayahs, 1):
            for index, (word, spelling) in enumerate(pairs, 1):
                words += 1
                codes = findings(word, spelling)
                if codes:
                    rows.append(dict(ref=f'{sura}:{ayah}:{index}', arabic=word,
                                     spelling=spelling, findings=codes))
    return dict(scope='Conservative spelling diagnostics only; not expert clearance',
                source=str(path), sha256=hashlib.sha256(raw).hexdigest(),
                words=words, affected_words=len(rows),
                counts=dict(sorted(Counter(c for r in rows for c in r['findings']).items())),
                rows=rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=ROOT/'www/data/spell_bn.json')
    parser.add_argument('--report-only', action='store_true')
    args = parser.parse_args()
    result = audit(args.input)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return int(bool(result['rows']) and not args.report_only)


if __name__ == '__main__':
    raise SystemExit(main())
