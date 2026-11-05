"""Bounded Uthmani carrier regressions; not religious/teaching certification."""
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import translit_bn as T
import spell_bn as S

class WawAlifTests(unittest.TestCase):
    def test_carrier_words(self):
        for word, expected, segment in [
            ('ٱلْحَيَوٰةَ', 'আল্হায়াহ্', 'ইয়া-খাড়া জবর-য়া'),
            ('ٱلصَّلَوٰةَ', 'আছ্ছালাহ্', 'লাম-খাড়া জবর-লা'),
            ('ٱلزَّكَوٰةَ', 'আয্যাকাহ্', 'কাফ-খাড়া জবর-কা'),
        ]:
            self.assertEqual(T.convert_ayah(word), expected)
            self.assertNotIn('ওয়াও', S.spell_word(word))
            self.assertIn(segment, S.spell_word(word))
            self.assertIn(expected[:-2] + 'তা ', T.convert_ayah(word + ' هِيَ'))

    def test_pronounced_waw_not_a_carrier(self):
        self.assertEqual(T.convert_ayah('سَمَٰوَٰتٍ'), 'সামাওয়াত্')
        self.assertIn('ওয়াও-খাড়া জবর-ওয়া', S.spell_word('سَمَٰوَٰتٍ'))
        self.assertEqual(T.convert_ayah('يَقُولُ'), 'ইয়াক্বূল্')
        self.assertEqual(T.convert_ayah('أَوْ'), 'আও')
        for word in ['وَٰ', 'وّٰ', 'وْٰ', 'وٰ۟', 'ؤٰ', 'وٌٰ']:
            self.assertFalse(T.is_waw_alif(T.parse_word(word)[0]), word)

    def test_corpus_freshness_and_carrier_inventory(self):
        source = json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        pron = json.loads((ROOT/'www/data/pron_bn.json').read_text())['suras']
        spell = json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        hits = []
        for s in source:
            if s['sura'] < 78: continue
            for i,a in enumerate(s['ayas']):
                self.assertEqual(pron[str(s['sura'])][i], T.convert_ayah(a['t']))
                self.assertEqual(spell[str(s['sura'])][i], S.spell_ayah(a['t']))
                for w in a['t'].split():
                    ts = T.parse_word(w)
                    if any(p.v == 'a' and T.is_waw_alif(t) for p,t in zip(ts, ts[1:])):
                        hits.append((s['sura'], i+1))
                        self.assertNotIn('ওয়াও', S.spell_word(w))
        self.assertEqual(hits, [(79,38),(87,16),(98,5),(98,5)])

if __name__ == '__main__': unittest.main()
