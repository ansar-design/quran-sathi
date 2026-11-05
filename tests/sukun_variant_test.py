"""Quranic jazm must retain consonantal behavior without rewriting Arabic."""
import contextlib
import io
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import translit_bn as T
import spell_bn as S


class SukunVariantTests(unittest.TestCase):
    def test_mark_attaches_to_previous_letter(self):
        errors = io.StringIO()
        with contextlib.redirect_stderr(errors):
            tokens = T.parse_word('بَيۡتٍ')
        self.assertEqual(errors.getvalue(), '')
        self.assertEqual([t.c for t in tokens], ['ب', 'ي', 'ت'])
        self.assertEqual([t.sukun for t in tokens], [False, True, False])
        self.assertEqual(tokens[2].tan, 'i')

    def test_equivalent_reading_and_spelling(self):
        for text in ['بَيْتٍ', 'خَوْفٍ', 'شَىْءٍ', 'قُلْ هُوَ', 'مِنْ رَبِّهِمْ', 'فِىْ', 'قُوْ']:
            alternate = text.replace('ْ', 'ۡ')
            with self.subTest(text=text):
                self.assertEqual(T.convert_ayah(alternate), T.convert_ayah(text))
                original = S.spell_ayah(text)
                actual = S.spell_ayah(alternate)
                self.assertEqual([p[1] for p in actual], [p[1] for p in original])
                self.assertEqual([p[0] for p in actual], alternate.split())
        self.assertNotIn('খাড়া জবর', S.spell_word('شَىۡءٍ'))

    def test_distinct_zero_marks_stay_silent_not_sukun(self):
        for mark in ['۟', '۠']:
            token = T.parse_word('و' + mark)[0]
            self.assertTrue(token.silent)
            self.assertFalse(token.sukun)
        self.assertFalse(T.parse_word('و')[0].sukun)

    def test_packaged_content_unchanged_and_variant_equivalent(self):
        source = json.loads((ROOT / 'www/data/quran.json').read_text())['suras']
        spelling = json.loads((ROOT / 'www/data/spell_bn.json').read_text())['suras']
        pronunciation = json.loads((ROOT / 'www/data/pron_bn.json').read_text())['suras']
        checked = 0
        for sura in source:
            if sura['sura'] < 78:
                continue
            sid = str(sura['sura'])
            for i, ayah in enumerate(sura['ayas']):
                text = ayah['t']
                alternate = text.replace('ْ', 'ۡ')
                self.assertEqual(S.spell_ayah(text), spelling[sid][i], (sid, i + 1))
                self.assertEqual(T.convert_ayah(text), pronunciation[sid][i], (sid, i + 1))
                self.assertEqual(T.convert_ayah(alternate), pronunciation[sid][i], (sid, i + 1))
                self.assertEqual([p[1] for p in S.spell_ayah(alternate)],
                                 [p[1] for p in spelling[sid][i]], (sid, i + 1))
                checked += 1
        self.assertEqual(checked, 564)


if __name__ == '__main__':
    unittest.main()
