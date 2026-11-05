"""Exact reviewed carrier-only deltas; not clearance of spelling pedagogy."""
from madd_waw_label_test import upgrade_waw_labels
import copy
import json
from pathlib import Path
import re
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import spell_bn as S
from audit_spell_madd import audit
DELTAS = json.loads((ROOT/'tests/madd_ya_delta.json').read_text())


def upgrade_madd(old):
    out=copy.deepcopy(old)
    for row in DELTAS:
        s,a,w=row['ref'].split(':'); pair=out[s][int(a)-1][int(w)-1]
        assert pair[0]==row['arabic']
        # Apply only the exact entry removal, retaining earlier tanween/merge
        # repairs in historical snapshots. No generator used as the oracle.
        before=row['before'].split(', '); after=row['after'].split(', ')
        removed=[i for i in range(len(before)) if before[:i]+before[i+1:]==after]
        assert len(removed)==1
        i=removed[0]; parts=pair[1].split(', ')
        assert parts[i]=='ইয়া-সাকিন-য়্'
        pair[1]=', '.join(parts[:i]+parts[i+1:])
    return out


class MaddYaTests(unittest.TestCase):
    def test_carriers(self):
        for word in ['فِى','فِىٓ','ٱلَّذِى']:
            self.assertNotIn('ইয়া-সাকিন-য়্',S.spell_word(word))
        self.assertEqual(S.spell_word('فِى'),S.spell_word('فِي'))
        self.assertEqual(S.spell_word('وَجِا۟ىٓءَ'), 'ওয়াও-জবর-ওয়া, জীম-জের ও মাদ্দের ইয়া-জী, হামযা-জবর-আ')

    def test_consonants_and_diphthongs(self):
        for word in ['شَىْءٍ','حَىٌّ','إِيَابَهُمْ','فِىَ','فِىْ','فِىٔ']:
            self.assertIn('ইয়া-',S.spell_word(word),word)
        text=S.spell_word('يَـٰلَيْتَنِى')
        self.assertEqual(text.count('ইয়া-সাকিন-য়্'),1) # real lay diphthong retained
        self.assertTrue(text.endswith('নী'))

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_exact_delta(self):
        old=json.loads((ROOT/'_old/madd-ya-20261105-0306/www/data/spell_bn.json.bak-20261105-studio').read_text())['suras']
        now=json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        self.assertEqual(len(DELTAS),80)
        self.assertEqual(now,upgrade_waw_labels(upgrade_madd(old)))
        for row in DELTAS:
            # Independent source-form condition, includes multi-ya words.
            self.assertRegex(row['arabic'],r'ِى[ٓ]?(?=[ء-يٱ]|$)')
            self.assertEqual(row['before'].count('ইয়া-সাকিন-য়্'),row['after'].count('ইয়া-সাকিন-য়্')+1)
        self.assertNotIn('madd_ya_extra_consonant',audit(ROOT/'www/data/spell_bn.json')['counts'])

if __name__=='__main__': unittest.main()
