"""Bounded label correction; no claim of complete madd teaching correctness."""
from madd_ya_label_test import upgrade_ya_labels
import copy
import json
from pathlib import Path
import re
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import spell_bn as S
DELTA = json.loads((ROOT/'tests/madd_waw_label_delta.json').read_text())


def upgrade_waw_labels(old):
    out = copy.deepcopy(old)
    for row in DELTA:
        s,a,w = row['ref'].split(':')
        pair = out[s][int(a)-1][int(w)-1]
        assert pair[0] == row['arabic']
        assert 'উল্টা পেশ' in pair[1]
        pair[1] = pair[1].replace('উল্টা পেশ', 'পেশ ও মাদ্দের ওয়াও')
    return upgrade_ya_labels(out)


class MaddWawLabelTests(unittest.TestCase):
    def test_written_waw(self):
        self.assertEqual(S.spell_word('نُورٌ'), 'নূন-পেশ ও মাদ্দের ওয়াও-নূ, রা-দুই পেশ-রুন্')
        self.assertEqual(S.spell_word('قُولُ'), 'ক্বাফ-পেশ ও মাদ্দের ওয়াও-ক্বূ, লাম-পেশ-লু')
        self.assertIn('তাশদীদ পেশ ও মাদ্দের ওয়াও', S.spell_word('نُّو'))

    def test_other_forms_unchanged(self):
        for ar,bn in [('دُ','দাল-পেশ-দু'),('فِى','ফা-জের ও মাদ্দের ইয়া-ফী'),
                      ('قَالَ','ক্বাফ-জবর ও মাদ্দের আলিফ-ক্বা, লাম-জবর-লা')]:
            self.assertEqual(S.spell_word(ar),bn)
        for ar in ['خَوْفٍ','أُو۟لَـٰٓئِكَ','هُۥ','وُ','نُوَ','نُوّ','نٌو']:
            self.assertNotIn('পেশ ও মাদ্দের ওয়াও',S.spell_word(ar),ar)

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_exact_packaged_delta(self):
        old=json.loads((ROOT/'_old/madd-waw-label-20261105-0309/www/data/spell_bn.json.bak-20261105-studio').read_text())['suras']
        now=json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        self.assertEqual(len(DELTA),198)
        self.assertEqual(now,upgrade_waw_labels(old))
        for row in DELTA:
            self.assertEqual(row['after'],row['before'].replace('উল্টা পেশ','পেশ ও মাদ্দের ওয়াও'))
            # Independent literal source check: ordinary damma, then written waw.
            self.assertRegex(row['arabic'], 'ُ[ّ]?و')
        source=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        for s in source:
            if s['sura']>=78:
                self.assertEqual(now[str(s['sura'])],[S.spell_ayah(a['t']) for a in s['ayas']])

if __name__=='__main__': unittest.main()
