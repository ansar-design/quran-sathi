#!/usr/bin/env python3
"""Inventory source signs needing classifier review, NOT detected content errors.

Independent of the teaching generators. Indices are zero-based Python Unicode
code-point offsets into the unchanged Arabic word. No normalization is applied.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
SIGNS = {'\u0654': 'combining_hamza_above', '\u0655': 'combining_hamza_below',
         '\u06e5': 'small_waw', '\u06e6': 'small_yeh',
         '\u0656': 'subscript_alef', '\u0657': 'inverted_damma'}


def edge_signs(word):
    result = []
    base = None
    for index, char in enumerate(word):
        category = SIGNS.get(char)
        if char in '\u0652\u06e1' and base is not None and word[base] in 'اويى':
            category = 'explicit_sukun_on_carrier_shape'
        if category:
            result.append({'category': category, 'offset': index,
                           'codepoint': f'U+{ord(char):04X}',
                           'unicode_name': unicodedata.name(char),
                           'base_offset': base,
                           'base': word[base] if base is not None else None})
        # Small waw/yeh are Unicode modifier letters, but remain annotations
        # here. Tatweel is retained as a hamza support, never silently removed.
        if unicodedata.category(char).startswith('L') and char not in SIGNS:
            base = index
    return result


def inventory(path):
    raw = path.read_bytes()
    data = json.loads(raw)['suras']
    rows = []
    words = 0
    for sura, ayahs in data.items():
        for ayah, pairs in enumerate(ayahs, 1):
            for index, (word, spelling) in enumerate(pairs, 1):
                words += 1
                signs = edge_signs(word)
                if signs:
                    rows.append({'ref': f'{sura}:{ayah}:{index}', 'arabic': word,
                                 'spelling': spelling, 'signs': signs})
    return {'scope': 'Review inventory only; signs are not errors or religious clearance',
            'source': str(path), 'sha256': hashlib.sha256(raw).hexdigest(),
            'offset_unit': 'zero-based Unicode code points; no normalization',
            'reference_unit': 'sura:ayah:1-based packaged spelling pair; standalone stop signs excluded',
            'words': words, 'review_words': len(rows),
            'sign_counts': dict(sorted(Counter(s['category'] for r in rows for s in r['signs']).items())),
            'rows': rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=ROOT/'www/data/spell_bn.json')
    args = parser.parse_args()
    print(json.dumps(inventory(args.input), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
