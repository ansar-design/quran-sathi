"""5 Nov 2026 expert-panel overhaul (expert.json run 13:54, 33 WRONG): goldens for every fixed rule + corpus freshness.
Replaces the chained _old/ delta snapshots (marked SUPERSEDED in the older test files)."""
import json, re, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import translit_bn as T
import spell_bn as S

Q = {s['sura']: [a['t'] for a in s['ayas']] for s in json.loads((ROOT / 'www/data/quran.json').read_text())['suras']}


class Overhaul(unittest.TestCase):
    def test_conjuncts_are_split(self):            # E12-E16, E34, E35: no accidental য/ব-ফলা
        for ref, part in [((79, 7), 'তাত্-বা'), ((88, 24), 'আক্-বার্'), ((97, 1), 'আঁযাল্নাহু'), ((79, 22), 'আদ্-বারা'),
                          ((85, 19), 'তাক্-যীব্'), ((92, 19), 'তুজ্-যা'), ((80, 21), 'ক্ব্-বারাহ্')]:
            self.assertIn(part, T.convert_ayah(Q[ref[0]][ref[1] - 1]), ref)
        pron = json.loads((ROOT / 'www/data/pron_bn.json').read_text())['suras']
        bad = []
        for s, rows in pron.items():
            for i, x in enumerate(rows):
                x = re.sub(r'\[[^\]]*\]', '', x)      # Bangla instructions like [শ্বাস না নিয়ে ...] are not pronunciation
                for m in re.finditer('([ক-হ])্([বময])', x):
                    if m.group(1) != m.group(2) and m.group(0) not in ('ত্ব', 'ক্ব'):
                        bad.append((s, i + 1, m.group(0), x))
        self.assertEqual(bad, [], 'accidental ফলা conjunct left')
        self.assertIn('ক্বুল্', T.convert_ayah(Q[112][0]))     # ق stays ক্ব
        self.assertIn('ত্ব', T.convert_ayah(Q[78][21]))         # ط stays ত্ব

    def test_assimilated_lam_after_li(self):      # E11/E31/E32 (78:22)
        p = T.convert_ayah(Q[78][21])
        self.assertTrue(p.startswith('লিত্ব্ত্বা'), p)
        self.assertIn('লাম-চিহ্ন নেই (পড়া হয় না', S.spell_word('لِّلطَّـٰغِينَ', ayah_start=True))

    def test_hamza_after_ya_sukun(self):           # E33 شَىْءٍ
        self.assertIn('শাই’ইন', T.convert_ayah(Q[78][28]))
        self.assertEqual(T.convert_ayah('شَىْءٍ'), 'শাই’')

    def test_spelling_marks(self):                 # E5/E7/E8/E9/E10/E43
        self.assertIn('কাফ-জবর ও মাদ্দের আলিফ-কা', S.spell_word('كَانَ'))
        self.assertNotIn('খাড়া জবর', S.spell_word('كَانَ'))
        self.assertIn('খাড়া জবরের আলিফ মাকসূরা', S.spell_word('إِلَىٰ'))
        self.assertTrue(S.spell_word('إِلَىٰ').endswith(')-লা'))   # sound = লা, no extra য়া
        self.assertIn('আলিফ মাকসূরা (আগের জবর টেনে আ পড়ুন; আলাদা ইয়া পড়বেন না)', S.spell_word('عَلَى'))
        self.assertNotIn('ইয়া-সাকিন', S.spell_word('عَلَى'))
        self.assertIn('মাদ্দ চিহ্ন', S.spell_word('مَآءًۭ'))
        self.assertNotIn('আলিফ-সাকিন', S.spell_word('مَآءًۭ'))
        self.assertNotIn('ইয়া-সাকিন', S.spell_word('طُوًى'))
        self.assertIn('ইয়া-সাকিন-য়্', S.spell_word('شَىْءٍ'))   # real ya sukun stays

    def test_ayah_start_shadda_and_allah(self):    # E6 + Allah long a
        sp = S.spell_ayah(Q[78][36])
        self.assertFalse(sp[0][1].startswith('রা-তাশদীদ'), sp[0][1])
        self.assertIn('আল্লাহ নামে টেনে পড়া হয়', S.spell_word('ٱللَّهُ'))

    def test_ana_silent_alif(self):                # 79:24 / 109:4
        self.assertIn('মিলিয়ে পড়লে পড়া হয় না, থামলে টেনে পড়ুন', S.spell_word('أَنَا۠'))

    # helping vowel at two sakins (مِنْ -> মিনা, plural meem -> u): Tanzil always prints that vowel itself, so the
    # branch in convert_ayah is a safety net only - no corpus case to test.

    def test_round2_rules(self):                   # expert run 14:07: E9 heavy vowel, E12 ikhfa, E22 hamza, E6/E27 hint
        self.assertNotRegex(json.dumps(json.loads((ROOT / 'www/data/pron_bn.json').read_text()), ensure_ascii=False), 'োয়া')
        self.assertIn('মিঁ শার্রি', T.convert_ayah('مِن شَرِّ مَا خَلَقَ'))
        self.assertIn('রা’আহু', T.convert_ayah(Q[96][6]))
        self.assertNotIn('শব্দ ধরে অডিও এখন নেই', (ROOT / 'www/app.js').read_text())

    def test_round3_rules(self):                   # expert run 14:14
        self.assertIn('মিঁ শার্রি', T.convert_ayah('مِن شَرِّ مَا خَلَقَ'))                       # E14 ikhfa = nasal vowel
        self.assertIn('ইনাবাঁ-ওয়াক্বাদ্', T.convert_ayah('وَعِنَبًۭا وَقَضْبًۭا'))              # E15 ghunnah into waw
        self.assertEqual(T.convert_ayah('نُوحٌ ٱبْنَهُۥ'), 'নূহুনিব্নাহ্')                      # E21 tanween + wasl
        self.assertIn('আওয়্-ওয়াযানূহুম্', T.convert_ayah(Q[83][2]))                            # waw+waw: no ghunnah
        self.assertIn("'س': 'সীন'", (ROOT / 'tools/spell_bn.py').read_text())                  # E1
        self.assertTrue(S.spell_ayah(Q[112][1])[0][1].startswith('আলিফ-ওয়াসল (আয়াতের শুরুতে পড়া হয়)-আ'))  # E7
        self.assertEqual((ROOT / 'www/app.js').read_text().count('ডান দিক থেকে শব্দ ধরে পড়ার চেষ্টা করুন।'), 1)  # E10

    def test_round5_wasl_start(self):              # expert run 14:34 E12
        self.assertTrue(T.convert_ayah('ٱمْشُوا۟ فِى').startswith('ইম্'))
        self.assertTrue(T.convert_ayah('ٱدْعُوا۟ رَبَّكُمْ').startswith('উদ্'))
        self.assertIn('তাজবীদ রং', (ROOT / 'www/app.js').read_text())

    def test_sura_names(self):                     # E21, E50
        app = (ROOT / 'www/app.js').read_text()
        self.assertIn("50:'ক্বাফ'", app); self.assertIn("81:'আত-তাকউইর'", app)

    def test_freshness_and_arabic_unchanged(self):
        pron = json.loads((ROOT / 'www/data/pron_bn.json').read_text())['suras']
        spell = json.loads((ROOT / 'www/data/spell_bn.json').read_text())['suras']
        for s in range(78, 115):
            self.assertEqual(pron[str(s)], [T.convert_ayah(t) for t in Q[s]], s)
            self.assertEqual(spell[str(s)], [S.spell_ayah(t) for t in Q[s]], s)
            for row, ayah in zip(spell[str(s)], Q[s]):
                self.assertEqual([w for w, _ in row], [w for w in ayah.split() if T.parse_word(w)])
        self.assertNotRegex(json.dumps([pron, spell], ensure_ascii=False), '[]')


if __name__ == '__main__':
    unittest.main()
