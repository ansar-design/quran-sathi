"""Source-marked consonantal waw join; madd and pause exclusions."""
import json
import sys
import unittest
from jia_test import upgrade_jia
from iya_test import upgrade_iya
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import translit_bn as T
import spell_bn as S
from tanween_test import upgrade_old_spelling
from wasl_test import CHANGED_AYAHS

class WawMergeTests(unittest.TestCase):
    def test_connected_bare_and_explicit_sukun(self):
        for word in ['أَو', 'أَوْ']:
            self.assertEqual(T.convert_ayah(word+' وَّزَنُوهُمْ'), 'আওয়্-ওয়াযানূহুম্')
            self.assertIn('পরের শব্দের ওয়াও-এর সঙ্গে মিশিয়ে পড়ুন', S.spell_ayah(word+' وَّزَنُوهُمْ')[0][1])
            self.assertIn('ওয়াও-সাকিন-ওয়্', S.spell_word(word))

    def test_stops_and_source_shadda_required(self):
        self.assertEqual(T.convert_ayah('أَو ۜ وَّزَنُوهُمْ'), 'আওয়্ '+T.SAKT_NOTE+' ওয়াযানূহুম্')
        self.assertNotIn('মিশিয়ে', S.spell_ayah('أَو ۜ وَّزَنُوهُمْ')[0][1])
        self.assertEqual(T.convert_ayah('أَو وَزَنُوهُمْ'), 'আওয়্ ওয়াযানূহুম্')
        self.assertEqual(T.convert_ayah('أَوْ'), 'আও')
        self.assertEqual(T.convert_ayah('أَو ۖ وَّزَنُوهُمْ'), 'আওয়্-ওয়াযানূহুম্')

    def test_not_madd_or_vowelled_or_other_pair(self):
        for before, letter, after in [('لُ','و','وَّ'), ('لِ','و','وَّ'), ('أَ','وَ','وَّ'),
                                      ('أَ','و','وَ'), ('أَ','و','يَّ'), ('أَ','ي','يَّ')]:
            self.assertFalse(T.merges_waw(T.parse_word(letter)[0],T.parse_word(before)[0],T.parse_word(after)[0]))
        for marks in ['ٰ','ۥ','ۦ','ٓ','۟','ّ','ٌ','ٔ']:
            self.assertFalse(T.merges_waw(T.parse_word('و'+marks)[0],T.parse_word('أَ')[0],T.parse_word('وَّ')[0]))
        self.assertEqual(T.convert_ayah('قَالُوا وَّمَا'), 'ক্বালূ ওয়্-ওয়ামা')
        self.assertNotIn('মিশিয়ে', S.spell_ayah('قَالُوا وَّمَا')[0][1])

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_exact_delta_freshness_and_arabic(self):
        source=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        for filename, convert in [('pron_bn.json',T.convert_ayah),('spell_bn.json',S.spell_ayah)]:
            current=json.loads((ROOT/'www/data'/filename).read_text())['suras']
            old=json.loads((ROOT/'_old/waw-merge-20261104-2040/www/data'/(filename+'.bak-20261104-studio')).read_text())['suras']
            old=upgrade_iya(upgrade_jia(old, filename), filename)
            if filename == "spell_bn.json":
                old = {k: [upgrade_old_spelling(rows) for rows in ayahs] for k, ayahs in old.items()}
            delta=[]
            for s in source:
                if s['sura']<78: continue
                key=str(s['sura'])
                for i,a in enumerate(s['ayas']):
                    self.assertEqual(current[key][i],convert(a['t']))
                    if current[key][i]!=old[key][i]: delta.append(f'{key}:{i+1}')
                    if filename=='spell_bn.json':
                        self.assertEqual([r[0] for r in current[key][i]],[r[0] for r in old[key][i]])
            self.assertEqual(set(delta),{'83:3'} | (set(CHANGED_AYAHS) if filename=='pron_bn.json' else set()))

if __name__=='__main__': unittest.main()
