"""Expert E3/E4 regressions using shipped Quran examples, not religious certification."""
import json, sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import spell_bn as S
Q={s['sura']:s['ayas'] for s in json.loads((ROOT/'www/data/quran.json').read_text())['suras']}
class Teaching(unittest.TestCase):
    def test_connected_and_stopped_examples(self):
        for sura,ayah,sound in [(78,15,'হী'),(90,7,'হূ'),(80,24,'হী'),(99,8,'হূ')]:
            spelling=' '.join(p[1] for p in S.spell_ayah(Q[sura][ayah-1]['t']))
            self.assertIn('মিলিয়ে পড়লে '+sound+'; থামলে হ্',spelling)
        self.assertIn('মাদ্দ চিহ্ন: টানের মাপ',str(S.spell_ayah(Q[90][6]['t'])))
        self.assertIn('মাদ্দ চিহ্ন: টানের মাপ',str(S.spell_ayah(Q[80][23]['t'])))
        self.assertNotIn('ছোট',S.spell_word('ٱللَّهُ'))
    def test_all_shipped_hamza_sakin(self):
        count=0
        for sura,ayas in Q.items():
            if sura<78: continue
            for aya in ayas:
                for word,spelling in S.spell_ayah(aya['t']):
                    for t in S.T.parse_word(word):
                        if t.c in 'أإؤئء' and t.sukun:
                            count+=1
                            self.assertIn('হামযা-সাকিন-’ (গলার গোড়ায় আটকে উচ্চারণ করুন; হামযা বাদ দেবেন না)',spelling,(sura,aya['n'],word))
        self.assertEqual(count,20)
        self.assertEqual(S.spell_word('أَ'),'হামযা-জবর-আ')
        self.assertEqual(S.spell_word('إِ'),'হামযা-জের-ই')
if __name__=='__main__': unittest.main()
