"""Independent diagnostic examples; passing tests do not clear content findings."""
import json
from pathlib import Path
import subprocess
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
from audit_spell_madd import findings, audit

class MaddAuditTests(unittest.TestCase):
    def test_visible_marks(self):
        for word, label, code in [('قَالَ','খাড়া জবর','unwritten_standing_fatha'),
                                 ('فِى','খাড়া জের','unwritten_standing_kasra'),
                                 ('قُولُ','উল্টা পেশ','unwritten_inverted_damma')]:
            self.assertIn(code, findings(word,label))
        for word,label in [('ذَٰلِكَ','খাড়া জবর'),('هِٖ','খাড়া জের'),
                           ('هِۦ','খাড়া জের'),('هُۥ','উল্টা পেশ'),('هُٗ','উল্টা পেশ')]:
            self.assertEqual(findings(word,label), [])

    def test_carrier_vs_consonant(self):
        label='ইয়া-সাকিন-য়্'
        for word in ['فِى','ٱلَّذِى','فِىٓ']:
            self.assertIn('madd_ya_extra_consonant',findings(word,label))
        for word in ['شَىْءٍ','حَىٌّ','إِيَابَهُمْ','وَجِا۟ىٓءَ','فِىَ','فِى۟','يَـٰلَيْتَنِى']:
            self.assertNotIn('madd_ya_extra_consonant',findings(word,label))
        self.assertEqual(findings('فِى','ফা-জের ও মাদ্দের ইয়া-ফী'), [])

    def test_alif(self):
        self.assertEqual(findings('مَآءً','আলিফ-সাকিন-্'), ['alif_isolated_hasanta'])
        self.assertEqual(findings('مَآءً','আলিফ (টেনে)'), [])

    def test_current_inventory_and_exit(self):
        path=ROOT/'www/data/spell_bn.json'
        result=audit(path)
        pairs=json.loads(path.read_text())['suras']
        self.assertEqual(result['words'],sum(len(a) for s in pairs.values() for a in s))
        self.assertEqual(len({r['ref'] for r in result['rows']}),len(result['rows']))
        for option, expected in [([],int(bool(result['rows']))),(['--report-only'],0)]:
            run=subprocess.run([sys.executable,str(ROOT/'tools/audit_spell_madd.py'),*option],capture_output=True,text=True)
            self.assertEqual(run.returncode,expected)
            self.assertEqual(json.loads(run.stdout),result)

if __name__ == '__main__': unittest.main()
