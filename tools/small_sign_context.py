#!/usr/bin/env python3
"""Small-waw/yeh reviewer context; no tajweed verdict or pronunciation inference."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
from inventory_spell_edges import edge_signs

ROOT = Path(__file__).resolve().parents[1]


def align_words(text, pairs):
    """Exact whitespace-token alignment; refuse omitted words or changed marks."""
    tokens = text.split()
    positions = []
    cursor = 0
    for word, _ in pairs:
        while cursor < len(tokens) and not any(c.isalpha() for c in tokens[cursor]):
            cursor += 1  # retain standalone stop signs in the full source context
        if cursor == len(tokens) or tokens[cursor] != word:
            raise ValueError('Spelling/source token mismatch; regenerate or investigate')
        positions.append(cursor)
        cursor += 1
    if any(c.isalpha() for token in tokens[cursor:] for c in token):
        raise ValueError('Source contains words missing from spelling')
    return tokens, positions


def report(spell_path, quran_path):
    spell_raw, quran_raw = spell_path.read_bytes(), quran_path.read_bytes()
    spelling = json.loads(spell_raw)['suras']
    source = {str(s['sura']): {a['n']: a['t'] for a in s['ayas']}
              for s in json.loads(quran_raw)['suras']}
    rows = []
    for sura, ayahs in spelling.items():
        if len(ayahs) != len(source[sura]):
            raise ValueError('Ayah count mismatch')
        for ayah, pairs in enumerate(ayahs, 1):
            text = source[sura][ayah]
            tokens, positions = align_words(text, pairs)
            for index, (word, guidance) in enumerate(pairs):
                signs = [s for s in edge_signs(word) if s['category'] in ('small_waw', 'small_yeh')]
                if not signs:
                    continue
                pos = positions[index]
                end = positions[index + 1] if index + 1 < len(pairs) else len(tokens)
                rows.append({'ref': f'{sura}:{ayah}:{index+1}', 'arabic': word,
                             'spelling': guidance, 'signs': signs, 'ayah_text': text,
                             'source_token_index': pos, 'ayah_final_word': index == len(pairs)-1,
                             'previous_word': pairs[index-1][0] if index else None,
                             'next_word_same_ayah': pairs[index+1][0] if index+1 < len(pairs) else None,
                             # Source context only: never imply continuation across a sura.
                             'next_ayah_context': (
                                 {'ref': f'{sura}:{ayah+1}', 'text': source[sura][ayah+1]}
                                 if index == len(pairs)-1 and ayah+1 in source[sura] else None),
                             'intervening_source_tokens': tokens[pos+1:end]})
    return {'scope': 'Review only: no rule, error, timing or religious clearance inferred. '
                     'Ayah-final does not prescribe a stop; internal stops also require review.',
            'reference_unit': 'sura:ayah:1-based spelling pair; source_token_index is zero-based whitespace token',
            'sources': [{'path': str(p), 'sha256': hashlib.sha256(b).hexdigest()}
                        for p, b in [(spell_path, spell_raw), (quran_path, quran_raw)]],
            'review_words': len(rows),
            'sign_counts': dict(Counter(s['category'] for r in rows for s in r['signs'])),
            'ayah_final_words': sum(r['ayah_final_word'] for r in rows), 'rows': rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--spelling', type=Path, default=ROOT/'www/data/spell_bn.json')
    parser.add_argument('--quran', type=Path, default=ROOT/'www/data/quran.json')
    args = parser.parse_args()
    print(json.dumps(report(args.spelling, args.quran), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
