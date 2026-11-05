"""Connected madd i/u shortening; independent stops retain their vowel."""
import json
import sys
import unittest
from jia_test import upgrade_jia
from iya_test import upgrade_iya
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import translit_bn as T

CHANGED_AYAHS = ['78:18','79:10','81:20','83:16','84:25','85:10','85:11','85:15',
                 '87:18','89:8','89:9','89:10','89:11','95:6','98:4','98:5','98:7',
                 '100:9','100:10','103:3','104:4','113:4']

class WaslTests(unittest.TestCase):
    def test_connected_moon_sun_and_plural(self):
        for ar, expected in [('فِى ٱلصُّورِ','ফিছ্ছূর্'), ('فِى ٱلْقُبُورِ','ফিল্ক্বুবূর্'),
                             ('لَصَالُوا۟ ٱلْجَحِيمِ','লাছালুল্জাহীম্'),
                             ('قَالُوا ٱلْحَمْدُ','ক্বালুল্হাম্দ্')]:
            self.assertEqual(T.convert_ayah(ar), expected)

    def test_stop_sakt_and_nonwasl_keep_length(self):
        for ar, expected in [('فِى','ফী'),('قَالُوا۟','ক্বালূ'),('فِى بَيْتٍ','ফী বাইত্'),
                             ('فِى أَرْضٍ','ফী আর্দ্')]:
            self.assertEqual(T.convert_ayah(ar),expected)
        self.assertEqual(T.convert_ayah('فِى ۜ ٱلصُّورِ'),'ফী '+T.SAKT_NOTE+' আছ্ছূর্')
        self.assertEqual(T.convert_ayah('قَالُوا۟ ۜ ٱلْحَمْدُ'),'ক্বালূ '+T.SAKT_NOTE+' আল্হাম্দ্')
        self.assertEqual(T.convert_ayah('فِى ۖ ٱلصُّورِ'),'ফিছ্ছূর্')

    def test_short_vowels_and_consonant_helping_vowel(self):
        self.assertEqual(T.convert_ayah('فِ ٱلْقُبُورِ'),'ফিল্ক্বুবূর্')
        self.assertEqual(T.convert_ayah('قُلْ ٱلْحَمْدُ'),'ক্বুলিল্হাম্দ্')
        self.assertEqual(T.convert_ayah('ذُو ٱلْعَرْشِ'),'যুল্-‘আর্শ্')

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_full_corpus_exact_delta_and_freshness(self):
        src=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        old=json.loads((ROOT/'_old/wasl-20261104-2044/www/data/pron_bn.json.bak-20261104-studio').read_text())['suras']
        old=upgrade_iya(upgrade_jia(old, 'pron_bn.json'), 'pron_bn.json')
        current=json.loads((ROOT/'www/data/pron_bn.json').read_text())['suras']
        delta=[]
        for s in src:
            if s['sura']<78: continue
            key=str(s['sura'])
            for i,a in enumerate(s['ayas']):
                self.assertEqual(current[key][i],T.convert_ayah(a['t']))
                if current[key][i]!=old[key][i]:
                    delta.append(f'{key}:{i+1}')
                    # Only length signs change, never consonants or boundaries.
                    table=str.maketrans('ীূঈঊ','িুইউ')
                    self.assertEqual(current[key][i].translate(table),old[key][i].translate(table))
        self.assertEqual(delta,CHANGED_AYAHS)

if __name__=='__main__': unittest.main()
