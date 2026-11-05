#!/usr/bin/env python3
"""Golden tests for tools/translit_bn.py (hand-written expected Bangla pronunciation, VERIFY by Huzur)."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools'))
from translit_bn import convert_ayah

CASES = [
    ('قُلْ هُوَ ٱللَّهُ أَحَدٌ', 'ক্বুল্ হুওয়াল্লাহু আহাদ্'),
    ('ٱللَّهُ ٱلصَّمَدُ', 'আল্লাহুছ্ছামাদ্'),
    ('لَمْ يَلِدْ وَلَمْ يُولَدْ', 'লাম্ ইয়ালিদ্ ওয়ালাম্ ইয়ূলাদ্'),
    ('وَٱلْعَصْرِ', 'ওয়াল্-‘আছ্র্'),
    ('إِنَّ ٱلْإِنسَـٰنَ لَفِى خُسْرٍ', 'ইন্নাল্-ইঁসানা লাফী খুস্র্'),
    ('إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ', 'ইন্না আ‘ত্বাইনাকাল্কাওছার্'),
    ('وَٱلضُّحَىٰ', 'ওয়াদ্দুহা'),
]

if __name__ == '__main__':
    import unittest
    from waqf_test import WaqfTests
    result = unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(WaqfTests))
    bad = 0 if result.wasSuccessful() else 1
    for ar, exp in CASES:
        got = convert_ayah(ar)
        ok = got == exp
        print(('OK  ' if ok else 'DIFF'), ar, '->', got, '' if ok else '(expected ' + exp + ')')
        bad += 0 if ok else 1
    sys.exit(1 if bad else 0)
