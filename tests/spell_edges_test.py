"""Source-sign inventory contracts; passing does not validate teaching content."""
import hashlib
import json
from pathlib import Path
import sys
import unittest
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
from inventory_spell_edges import edge_signs, inventory


class EdgeInventoryTests(unittest.TestCase):
    def test_hamza_support_and_reordered_marks(self):
        for word, base in [('فِىٔ', 'ى'), ('فِىِٔ', 'ى'), ('فِىِٔ', 'ى'), ('شَيْـًٔا', 'ـ')]:
            signs = edge_signs(word)
            hamza = next(s for s in signs if s['category']=='combining_hamza_above')
            self.assertEqual(hamza['base'], base)
            self.assertEqual(word[hamza['offset']], 'ٔ')
        self.assertEqual(edge_signs('ٔ')[0]['base'], None)
        self.assertEqual(edge_signs('إِ'), [])  # precomposed hamza outside this inventory
        self.assertEqual(edge_signs('إ')[0]['category'], 'combining_hamza_below')

    def test_sukun_is_inventory_not_madd_assertion(self):
        for word in ['بَيْتٍ', 'بَيۡتٍ', 'قُوْ', 'فِىْ', 'اْ']:
            self.assertEqual(edge_signs(word)[0]['category'], 'explicit_sukun_on_carrier_shape')
        for word in ['فِي', 'فِىٓ', 'مِنْ', 'وَ', 'ْ']:
            self.assertEqual(edge_signs(word), [])

    def test_small_signs_and_multiple_signs(self):
        for char, category in [('ۥ','small_waw'),('ۦ','small_yeh'),('ٖ','subscript_alef'),('ٗ','inverted_damma')]:
            self.assertEqual(edge_signs('ه'+char)[0]['category'],category)
        signs = edge_signs('هِۦٔ')
        self.assertEqual([s['base'] for s in signs], ['ه','ه'])

    def test_exact_corpus_offsets_hash_and_counts(self):
        path=ROOT/'www/data/spell_bn.json'
        result=inventory(path)
        self.assertEqual(result['sha256'],hashlib.sha256(path.read_bytes()).hexdigest())
        data=json.loads(path.read_text())['suras']
        self.assertEqual(result['words'],sum(len(a) for s in data.values() for a in s))
        self.assertEqual(len({r['ref'] for r in result['rows']}),result['review_words'])
        self.assertEqual(sum(result['sign_counts'].values()),sum(len(r['signs']) for r in result['rows']))
        for r in result['rows']:
            s,a,w=r['ref'].split(':')
            self.assertEqual([r['arabic'],r['spelling']],data[s][int(a)-1][int(w)-1])
            for sign in r['signs']:
                self.assertEqual(f"U+{ord(r['arabic'][sign['offset']]):04X}",sign['codepoint'])

if __name__ == '__main__': unittest.main()
