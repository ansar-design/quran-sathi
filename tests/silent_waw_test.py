"""Silent waw must not promote short u; religious/pedagogical review remains due."""
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import translit_bn as T
import spell_bn as S

class SilentWawTests(unittest.TestCase):
    def test_round_zero_is_silent_not_sukun(self):
        t = T.parse_word('أُو۟لَـٰٓئِكَ')[1]
        self.assertTrue(t.silent)
        self.assertFalse(t.sukun)
        self.assertFalse(T.parse_word('أَوْ')[1].silent)

    def test_short_u_in_pronunciation_and_spelling(self):
        for word in ['أُو۟لَـٰٓئِكَ', 'أُو۟لَٰئِكَ']:
            self.assertEqual(T.convert_ayah(word), 'উলা’ইক্')
            self.assertTrue(S.spell_word(word).startswith('হামযা-পেশ-উ,'))
            self.assertNotIn('ওয়াও', S.spell_word(word))
        self.assertTrue(T.convert_ayah('أُو۟لَـٰٓئِكَ هُمُ').startswith('উলা’ইকা '))   # 5 Nov: hamza after long a shown with ’ (expert E22)

    def test_real_long_u_and_diphthong_unchanged(self):
        self.assertEqual(T.convert_ayah('يَقُولُ'), 'ইয়াক্বূল্')
        self.assertIn('ক্বূ', S.spell_word('يَقُولُ'))
        self.assertEqual(T.convert_ayah('قَالُوا۟'), 'ক্বালূ')
        self.assertEqual(T.convert_ayah('أَوْ'), 'আও')

    def test_corpus_short_u_and_freshness(self):
        source = json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        pron = json.loads((ROOT/'www/data/pron_bn.json').read_text())['suras']
        spell = json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        affected = []
        for s in source:
            if s['sura'] < 78: continue
            for i, a in enumerate(s['ayas']):
                self.assertEqual(pron[str(s['sura'])][i], T.convert_ayah(a['t']))
                self.assertEqual(spell[str(s['sura'])][i], S.spell_ayah(a['t']))
                for w in a['t'].split():
                    ts = T.parse_word(w)
                    if any(t.v == 'u' and n.c == 'و' and n.silent for t,n in zip(ts,ts[1:])):
                        affected.append((s['sura'],i+1))
                        self.assertTrue(T.convert_ayah(w).startswith('উ'))
                        self.assertTrue(S.spell_word(w).startswith('হামযা-পেশ-উ,'))
        self.assertEqual(affected, [(80,42),(83,4),(90,18),(98,6),(98,7)])

if __name__ == '__main__': unittest.main()
