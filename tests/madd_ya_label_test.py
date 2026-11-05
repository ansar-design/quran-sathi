"""Written-ya label repair only; not complete tajweed/content clearance."""
from fatha_sukun_test import upgrade_fatha_sukun
import copy
import json
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import spell_bn as S
DELTA = json.loads((ROOT/'tests/madd_ya_label_delta.json').read_text())


def upgrade_ya_labels(old):
    out = copy.deepcopy(old)
    for row in DELTA:
        s,a,w = row['ref'].split(':')
        pair = out[s][int(a)-1][int(w)-1]
        assert pair[0] == row['arabic']
        assert 'খাড়া জের' in pair[1]
        pair[1] = pair[1].replace('খাড়া জের', 'জের ও মাদ্দের ইয়া')
    return upgrade_fatha_sukun(out)


class MaddYaLabelTests(unittest.TestCase):
    def test_written_carriers(self):
        for word in ['فِى', 'فِي', 'فِىٓ', 'فِيٓ']:
            self.assertEqual(S.spell_word(word), 'ফা-জের ও মাদ্দের ইয়া-ফী')
        self.assertIn('তাশদীদ জের ও মাদ্দের ইয়া', S.spell_word('نِّي'))
        self.assertEqual(S.spell_word('وَجِا۟ىٓءَ'), 'ওয়াও-জবর-ওয়া, জীম-জের ও মাদ্দের ইয়া-জী, হামযা-জবর-আ')

    def test_near_misses(self):
        # Unresolved classifier cases must not acquire the new teaching label.
        for word in ['فِ', 'فِيَ', 'فِيّ', 'فِيْ', 'فِىٔ', 'فِي۟', 'هِنْ', 'هِۦ', 'هِٖ', 'بَيْتٍ', 'فٍي']:
            self.assertNotIn('জের ও মাদ্দের ইয়া', S.spell_word(word), word)
        self.assertEqual(S.spell_word('فِ'), 'ফা-জের-ফি')

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_exact_packaged_delta(self):
        old=json.loads((ROOT/'_old/madd-ya-label-20261105-0312/www/data/spell_bn.json.bak-20261105-studio').read_text())['suras']
        now=json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        self.assertEqual(len(DELTA),248)
        self.assertEqual(now,upgrade_ya_labels(old))
        for row in DELTA:
            self.assertEqual(row['after'],row['before'].replace('খাড়া জের','জের ও মাদ্দের ইয়া'))
            self.assertRegex(row['arabic'], 'ِ[ّ]?[يى]')
        source=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        for s in source:
            if s['sura']>=78:
                self.assertEqual(now[str(s['sura'])],[S.spell_ayah(a['t']) for a in s['ayas']])

if __name__=='__main__': unittest.main()
