"""Initial hamza-kasra/ya distinction, exact one-ayah delta, source preservation."""
import copy
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import translit_bn as T
import spell_bn as S

OLD = 'ইন্না ইলাইনা ইয়াবাহুম্'
NEW = 'ইন্না ইলাইনা ই-ইয়াবাহুম্'

def upgrade_iya(old, filename):
    out = copy.deepcopy(old)
    if filename == 'pron_bn.json':
        assert out['88'][24] == OLD
        out['88'][24] = NEW
    return out

class IyaTests(unittest.TestCase):
    def test_word_and_connected_reading(self):
        self.assertEqual(T.convert_ayah('إِيَابَهُمْ'), 'ই-ইয়াবাহুম্')
        self.assertEqual(T.convert_ayah('إِنَّ إِلَيْنَآ إِيَابَهُمْ'), NEW)
        self.assertEqual(T.convert_ayah('إِيَابَهُمْ قُلْ'), 'ই-ইয়াবাহুম্ ক্বুল্')
        ts=T.parse_word('إِيَابَهُمْ')
        self.assertEqual([(t.c,t.v) for t in ts[:2]], [('إ','i'),('ي','a')])
        self.assertTrue(S.spell_word('إِيَابَهُمْ').startswith('হামযা-জের-ই, ইয়া-'))

    def test_near_misses(self):
        for word in ['إِيَّاكَ','إِيمَانٌ','يَابِسٌ','إِبْرَاهِيمَ','أَيَامٌ','حِيَالٌ']:
            self.assertNotIn('ই-ইয়', T.convert_ayah(word), word)
        self.assertEqual(T.convert_ayah('فِى'), 'ফী')
        self.assertEqual(T.convert_ayah('وَجِا۟ىٓءَ'), 'ওয়াজী’')

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_exact_delta_and_freshness(self):
        old=json.loads((ROOT/'_old/iya-20261105-0259/www/data/pron_bn.json.bak-20261105-studio').read_text())['suras']
        now=json.loads((ROOT/'www/data/pron_bn.json').read_text())['suras']
        self.assertEqual(now,upgrade_iya(old,'pron_bn.json'))
        src=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        spelling=json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        for s in src:
            if s['sura'] < 78: continue
            self.assertEqual(now[str(s['sura'])],[T.convert_ayah(a['t']) for a in s['ayas']])
            self.assertEqual(spelling[str(s['sura'])],[S.spell_ayah(a['t']) for a in s['ayas']])

if __name__ == '__main__': unittest.main()
