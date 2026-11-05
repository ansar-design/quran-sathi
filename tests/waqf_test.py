"""Verse-boundary regressions, based on expert report 2026-11-04.
Rule references and limitations: research note quran-waqf-2026-11-04.md.
Bangla approximations remain Huzur VERIFY; these are not a full tajweed audit.
"""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from translit_bn import convert_ayah
from spell_bn import spell_ayah


class WaqfTests(unittest.TestCase):
    def test_fathatan_carriers(self):
        for ar, bn in [('مِهَـٰدًا', 'মিহাদা'), ('طُوًى', 'ত্বুওয়া'),
                       ('مَاءً', 'মা’আ'), ('يُسْرًا', 'ইয়ুস্রা')]:
            with self.subTest(ar=ar):
                self.assertEqual(convert_ayah(ar), bn)

    def test_ta_marbuta_all_endings(self):
        for ending in 'ًٌٍَُِ':
            with self.subTest(ending=ending):
                self.assertEqual(convert_ayah('نَخِرَة' + ending), 'নাখিরাহ্')

    def test_both_ha_silah_endings(self):
        self.assertEqual(convert_ayah('بِيَمِينِهِۦ'), 'বিয়ামীনিহ্')
        self.assertEqual(convert_ayah('ذَكَرَهُۥ'), 'যাকারাহ্')
        # Connecting silah remains audible inside the verse.
        self.assertIn('বিহী', convert_ayah('بِهِۦ حَبًّا'))
        self.assertIn('রাব্বুহূ', convert_ayah('رَبُّهُۥ قَالَ'))

    def test_sajdah_and_pause_tokens(self):
        self.assertEqual(convert_ayah('لَا يَسْجُدُونَ ۩'), 'লা ইয়াস্জুদূন্')
        self.assertEqual(convert_ayah('۞ لَا يَسْجُدُونَ ۩ ۖ'), 'লা ইয়াস্জুদূন্')
        self.assertEqual(convert_ayah('صَفًّا ۖ لَّا يَتَكَلَّمُونَ'),
                         convert_ayah('صَفًّا لَّا يَتَكَلَّمُونَ'))
        self.assertEqual(convert_ayah('۩ ۖ'), '')

    def test_initial_assimilation_not_carried_across_ayah(self):
        self.assertTrue(convert_ayah('لِّنُخْرِجَ بِهِۦ حَبًّا').startswith('লিনুখ্রিজা'))
        self.assertTrue(convert_ayah('رَّبِّ ٱلسَّمَاوَاتِ').startswith('রাব্বি'))
        # The internal nun shadda is lexical and must remain.
        self.assertEqual(convert_ayah('إِنَّا'), 'ইন্না')

    def test_stopping_preserves_shadda(self):
        self.assertEqual(convert_ayah('وَتَبَّ'), 'ওয়াতাব্ব্')
        self.assertEqual(convert_ayah('وَتَبْ'), 'ওয়াতাব্')

    def test_connected_tanween_is_not_stopped(self):
        self.assertTrue(convert_ayah('مِهَـٰدًا كَبِيرًا').startswith('মিহাদাঁ '))
        self.assertIn('নাখিরাতাঁ', convert_ayah('نَخِرَةً كَبِيرَةً'))

    def test_generated_corpus_matches_generators(self):
        data = ROOT / 'www/data'
        quran = json.loads((data / 'quran.json').read_text())['suras']
        pron = json.loads((data / 'pron_bn.json').read_text())['suras']
        spell = json.loads((data / 'spell_bn.json').read_text())['suras']
        count = 0
        for sura in quran:
            if sura['sura'] < 78:
                continue
            key = str(sura['sura'])
            for i, ayah in enumerate(sura['ayas']):
                with self.subTest(sura=key, ayah=i+1):
                    self.assertEqual(pron[key][i], convert_ayah(ayah['t']))
                    self.assertEqual(spell[key][i], spell_ayah(ayah['t']))
                count += 1
        self.assertEqual(count, 564)


if __name__ == '__main__':
    unittest.main()
