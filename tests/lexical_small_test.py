"""Printed small-vowel regressions; teaching still requires expert review."""
import copy
import json
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import spell_bn as S
DELTA = json.loads((ROOT/'tests/lexical_small_delta.json').read_text())


def upgrade_lexical_small(old):
    out = copy.deepcopy(old)
    for row in DELTA:
        s,a,w = row['ref'].split(':')
        pair = out[s][int(a)-1][int(w)-1]
        assert pair == [row['arabic'],row['before']]
        pair[1] = row['after']
    return out


class LexicalSmallTests(unittest.TestCase):
    def test_actual_words(self):
        self.assertIn('হামযা-পেশ ও ছোট ওয়াও-ঊ', S.spell_word('ٱلْمَوْءُۥدَةُ'))
        self.assertTrue(S.spell_word('إِۦلَـٰفِهِمْ').startswith('হামযা-জের ও ছোট ইয়া-ঈ,'))

    def test_guarded_near_misses(self):
        for word in ['هُۦ', 'هِۥ', 'هُۥۦ', 'هُۥْ', 'بِۥتَ', 'بُۦتَ', 'بۥتَ', 'بۦتَ',
                     'بُۥْتَ', 'بِۦۡتَ', 'بٌۥتَ', 'بٍۦتَ', 'بُۥۦتَ',
                     'بِۦۥتَ', 'بُۥٰتَ', 'بِۦٰتَ', 'بُۥ۟تَ']:
            self.assertNotIn('ছোট', S.spell_word(word), word)
        # No next token does not mean stop; both modes are explicit.
        for word,sound,mark in [('هُۥ','হূ','পেশ ও ছোট ওয়াও'),('هِۦ','হী','জের ও ছোট ইয়া')]:
            expected = 'হা-' + mark + '-(মিলিয়ে পড়লে ' + sound + '; থামলে হ্)'
            self.assertEqual(S.spell_word(word),expected)
            self.assertEqual(S.spell_word(word,S.T.parse_word('أَنَّا')[0]),expected)

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_exact_delta_and_source_preservation(self):
        self.assertEqual([r['ref'] for r in DELTA], ['81:8:2','106:2:1'])
        old=json.loads((ROOT/'_old/lexical-small-20261105-0332/www/data/spell_bn.json.bak-20261105-studio').read_text())['suras']
        now=json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        self.assertEqual(now,upgrade_lexical_small(old))
        for s,ayas in old.items():
            for a,words in enumerate(ayas):
                self.assertEqual([p[0] for p in words],[p[0] for p in now[s][a]])
        source=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        for s in source:
            if s['sura']>=78:
                self.assertEqual(now[str(s['sura'])],[S.spell_ayah(a['t']) for a in s['ayas']])

if __name__=='__main__': unittest.main()
