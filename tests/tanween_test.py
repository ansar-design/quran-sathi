"""Basic tanween spelling is distinct from contextual recitation."""
import json
import re
import sys
import unittest
from jia_test import upgrade_jia
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import spell_bn as S
import translit_bn as T


def upgrade_old_spelling(rows):
    # Apply ONLY the later n-suffix repair to historical fixtures so earlier
    # consonant/assimilation delta assertions remain exact.
    return [[ar, re.sub(r'(দুই (?:জবর|জের|পেশ)-[^,\s]+)', r'\1ন্', bn)] for ar, bn in rows]


class TanweenTests(unittest.TestCase):
    def test_basic_three_vowels(self):
        for ar, bn in [('دًا','দাল-দুই জবর-দান্'),('دٍ','দাল-দুই জের-দিন্'),('دٌ','দাল-দুই পেশ-দুন্'),('ءٍ','হামযা-দুই জের-ইন্'),('ةً','তা-দুই জবর-তান্')]:
            self.assertEqual(S.spell_word(ar), bn)
        self.assertEqual(S.spell_word('دَ'), 'দাল-জবর-দা')
        self.assertEqual(S.spell_word('دِ'), 'দাল-জের-দি')
        self.assertEqual(S.spell_word('دُ'), 'দাল-পেশ-দু')

    def test_stop_and_join_are_separate(self):
        self.assertIn('দুন্', S.spell_word('أَحَدٌ'))
        self.assertEqual(T.convert_ayah('أَحَدٌ'), 'আহাদ্')
        self.assertIn('বান্', S.spell_word('تَوَّابًا'))
        self.assertTrue(T.convert_ayah('تَوَّابًا').endswith('বা'))
        for following in ['لَّا', 'وَّمَا', 'بَصِيرٌ']:
            self.assertIn('দান্', S.spell_ayah('أَحَدًا '+following)[0][1])

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_corpus_only_adds_n_to_tanween(self):
        old=json.loads((ROOT/'_old/tanween-20261104-2048/www/data/spell_bn.json.bak-20261104-studio').read_text())['suras']
        old=upgrade_jia(old, 'spell_bn.json')
        now=json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        src=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        changed=0
        for s in src:
            if s['sura']<78: continue
            key=str(s['sura'])
            for i,a in enumerate(s['ayas']):
                self.assertEqual(now[key][i],S.spell_ayah(a['t']))
                self.assertEqual(now[key][i],upgrade_old_spelling(old[key][i]))
                changed += now[key][i] != old[key][i]
        self.assertGreater(changed,0)
        print('tanween changed ayahs:',changed)

if __name__=='__main__': unittest.main()
