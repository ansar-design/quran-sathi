"""Review-context integrity; tests do not approve religious teaching."""
from pathlib import Path
import sys
import json
import unittest
from unittest.mock import Mock
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
from small_sign_context import align_words, report


class ContextTests(unittest.TestCase):
    def test_repeated_words_and_retained_pause(self):
        tokens, offsets = align_words('بِهِۦ ۖ بِهِۦ', [('بِهِۦ','a'),('بِهِۦ','b')])
        self.assertEqual(offsets, [0,2])
        self.assertEqual(tokens[1], 'ۖ')

    def test_fail_closed_on_misalignment(self):
        for text, pairs in [('بِهِۦ', [('بِهِ','x')]), ('قُلْ بِهِۦ', [('بِهِۦ','x')]),
                            ('بِهِۦ قُلْ', [('بِهِۦ','x')]), ('بِهِۦ', [])]:
            with self.assertRaises(ValueError): align_words(text,pairs)

    def test_report_keeps_internal_and_trailing_pause(self):
        spelling = Mock()
        source = Mock()
        spelling.read_bytes.return_value = json.dumps({'suras': {'1': [
            [['بِهِۦ', 'first'], ['بِهِۦ', 'second']]]}}).encode()
        source.read_bytes.return_value = json.dumps({'suras': [{'sura': 1,
            'ayas': [{'n': 1, 't': 'بِهِۦ ۖ بِهِۦ ۚ'}]}]}).encode()
        rows = report(spelling, source)['rows']
        self.assertEqual([r['intervening_source_tokens'] for r in rows], [['ۖ'], ['ۚ']])
        self.assertEqual([r['spelling'] for r in rows], ['first', 'second'])
        self.assertEqual([r['ayah_final_word'] for r in rows], [False, True])
        self.assertEqual(rows[1]['next_word_same_ayah'], None)

    def test_packaged_corpus_and_boundaries(self):
        result = report(ROOT/'www/data/spell_bn.json', ROOT/'www/data/quran.json')
        self.assertEqual(result['sign_counts'], {'small_yeh':19, 'small_waw':59})
        self.assertEqual(result['review_words'],78)
        rows = {r['ref']:r for r in result['rows']}
        self.assertEqual(rows['78:15:2']['arabic'],'بِهِۦ')
        self.assertEqual(rows['78:15:2']['next_word_same_ayah'],'حَبًّۭا')
        self.assertEqual(rows['80:24:4']['next_ayah_context']['ref'], '80:25')
        self.assertTrue(rows['80:24:4']['next_ayah_context']['text'].startswith('أَنَّا'))
        self.assertIsNone(rows['78:15:2']['next_ayah_context'])
        # Surah endings must not imply a connection to the next surah.
        for ref in ['98:8:21', '99:8:6']:
            self.assertIsNone(rows[ref]['next_ayah_context'])
        self.assertEqual(sum(r['next_ayah_context'] is not None for r in rows.values()), 17)
        for r in rows.values():
            self.assertEqual(r['ayah_text'].split()[r['source_token_index']],r['arabic'])
            self.assertEqual(r['ayah_final_word'],r['next_word_same_ayah'] is None)
            for sign in r['signs']:
                self.assertIn(r['arabic'][sign['offset']], 'ۥۦ')

if __name__ == '__main__': unittest.main()
