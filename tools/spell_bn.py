#!/usr/bin/env python3
"""Bangla spelling mode (বানান করে পড়া) - Phase B, Juz Amma first.

For each Arabic word writes the traditional qaida spelling: letter name + mark name + sound, e.g.
  بِسْمِ -> "বা-জের-বি, সীন-সাকিন-স্, মীম-জের-মি"
Reuses the Phase A parser/sound rules of translit_bn.py. Output www/data/spell_bn.json
{"suras": {"112": [[["word_ar", "spelling"], ...] per ayah]}}.
Helper only (same fixed 'Arabic is correct' note as Phase A). Letter names + mark names = AI draft -> Huzur VERIFY.
usage: spell_bn.py [--sura N] | spell_bn.py --text "قُلْ هُوَ"
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import translit_bn as T

NAME = {
    'ا': 'আলিফ', 'ب': 'বা', 'ت': 'তা', 'ث': 'ছা', 'ج': 'জীম', 'ح': 'হা', 'خ': 'খা', 'د': 'দাল', 'ذ': 'যাল',
    'ر': 'রা', 'ز': 'যা', 'س': 'সীন', 'ش': 'শীন', 'ص': 'ছোয়াদ', 'ض': 'দোয়াদ', 'ط': 'ত্বোয়া', 'ظ': 'যোয়া',
    'ع': 'আইন', 'غ': 'গাইন', 'ف': 'ফা', 'ق': 'ক্বাফ', 'ك': 'কাফ', 'ل': 'লাম', 'م': 'মীম', 'ن': 'নূন',
    'ه': 'হা', 'و': 'ওয়াও', 'ي': 'ইয়া', 'ى': 'ইয়া', 'ة': 'তা', 'ء': 'হামযা', 'أ': 'হামযা', 'إ': 'হামযা',
    'ؤ': 'হামযা', 'ئ': 'হামযা', 'ٱ': 'আলিফ',
}
MARK = {'a': 'জবর', 'i': 'জের', 'u': 'পেশ', 'aa': 'খাড়া জবর', 'ii': 'খাড়া জের', 'uu': 'উল্টা পেশ'}
TAN = {'a': 'দুই জবর', 'i': 'দুই জের', 'u': 'দুই পেশ'}


def spell_word(w, next_token=None, ayah_start=False):
    parsed = T.parse_word(w)
    if ayah_start and parsed:
        parsed[0].shadda = False   # shadda from joining the previous ayah; each ayah is read from a stop (expert E6)
    toks = T.reading_tokens(parsed)
    silent_alif_bridge = len(toks) != len(parsed)
    parts = []
    for i, t in enumerate(toks):
        if t.silent:
            if t.c == 'ا' and t.waqf_alif:
                parts.append('আলিফ (মিলিয়ে পড়লে পড়া হয় না, থামলে টেনে পড়ুন)')
            continue
        if i > 0 and T.is_waw_alif(t) and toks[i - 1].v == 'a':
            continue  # carrier belongs to the preceding long-a sound
        nm = NAME.get(t.c, '')
        if not nm:
            continue
        if t.c == 'ا' and t.v is None and t.tan is None and not t.sup and i > 0 and not t.silent:
            continue  # long-vowel alif (also with madd sign آ) is named with the previous letter's mark (expert E5/E10)
        if t.c == 'ى' and not t.sukun and t.v is None and t.tan is None and i > 0 and (toks[i - 1].v == 'a' or toks[i - 1].tan == 'a'):
            continue  # alif maqsura (ى / ىٰ) after fatha: no sound of its own, named with the previous letter (expert E8/E9/E43)
        if T.is_bare(t) and not t.sukun and not t.hamza and i > 0 and ((t.c == 'و' and toks[i - 1].v == 'u') or (t.c == 'ي' and toks[i - 1].v == 'i')):
            continue   # madd carrier only after ITS vowel: waw after damma, ya after kasra (expert E23)
        if t.c == 'ى' and not t.hamza and T.is_bare(t) and not t.sukun and i > 0 and toks[i - 1].v == 'i':
            continue  # long-i carrier, already represented with the preceding letter
        nxt = toks[i + 1] if i + 1 < len(toks) else None
        following = nxt if nxt is not None else next_token
        if (T.merges_into(t, following, word_boundary=nxt is None) or
                (nxt is None and T.merges_waw(t, toks[i - 1] if i else None, following))):
            target = NAME[following.c]
            parts.append(nm + '-সাকিন (' + ('পরের শব্দের ' if nxt is None else '')
                         + target + '-এর সঙ্গে মিশিয়ে পড়ুন)')
            continue
        v = t.v
        long_a = None   # what makes the a long, for the mark name (expert E7: khara jabar only when the small alif is printed)
        if t.sup: v = 'aa'
        elif v == 'a' and nxt is not None and T.is_waw_alif(nxt): v = 'aa'   # dagger alif IS printed (on the waw): khara jabar is right
        elif v == 'a' and nxt is not None and nxt.c == 'ا' and nxt.maddah and not nxt.silent:
            v = 'aa'; long_a = 'জবর ও মাদ্দের আলিফ (মাদ্দ চিহ্ন: টেনে পড়ুন)'
        elif v == 'a' and nxt is not None and nxt.c == 'ا' and T.is_bare(nxt) and not nxt.sukun and not nxt.silent:
            v = 'aa'; long_a = 'জবর ও মাদ্দের আলিফ'
        elif v == 'a' and nxt is not None and nxt.c == 'ى' and not nxt.sukun and nxt.v is None and nxt.tan is None:
            v = 'aa'; long_a = 'জবর ও খাড়া জবরের আলিফ মাকসূরা (আগের জবর টেনে আ পড়ুন; আলাদা ইয়া পড়বেন না)' if nxt.sup else 'জবর ও আলিফ মাকসূরা (আগের জবর টেনে আ পড়ুন; আলাদা ইয়া পড়বেন না)'
        elif v == 'i' and nxt is not None and nxt.c in 'يى' and T.is_bare(nxt) and not nxt.sukun: v = 'ii'
        elif v == 'u' and nxt is not None and not nxt.silent and nxt.c == 'و' and T.is_bare(nxt) and not nxt.sukun: v = 'uu'
        # Printed small vowels: internal lexical sounds and final-ha silah.
        # A missing next token does not prove a stop: teach both cases explicitly.
        small_mark = None
        final_ha = nxt is None and t.c == 'ه'
        if (nxt is not None or final_ha) and not (t.tan or t.sukun or t.sup or t.silent):
            if t.smallw and not t.smally and t.v == 'u':
                v = 'uu'; small_mark = 'পেশ ও ছোট ওয়াও'
            elif t.smally and not t.smallw and t.v == 'i':
                v = 'ii'; small_mark = 'জের ও ছোট ইয়া'
        if t.tan:
            # Elementary spelling sound; connected/stop rules belong to recitation.
            mark = TAN[t.tan]; snd = T.carry(t.c, t.tan, t, i == 0) + 'ন্'
            if t.tan == 'a' and nxt is not None and nxt.c == 'ى' and T.is_bare(nxt):
                mark += ' (শেষের আলিফ মাকসূরা পড়া হয় না; থামলে টেনে আ)'
        elif v:
            mark = MARK[v]; snd = T.carry(t.c, v, t, i == 0)
        else:
            mark = 'সাকিন'; snd = T.carry(t.c, None, t, i == 0)
        if v == 'uu' and t.v == 'u' and not t.tan:
            # Ordinary damma plus a written waw is not an inverted-damma mark.
            mark = 'পেশ ও মাদ্দের ওয়াও'
        if (v == 'ii' and t.v == 'i' and not t.tan and nxt is not None
                and nxt.c in 'يى' and not (nxt.hamza or nxt.silent or nxt.sukun)):
            # Name the printed kasra plus written carrier, not a standing kasra.
            mark = 'জের ও মাদ্দের ইয়া'
        if silent_alif_bridge and v == 'ii' and nxt is not None and nxt.c == 'ى':
            mark = 'জের ও মাদ্দের ইয়া'
        if long_a and not t.tan:
            mark = long_a
        # Allah: the doubled lam of the Name is read with a long a although no alif is printed (expert, 112:1-2)
        if t.c == 'ل' and t.shadda and t.v == 'a' and nxt is not None and nxt.c == 'ه' and i + 2 == len(toks) and ''.join(x.c for x in toks).endswith('لله'):
            mark = 'জবর (আল্লাহ নামে টেনে পড়া হয়; আগে জের থাকলে লাম পাতলা, নইলে মোটা)'; v = 'aa'
        if small_mark is not None:
            mark = small_mark
        if small_mark is not None and final_ha:
            snd = '(মিলিয়ে পড়লে ' + snd + '; থামলে হ্)'
            if t.maddah:
                snd += ' (মাদ্দ চিহ্ন: টানের মাপ কারির কাছে শুনে শিখুন)'
        if t.c in 'أإؤئء' and snd.startswith('’'):
            if v is None:
                snd = '’ (গলার গোড়ায় আটকে উচ্চারণ করুন; হামযা বাদ দেবেন না)'
            else:
                snd = snd[1:]   # keep the vowelled letter spelling unchanged
        if t.shadda:
            mark = 'তাশদীদ ' + mark
        if t.c == 'ا' and t.maddah and i == 0:
            parts.append('আলিফ-মাদ্দ (হামযা-জবর ও মাদ্দের আলিফ)-আ'); continue   # word-initial آ = hamza + long a (expert E11)
        if t.c == 'ٱ' and i == 0 and ayah_start:
            # reading starts here: wasl hamza is pronounced - a before the article, u if the 3rd letter has damma, else i (expert E7)
            third = toks[2] if len(toks) > 2 else None
            temp = ''.join(x.c for x in toks).replace('ٱ', 'ا') in T.TEMP_DAMMA   # ٱمْشُوا۟ etc.: temporary damma (expert E12)
            snd = 'আ' if (nxt is not None and nxt.c == 'ل') else ('উ' if third is not None and third.v == 'u' and not temp else 'ই')
            mark = 'ওয়াসল (আয়াতের শুরুতে পড়া হয়)'
        elif t.c == 'ٱ':
            mark = 'ওয়াসল'; snd = ''
        elif t.c == 'ل' and i >= 1 and nxt is not None and nxt.shadda and T.is_bare(t) and not t.sukun:
            mark = 'চিহ্ন নেই (পড়া হয় না, পরের ' + NAME.get(nxt.c, '') + '-এর সঙ্গে মিশে যায়)'; snd = ''
        parts.append(nm + '-' + mark + (('-' + snd) if snd else ''))
    out = ', '.join(parts)
    for k, v in T.DIGRAPH.items():   # ط/ق placeholders from translit_bn -> ত্ব / ক্ব
        out = out.replace(k, v)
    return out


def spell_ayah(text):
    out = []
    segments = T.sakt_segments(text)
    for i, segment in enumerate(segments):
        words = [w for w in segment.split() if T.parse_word(w)]
        for j, w in enumerate(words):
            following = T.parse_word(words[j + 1])[0] if j + 1 < len(words) else None
            out.append([w, spell_word(w, following, ayah_start=(i == 0 and j == 0))])
        if i < len(segments) - 1:
            out[-1][1] += ' ' + T.SAKT_NOTE
    return out


def main():
    args = sys.argv[1:]
    if '--text' in args:
        for w, s in spell_ayah(args[args.index('--text') + 1]): print(w, '=>', s)
        return
    only = int(args[args.index('--sura') + 1]) if '--sura' in args else None
    d = json.load(open(os.path.join(T.WWW, 'quran.json'), encoding='utf-8'))
    suras = d['suras'] if isinstance(d, dict) else d
    out = {}
    for s in suras:
        if only and s['sura'] != only: continue
        if only is None and s['sura'] < 78: continue
        out[str(s['sura'])] = [spell_ayah(a['t']) for a in s['ayas']]
    json.dump({'note': 'Bangla spelling helper, tools/spell_bn.py; VERIFY by Huzur', 'suras': out},
              open(os.path.join(T.WWW, 'spell_bn.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('wrote spell_bn.json suras:', len(out), 'ayahs:', sum(len(v) for v in out.values()))


if __name__ == '__main__':
    main()
