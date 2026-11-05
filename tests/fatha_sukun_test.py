"""Explicit sukun blocks inferred long-a; exact bounded corpus correction."""
from lexical_small_test import upgrade_lexical_small
import copy
import json
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import spell_bn as S
DELTA = json.loads((ROOT/'tests/fatha_sukun_delta.json').read_text())


def upgrade_fatha_sukun(old):
    out = copy.deepcopy(old)
    for row in DELTA:
        s, a, w = row['ref'].split(':')
        pair = out[s][int(a)-1][int(w)-1]
        assert pair[0] == row['arabic']
        assert pair[1].startswith('শীন-খাড়া জবর-শা, ')
        pair[1] = pair[1].replace('শীন-খাড়া জবর-', 'শীন-জবর-', 1)
    return upgrade_lexical_small(out)


class FathaSukunTests(unittest.TestCase):
    def test_consonantal_ya(self):
        expected = 'শীন-জবর-শা, ইয়া-সাকিন-য়্, হামযা-দুই জের-ইন্'
        self.assertEqual(S.spell_word('شَىْءٍ'), expected)
        self.assertEqual(S.spell_word('شَيْءٍ'), expected)
        self.assertEqual(S.spell_word('شَىْءٍۢ'), expected)
        self.assertNotIn('খাড়া জবর', S.spell_word('فَىْ'))

    def test_long_vowels_and_other_marks(self):
        self.assertIn('জবর ও মাদ্দের আলিফ', S.spell_word('قَالَ'))   # 5 Nov expert E7
        self.assertIn('আলিফ মাকসূরা', S.spell_word('فَى'))   # 5 Nov expert E9
        self.assertIn('খাড়া জবর', S.spell_word('فَـٰ'))
        for word in ['فَىَ', 'فَىّ', 'فَىٍ', 'فَيْ']:
            self.assertNotIn('খাড়া জবর', S.spell_word(word), word)

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_bounded_packaged_delta(self):
        self.assertEqual([r['ref'] for r in DELTA], ['78:29:2','80:18:3','85:9:9'])
        for row in DELTA:
            self.assertIn('َىْ', row['arabic'])
            self.assertEqual(row['after'], row['before'].replace('শীন-খাড়া জবর-', 'শীন-জবর-'))
        old=json.loads((ROOT/'_old/fatha-sukun-20261105-0319/www/data/spell_bn.json.bak-20261105-studio').read_text())['suras']
        now=json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        self.assertEqual(now, upgrade_fatha_sukun(old))
        source=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        for s in source:
            if s['sura'] >= 78:
                self.assertEqual(now[str(s['sura'])], [S.spell_ayah(a['t']) for a in s['ayas']])

if __name__ == '__main__': unittest.main()
