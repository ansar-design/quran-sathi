"""Encoding regressions; exact Bangla teaching remains Huzur VERIFY.
Source: research note quran-hamza-2026-11-04.md.
"""
import json
import sys
import unicodedata
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import translit_bn as T
from spell_bn import spell_word


class HamzaTests(unittest.TestCase):
    def test_separate_consonant_and_vowels(self):
        tokens = T.parse_word('بِـَٔايَـٰتِنَا')
        self.assertEqual([t.c for t in tokens], list('بءايتنا'))
        self.assertEqual([t.v for t in tokens[:2]], ['i', 'a'])
        self.assertFalse(tokens[0].hamza)
        self.assertTrue(tokens[3].sup)
        tokens = T.parse_word('يَسْـَٔلُونَكَ')
        self.assertEqual(tokens[1].c, 'س')
        self.assertTrue(tokens[1].sukun)
        self.assertIsNone(tokens[1].v)
        self.assertEqual((tokens[2].c, tokens[2].v), ('ء', 'a'))

    def test_golden_words(self):
        for ar, expected in [('مَـَٔابًۭا', 'মা’আবা'),
                             ('يَسْـَٔلُونَكَ', 'ইয়াস্-আলূনাক্'),
                             ('ٱلْأَفْـِٔدَةِ', 'আল্-আফ্-ইদাহ্')]:
            with self.subTest(ar=ar):
                self.assertEqual(T.convert_ayah(ar), expected)

    def test_spelling_restores_hamza(self):
        self.assertTrue(spell_word('بِـَٔايَـٰتِنَا').startswith('বা-জের-বি, হামযা-'))
        self.assertIn('সীন-সাকিন-স্, হামযা-জবর-আ', spell_word('يَسْـَٔلُونَكَ'))

    def test_mark_order_and_initial_hamza(self):
        for ar in ['بِـَٔ', 'بِـَٔ', 'ـَٔ', 'ـَٔ']:
            with self.subTest(ar=ar):
                normalized = T.hamza_on_tatweel(ar)
                self.assertEqual(normalized, 'بِءَ' if ar.startswith('ب') else 'ءَ')
                self.assertEqual(T.hamza_on_tatweel(unicodedata.normalize('NFD', ar)), normalized)

    def test_ordinary_tatweel_unchanged(self):
        for word in ['مِهَـٰدًا', 'إِنَّآ', 'ٱلْإِنسَـٰنَ', 'ـ', 'بِـ']:
            self.assertEqual(T.hamza_on_tatweel(word), word)
        self.assertEqual(T.convert_ayah('مِهَـٰدًا'), 'মিহাদা')
        self.assertEqual(T.convert_ayah('بِـسْمِ'), T.convert_ayah('بِسْمِ'))

    def test_all_corpus_hamza_carriers(self):
        suras = json.loads((ROOT / 'www/data/quran.json').read_text())['suras']
        count = 0
        for sura in suras:
            if sura['sura'] < 78:
                continue
            for i, ayah in enumerate(sura['ayas'], 1):
                for word in ayah['t'].split():
                    if 'ـٔ' not in word:
                        continue
                    count += 1
                    with self.subTest(sura=sura['sura'], ayah=i, word=word):
                        alternate = word.replace('ـٔ', 'ء')
                        self.assertEqual(T.convert_ayah(word), T.convert_ayah(alternate))
                        self.assertEqual(spell_word(word), spell_word(alternate))
                        self.assertIn('হামযা', spell_word(word))
        self.assertEqual(count, 15)


if __name__ == '__main__':
    unittest.main()
