"""89:23 long ī across silent alif; source and historical delta guards."""
from iya_test import upgrade_iya
from madd_ya_test import upgrade_madd
from madd_waw_label_test import upgrade_waw_labels
import copy
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools'))
import translit_bn as T
import spell_bn as S

WORD = 'وَجِا۟ىٓءَ'
OLD_PRON = 'ওয়াজিয়্-আ'
NEW_PRON = 'ওয়াজী’আ'
OLD_SPELL = 'ওয়াও-জবর-ওয়া, জীম-জের-জি, ইয়া-সাকিন-য়্, হামযা-জবর-আ'
NEW_SPELL = 'ওয়াও-জবর-ওয়া, জীম-জের ও মাদ্দের ইয়া-জী, হামযা-জবর-আ'


def upgrade_jia(old, filename):
    """Apply only this exact later word repair to older historical fixtures."""
    out = copy.deepcopy(old)
    if filename == 'pron_bn.json':
        prefix, rest = out['89'][22].split(' ', 1)
        assert prefix == OLD_PRON
        out['89'][22] = NEW_PRON + ' ' + rest
    else:
        assert out['89'][22][0] == [WORD, OLD_SPELL]
        out['89'][22][0] = [WORD, NEW_SPELL]
    return upgrade_waw_labels(upgrade_madd(out)) if filename == "spell_bn.json" else out


class JiaTests(unittest.TestCase):
    def test_long_i_and_separate_hamza(self):
        self.assertEqual(T.convert_ayah(WORD + ' يَوْمَ'), NEW_PRON + ' ইয়াওম্')
        self.assertEqual(T.convert_ayah(WORD), 'ওয়াজী’')
        self.assertEqual(S.spell_word(WORD), NEW_SPELL)
        # A simple-script equivalent has the same sound, with no source rewrite.
        self.assertEqual(T.convert_ayah(WORD), T.convert_ayah('وَجِيءَ'))

    def test_parser_retains_source_and_near_misses(self):
        toks = T.parse_word(WORD)
        self.assertEqual([t.c for t in toks], list('وجاىء'))
        before = [(t.c, t.silent) for t in toks]
        self.assertEqual([t.c for t in T.reading_tokens(toks)], list('وجىء'))
        self.assertEqual(before, [(t.c,t.silent) for t in toks])
        for word in [WORD.replace('۟',''), WORD.replace('ِ','َ'), WORD.replace('ٓ','ْ'),
                     WORD.replace('ءَ','بَ'), 'قَالُوا۟', 'أُو۟لَـٰئِكَ']:
            ts=T.parse_word(word)
            self.assertEqual(T.reading_tokens(ts), ts, word)
        self.assertEqual(T.convert_ayah('فِى'), 'ফী')
        self.assertEqual(T.convert_ayah('إِيَابَهُمْ'), 'ই-ইয়াবাহুম্') # separately repaired; iya_test verifies exact delta

    @unittest.skip('SUPERSEDED 5 Nov 2026: expert-panel overhaul changed the corpus on purpose; freshness, Arabic-unchanged and goldens now in overhaul_20261105_test.py')
    def test_exact_corpus_delta_and_freshness(self):
        src=json.loads((ROOT/'www/data/quran.json').read_text())['suras']
        for filename, convert in [('pron_bn.json',T.convert_ayah),('spell_bn.json',S.spell_ayah)]:
            old=json.loads((ROOT/'_old/jia-20261105-0254/www/data'/(filename+'.bak-20261105-studio')).read_text())['suras']
            now=json.loads((ROOT/'www/data'/filename).read_text())['suras']
            self.assertEqual(now,upgrade_iya(upgrade_jia(old, filename), filename))
            for s in src:
                if s['sura'] >= 78:
                    self.assertEqual(now[str(s['sura'])],[convert(a['t']) for a in s['ayas']])
        affected=[]
        for s in src:
            for i,a in enumerate(s['ayas']):
                for word in a['t'].split():
                    ts=T.parse_word(word)
                    if len(T.reading_tokens(ts)) != len(ts): affected.append((s['sura'],i+1,word))
        self.assertEqual(affected,[(39,69,WORD),(89,23,WORD)])

if __name__ == '__main__': unittest.main()
