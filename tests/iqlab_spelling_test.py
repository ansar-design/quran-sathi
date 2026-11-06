"""Reported expert examples and boundary regressions; not religious sign-off."""
import json, sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import spell_bn as S
Q={s['sura']:s['ayas'] for s in json.loads((ROOT/'www/data/quran.json').read_text())['suras']}
class Spelling(unittest.TestCase):
    def test_reported_iqlab(self):
        for sura,aya in [(81,9),(80,27),(86,7),(91,12),(91,14),(92,8),(98,4),(104,4)]:
            rows=S.spell_ayah(Q[sura][aya-1]['t'])
            self.assertTrue(any('নূন-ছোট মীম (মিলিয়ে পড়লে নূনের বদলে মীমের ধ্বনি গুন্নাহসহ পড়ুন)' in text for _,text in rows),(sura,aya))
    def test_reported_assimilation(self):
        for sura,aya,target,nasal in [(80,19,'নূন','গুন্নাহসহ'),(83,15,'রা','গুন্নাহ ছাড়া'),(83,25,'রা','গুন্নাহ ছাড়া'),(84,14,'লাম','গুন্নাহ ছাড়া'),(96,7,'রা','গুন্নাহ ছাড়া')]:
            text=str(S.spell_ayah(Q[sura][aya-1]['t']))
            self.assertIn('নূন-চিহ্ন নেই (মিলিয়ে পড়লে পরের শব্দের '+target+'-এর সঙ্গে মিশিয়ে পড়ুন; '+nasal+')',text)
        for sura,aya in [(79,14),(84,24)]:
            self.assertIn('মীম-চিহ্ন নেই (মিলিয়ে পড়লে পরের বা-এর আগে মীমের ধ্বনি আড়াল করে গুন্নাহসহ পড়ুন)',str(S.spell_ayah(Q[sura][aya-1]['t'])))
    def test_stop_and_nonmatching_context(self):
        for text in ['مِن','مِن ۜ بَعْدِ','مِن ۜ رَّبِّ','مِنَ بَعْدِ','هُمُ بِهِ','نرَّ','بٍۢ قُتِلَ','يَوْمَئِذٍۢ وَاجِفَةٌ','أَحَدٌۢ']:
            self.assertNotIn('মিলিয়ে পড়লে',str(S.spell_ayah(text)),text)
        self.assertIn('তানবীনের নূনের বদলে মীমের ধ্বনি',str(S.spell_ayah('كِرَامٍۭ بَرَرَةٍۢ')))
        self.assertNotIn('মীমের ধ্বনি',str(S.spell_ayah('كِرَامٍۭ ۜ بَرَرَةٍۢ')))
        for mark in ['ۢ','ۭ']:
            self.assertEqual(S.T.parse_word('ن'+mark)[0].smallm,mark)
    def test_corpus_fresh_and_source_unchanged(self):
        saved=json.loads((ROOT/'www/data/spell_bn.json').read_text())['suras']
        for sura,ayas in Q.items():
            if sura<78:continue
            for i,aya in enumerate(ayas):
                self.assertEqual(saved[str(sura)][i],S.spell_ayah(aya['t']))
                self.assertEqual([x[0] for x in saved[str(sura)][i]],[w for segment in S.T.sakt_segments(aya['t']) for w in segment.split() if S.T.parse_word(w)])
if __name__=='__main__':unittest.main()
