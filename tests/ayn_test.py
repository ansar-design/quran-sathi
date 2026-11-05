"""Bounded ayn doubling regressions; Bangla pedagogy remains Huzur VERIFY."""
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import translit_bn as T
import spell_bn as S

class AynTests(unittest.TestCase):
    def test_carry_vowels_and_stop(self):
        for vowel, expected in [(None, '‘‘'), ('a', '‘‘আ'), ('i', '‘‘ই'),
                                ('u', '‘‘উ'), ('aa', '‘‘আ'), ('ii', '‘‘ঈ'), ('uu', '‘‘ঊ')]:
            t = T.Tok('ع'); t.shadda = True
            self.assertEqual(T.carry('ع', vowel, t, False), expected)
            t.shadda = False
            self.assertEqual(T.carry('ع', vowel, t, False), expected[1:])

    def test_golden_words(self):
        for ar, expected in [('سُعِّرَتْ', 'সু‘‘ইরাত্'), ('فَعَّالٌ', 'ফা‘‘আল্'),
                             ('وَنَعَّمَهُۥ', 'ওয়ানা‘‘আমাহ্'), ('يَدُعُّ', 'ইয়াদু‘‘')]:
            self.assertEqual(T.convert_ayah(ar), expected)
        self.assertTrue(T.convert_ayah('يَدُعُّ ٱلْيَتِيمَ').startswith('ইয়াদু‘‘উ'))

    def test_spelling_retains_doubling(self):
        for ar, ending in [('سُعِّرَتْ', 'জের-‘‘ই'), ('فَعَّالٌ', 'জবর ও মাদ্দের আলিফ-‘‘আ'),
                           ('وَنَعَّمَهُۥ', 'জবর-‘‘আ'), ('يَدُعُّ', 'পেশ-‘‘উ')]:
            self.assertIn('আইন-তাশদীদ '+ending, S.spell_word(ar))

    def test_corpus_and_generated_freshness(self):
        d = json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        pron = json.loads((ROOT/'www/data/pron_bn.json').read_text())['suras']
        spell = json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        affected = []
        for s in d:
            if s['sura'] < 78: continue
            for i, a in enumerate(s['ayas']):
                self.assertEqual(pron[str(s['sura'])][i], T.convert_ayah(a['t']))
                self.assertEqual(spell[str(s['sura'])][i], S.spell_ayah(a['t']))
                if any(t.c == 'ع' and t.shadda for w in a['t'].split() for t in T.parse_word(w)):
                    affected.append((s['sura'], i+1))
                    self.assertIn('‘‘', pron[str(s['sura'])][i])
        self.assertEqual(affected, [(81,12), (85,16), (89,15), (107,2)])

if __name__ == '__main__': unittest.main()
