"""Sakt boundary regressions; not expert clearance of Quran teaching."""
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import translit_bn as T
import spell_bn as S

class SaktTests(unittest.TestCase):
    def test_explicit_pause_and_no_assimilation(self):
        self.assertEqual(T.convert_ayah('بَلْ ۜ رَانَ'), 'বাল্ ' + T.SAKT_NOTE + ' রান্')
        self.assertEqual(T.convert_ayah('مَنْ ۜ رَاقٍ'), 'মান্ ' + T.SAKT_NOTE + ' রাক্ব্')
        self.assertNotEqual(T.convert_ayah('مَنْ رَاقٍ'), T.convert_ayah('مَنْ ۜ رَاقٍ'))
        rows = S.spell_ayah('بَلْ ۜ رَانَ')
        self.assertEqual([r[0] for r in rows], ['بَلْ','رَانَ'])
        self.assertTrue(rows[0][1].endswith(T.SAKT_NOTE))
        self.assertNotIn(T.SAKT_NOTE, rows[1][1])

    def test_other_marks_and_ayah_end_unchanged(self):
        for text in ['بَصْۜطَةً', 'مَالِيَهْ ۜ', 'بَلْ ۖ رَانَ', 'ۜ', '']:
            self.assertNotIn(T.SAKT_NOTE,T.convert_ayah(text))
            self.assertNotIn(T.SAKT_NOTE,str(S.spell_ayah(text)))
        self.assertEqual(T.sakt_segments('وَيَبْصُۜطُ'), ['وَيَبْصُۜطُ'])

    # needs the private 4 Nov snapshot in _old/ (not in the public repo); corpus freshness is also covered by overhaul_20261105_test.py
    @unittest.skipUnless((ROOT/'_old/sakt-20261104-2030').exists(), 'private before-snapshot not present')
    def test_pause_inventory_and_freshness(self):
        source=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        backup=ROOT/'_old/sakt-20261104-2030/www/data'
        changes={}
        for filename,convert in [('pron_bn.json',T.convert_ayah),('spell_bn.json',S.spell_ayah)]:
            current=json.loads((ROOT/'www/data'/filename).read_text())['suras']
            before=json.loads((backup/(filename+'.bak-20261104-studio')).read_text())['suras']
            changes[filename]=[]
            for s in source:
                if s['sura']<78: continue
                key=str(s['sura'])
                for i,a in enumerate(s['ayas']):
                    self.assertEqual(current[key][i],convert(a['t']))
                    if T.SAKT_NOTE in str(current[key][i]): changes[filename].append((s['sura'],i+1))
                    if filename=='spell_bn.json':
                        self.assertEqual([r[0] for r in current[key][i]], [r[0] for r in before[key][i]])
            self.assertEqual(changes[filename],[(83,14)])

if __name__=='__main__': unittest.main()
