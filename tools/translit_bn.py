#!/usr/bin/env python3
"""Bangla pronunciation (উচ্চারণ) from Uthmani text - rule engine, Phase A (Juz Amma first).

Reads www/data/quran.json (or juz_amma.json), writes www/data/pron_bn.json {"suras": {"78": ["...", ...]}}.
Helper only: the app shows a fixed note that the Arabic is the correct one. Huzur must check Juz Amma output (VERIFY).
Rules: harakat, sukun, shadda, madd (alif/waw/ya, superscript alif), tanween, lam shamsiyya (article lam silent + doubled),
alif wasla elision, noon sakin/tanween iqlab (-> ম) and idgham (noon dropped, next letter doubled), silent letters (U+06DF),
waqf at ayah end (short final vowel dropped, tanween fatha -> া, teh marbuta -> হ).
Not yet: ikhfa/ghunna length, qalqala, tajweed colours (Phase D).
usage: translit_bn.py [--sura N]   |   python3 translit_bn.py --text "قُلْ هُوَ"
"""
import json, re, sys, os, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(HERE, '..', 'www', 'data')

FATHA, DAMMA, KASRA = 'َ', 'ُ', 'ِ'
FATHAN, DAMMAN, KASRAN = 'ً', 'ٌ', 'ٍ'
SHADDA, SUKUN, MADDAH, HAMZA_ABOVE = 'ّ', 'ْ', 'ٓ', 'ٔ'
# Unicode Arabic jazm is the Quranic sukun variant; preserve source spelling.
SUKUN_MARKS = (SUKUN, '\u06e1')
SUP_ALIF, SMALL_WAW, SMALL_YEH = 'ٰ', 'ۥ', 'ۦ'
SILENT_MARKS = ('۟', '۠')
SAKT = 'ۜ'
SAKT_NOTE = '[শ্বাস না নিয়ে অল্পক্ষণ থামুন]'
IGNORE = set('ۖۚۜ۞۩ۭۢـ')  # waqf signs, rub, sajdah, iqlab small meem, tatweel
LETTER_SET = set('ءأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيٱآ')
HARAKAT = {FATHA, DAMMA, KASRA, FATHAN, DAMMAN, KASRAN}
VOWEL_OF = {FATHA: 'a', DAMMA: 'u', KASRA: 'i'}
TANWEEN_OF = {FATHAN: 'a', DAMMAN: 'u', KASRAN: 'i'}

# ط = ত্ব and ق = ক্ব are written with a ব-ফলা. While a word is built they are kept as private placeholders, so that
# tidy() can split REAL accidental conjuncts (ت+ب, ك+ب, ن+ز -> ন্য ...) without breaking these two (5 Nov expert E12-E16).
TW, QW = '\ue001', '\ue002'
DIGRAPH = {TW: 'ত্ব', QW: 'ক্ব'}
CONS = {
    'ب': 'ব', 'ت': 'ত', 'ث': 'ছ', 'ج': 'জ', 'ح': 'হ', 'خ': 'খ', 'د': 'দ', 'ذ': 'য', 'ر': 'র', 'ز': 'য',
    'س': 'স', 'ش': 'শ', 'ص': 'ছ', 'ض': 'দ', 'ط': TW, 'ظ': 'য', 'غ': 'গ', 'ف': 'ফ', 'ق': QW, 'ك': 'ক',
    'ل': 'ল', 'م': 'ম', 'ن': 'ন', 'ه': 'হ', 'ة': 'ত', 'و': 'ওয়', 'ي': 'ইয়', 'ى': 'ইয়',
}
HEAVY = set('صضطظ')
SIGN = {'a': 'া', 'i': 'ি', 'u': 'ু', 'aa': 'া', 'ii': 'ী', 'uu': 'ূ', 'aw': 'াও', 'ay': 'াই'}
INDEP = {'a': 'আ', 'i': 'ই', 'u': 'উ', 'aa': 'আ', 'ii': 'ঈ', 'uu': 'ঊ', 'aw': 'আও', 'ay': 'আই'}
HAS = '্'
SUN = set('تثدذرزسشصضطظلن')       # lam shamsiyya letters
IDGHAM = set('يرملون')             # with next word


def sign_for(letter, v):
    # 5 Nov expert E9: the vowel after ص ض ط ظ is still a/aa - writing ো/োয়া made readers say 'o'. Heaviness is taught
    # by the teacher (and shown nowhere as a vowel change).
    return SIGN[v]


class Tok:
    __slots__ = ('c', 'v', 'tan', 'shadda', 'sukun', 'sup', 'smallw', 'smally', 'maddah', 'hamza', 'silent', 'used', 'after_glide', 'waqf_alif', 'smallm')

    def __init__(self, c):
        self.c = c; self.v = None; self.tan = None; self.shadda = False; self.sukun = False
        self.sup = False; self.smallw = False; self.smally = False; self.maddah = False
        self.hamza = False; self.silent = False; self.used = False; self.after_glide = False; self.waqf_alif = False; self.smallm = None


def hamza_on_tatweel(w):
    """Interpret tatweel + combining hamza as a separate hamza, locally only.

    Unicode chapter 9 Arabic: tatweel can carry hamza. Keep its marks on
    that hamza instead of overwriting the preceding consonant's marks.
    Ordinary elongation tatweel (e.g. before dagger alif) stays unchanged.
    Accept canonical mark reordering too; never modify the source Quran.
    """
    out = []
    i = 0
    while i < len(w):
        ch = w[i]
        if ch == 'ـ':
            j = i + 1
            while j < len(w) and unicodedata.combining(w[j]):
                j += 1
            marks = w[i + 1:j]
            if HAMZA_ABOVE in marks:
                out.append('ء' + marks.replace(HAMZA_ABOVE, ''))
                i = j
                continue
        out.append(ch)
        i += 1
    return ''.join(out)


def parse_word(w):
    w = hamza_on_tatweel(w)
    toks = []
    for ch in w:
        if ch in LETTER_SET:
            if ch == 'آ':
                t = Tok('ا'); t.maddah = True; toks.append(t)
            else:
                toks.append(Tok(ch))
        elif not toks:
            continue
        elif ch == 'ـ':
            continue
        else:
            t = toks[-1]
            if ch in VOWEL_OF: t.v = VOWEL_OF[ch]
            elif ch in TANWEEN_OF: t.tan = TANWEEN_OF[ch]
            elif ch == SHADDA: t.shadda = True
            elif ch in SUKUN_MARKS: t.sukun = True
            elif ch == SUP_ALIF: t.sup = True
            elif ch == SMALL_WAW: t.smallw = True
            elif ch == SMALL_YEH: t.smally = True
            elif ch == MADDAH: t.maddah = True
            elif ch == HAMZA_ABOVE: t.hamza = True
            elif ch in SILENT_MARKS:
                t.silent = True
                t.waqf_alif = (ch == '۠')   # U+06E0: silent when joined, read when stopping (أَنَا۠)
            elif ch in ('ۢ', 'ۭ'): t.smallm = ch  # Preserve source sign; context decides iqlab.
            elif ch in IGNORE: pass
            else:
                sys.stderr.write('unknown mark U+%04X in %s\n' % (ord(ch), w))
    return toks


def is_bare(t):
    return t.v is None and t.tan is None and not t.shadda and not t.sup and not t.smallw and not t.smally


def reading_tokens(toks):
    """Skip the silent alif inside ji'a (39:69 / 89:23) for vowel lookahead.

    Keep parse_word and the displayed Tanzil text intact. Only the marked
    alif between kasra and bare madd ya before hamza is transparent; do not
    remove other silent carriers or infer silence from an unmarked alif.
    """
    return [t for i, t in enumerate(toks) if not (
        0 < i < len(toks) - 2 and t.c == 'ا' and t.silent
        and is_bare(t) and not (t.sukun or t.hamza or t.maddah)
        and toks[i - 1].v == 'i'
        and toks[i + 1].c == 'ى' and is_bare(toks[i + 1])
        and toks[i + 1].maddah and not (toks[i + 1].sukun or toks[i + 1].silent)
        and toks[i + 2].c == 'ء')]


def is_waw_alif(t):
    """Unvowelled Uthmani waw carrying dagger alif: long a, not /w/.

    Vowelled/shaddaded waw (e.g. samawat) remains a consonant.
    """
    return (t.c == 'و' and t.sup and t.v is None and t.tan is None
            and not t.shadda and not t.sukun and not t.silent
            and not t.hamza and not t.smallw and not t.smally)


def merges_into(t, following, word_boundary=False):
    """Bounded complete assimilation, only where the source marks shadda.

    Do not infer this from an ayah-end stop or from a long vowel carrier.
    Noon/tanween, waw and other pairs have separate rules/review needs.
    """
    return (following is not None and following.shadda
            and ((t.c, following.c) == ('د', 'ت') or
                 (word_boundary and (t.c, following.c) in {('ل', 'ل'), ('م', 'م')}))
            and t.v is None and t.tan is None and not t.shadda
            and not (t.sup or t.smallw or t.smally or t.maddah or t.silent))


def merges_waw(t, previous, following):
    """Source-marked word-final consonantal waw after fatha, never madd waw."""
    return (previous is not None and previous.v == 'a'
            and not (previous.sup or previous.smallw or previous.smally or previous.tan)
            and t.c == 'و' and is_bare(t)
            and not (t.maddah or t.silent or t.hamza)
            and following is not None and following.c == 'و' and following.shadda)


def render_word(toks, ctx):
    """ctx: dict(waqf, next_first (first sounded letter of next word or None), next_wasla)
    returns (text, ends_with_vowel, tanween_pending) ; consumes toks."""
    toks = reading_tokens(toks)
    out = []
    n = len(toks)
    i = 0
    while i < n:
        t = toks[i]
        last = (i == n - 1)
        if t.silent and not (t.waqf_alif and last and ctx.get('waqf')):
            i += 1; continue   # U+06E0 alif (أَنَا۠) is read only at a stop (expert E20)
        c = t.c
        # letter-ending flags
        nxt = toks[i + 1] if i + 1 < n else None
        following = nxt if nxt is not None else ctx.get('next_token')
        if (merges_into(t, following, word_boundary=nxt is None) or
                (nxt is None and merges_waw(t, toks[i - 1] if i else None, following))) and (nxt is not None or not ctx.get('waqf')):
            if nxt is None:
                ctx['merged_boundary'] = True
            i += 1
            continue
        # ---- alif wasla
        if c == 'ٱ':
            if i == 0 and ctx.get('start'):
                # sounded at start of utterance
                if nxt is not None and nxt.c == 'ل' and not nxt.shadda or (nxt is not None and nxt.c == 'ل' and i + 2 < n):
                    out.append('আ')
                else:
                    third = toks[i + 2] if i + 2 < n else None
                    # u only if the 3rd letter's damma is original; the plural-imperative ending -ُوا has a temporary damma
                    # (ٱمْشُوا۟ ٱقْضُوٓا۟ ٱبْنُوا۟ -> i; expert E17, 5 Nov)
                    temp = re.sub('[^\u0621-\u064A]', '', ''.join(x.c for x in toks).replace('ٱ', 'ا')) in TEMP_DAMMA
                    out.append('উ' if third is not None and third.v == 'u' and not temp else 'ই')
            i += 1; continue
        # ---- article lam silent before sun letter with shadda
        # Uthmani writes an assimilated lam bare (no sukun) before a shadda letter: ٱلشَّمْسُ and also لِلطَّـٰغِينَ (78:22, expert E11/E31)
        if c == 'ل' and i >= 1 and nxt is not None and nxt.shadda and is_bare(t) and not t.sukun and not t.maddah:
            i += 1; continue
        # ---- plain alif (long vowel carrier already consumed) / stray alif
        if c == 'ا':
            if t.maddah and i == 0:
                out.append('আ')
            elif t.maddah or not t.used:
                pass  # long a handled via previous consonant
            i += 1; continue
        # ---- determine vowel
        v = t.v
        if t.sup: v = 'aa'
        long_consumed = 0
        if v == 'a' and nxt is not None and is_waw_alif(nxt):
            v = 'aa'; long_consumed = 1
        elif v in ('a', 'aa') and nxt is not None and not nxt.silent and nxt.c in 'اى' and (is_bare(nxt) or (nxt.c == 'ى' and nxt.sup and nxt.v is None and nxt.tan is None)) and not nxt.sukun or \
                (v == 'a' and nxt is not None and nxt.c in 'ا' and nxt.maddah and is_bare(nxt)):
            v = 'aa'; long_consumed = 1
        elif v == 'i' and nxt is not None and nxt.c in 'يى' and is_bare(nxt) and not nxt.sukun:
            v = 'ii'; long_consumed = 1
        elif v == 'u' and nxt is not None and not nxt.silent and nxt.c == 'و' and is_bare(nxt) and not nxt.sukun:
            v = 'uu'; long_consumed = 1
        elif (v == 'a' and nxt is not None and nxt.c == 'و' and nxt.sukun and not nxt.shadda
              and not (i + 2 == n and not ctx.get('waqf') and merges_waw(nxt, t, ctx.get('next_token')))):
            v = 'aw'; long_consumed = 1
        elif v == 'a' and nxt is not None and nxt.c in 'يى' and nxt.sukun and not nxt.shadda:   # ى with sukun = ya (شَىْءٍ)
            v = 'ay'; long_consumed = 1
        if t.smallw and v == 'u': v = 'uu'
        if t.smally and v == 'i': v = 'ii'
        # alif maksura after fatha-less: letter ى alone behaves as long a (e.g. هُدًى)
        if c == 'ى' and not t.sup and t.v is None and t.tan is None and not t.sukun:
            # long a carrier
            if i > 0 and (toks[i - 1].v == 'a' or toks[i - 1].tan == 'a'):
                i += 1; continue
        # a bare waw/ya that follows its matching vowel was consumed above; a bare one left over is skipped
        if c in 'وي' and is_bare(t) and not t.sukun and i > 0 and not toks[i - 1].used:
            pv = toks[i - 1].v
            if (c == 'و' and pv == 'u') or (c == 'ي' and pv == 'i'):
                i += 1; continue
        if c in 'أإؤئء' and i >= 1 and (not toks[i - 1].sukun or toks[i - 1].c in 'يوى'):
            t.after_glide = True   # after a sukun consonant the hyphen (tidy) already separates it
        t.used = True
        if long_consumed:
            toks[i + 1].used = True
        # A fathatan carrier is written after the final sounded consonant.
        # Count it as part of that ending before deciding whether to stop.
        if (t.tan == 'a' and nxt is not None and nxt.c in 'اى'
                and is_bare(nxt) and not nxt.sukun):
            long_consumed = 1
        # ---- waqf shortening
        at_end = last or (long_consumed and i + 1 == n - 1)
        # Ta marbuta stops as ha regardless of which vowel/tanween it carries.
        # This must precede the generic tanween branch.
        if at_end and ctx.get('waqf') and c == 'ة':
            out.append('হ' + HAS); i += 1; continue
        if at_end and ctx.get('waqf'):
            if v in ('a', 'i', 'u') and t.tan is None and c != 'ة':
                v = None; t.sukun = True
            if c == 'ه' and ((t.smallw and v == 'uu') or (t.smally and v == 'ii')):
                v = None; t.sukun = True
        # ---- tanween
        tan = t.tan
        if tan:
            if at_end and ctx.get('waqf'):
                if tan == 'a':
                    out.append(carry(c, 'aa', t, i == 0)); i += 1 + long_consumed
                    # alif after fathatan consumed (or maksura)
                    if i < n and toks[i].c in 'اى' and is_bare(toks[i]): i += 1
                    continue
                # kasra / damma tanween dropped at stop
                out.append(carry(c, None, t, i == 0)); i += 1
                continue
            # not at stop: sign + noon rule
            if i + 1 < n and toks[i + 1].c in 'اى' and is_bare(toks[i + 1]): pass
            nxt_l = ctx.get('next_first')
            if ctx.get('next_wasla'):
                # tanween + hamzat al-wasl: noon with helping kasra, joined (أَحَدٌ ٱللَّهُ -> আহাদুনিল্লাহ; expert E21)
                out.append(carry(c, tan, t, i == 0) + 'নি'); ctx['wasl_noon'] = True; i += 1
                if tan == 'a' and i < n and toks[i].c in 'اى' and is_bare(toks[i]): i += 1
                continue
            if tan == 'a':
                # fathatan + alif: consume alif
                j = i + 1
                if j < n and toks[j].c in 'اى' and is_bare(toks[j]): toks[j].used = True
            body = carry(c, tan, t, i == 0)
            out.append(body)
            out.append(noon_rule(nxt_l, c_end=True, ctx=ctx))
            i += 1
            if tan == 'a' and i < n and toks[i].c in 'اى' and toks[i].used: i += 1
            continue
        # ---- noon sakin inside/at end of word (explicit sukun or bare after consonant)
        if c == 'ن' and v is None and not t.shadda:
            nl = toks[i + 1].c if nxt is not None else ctx.get('next_first')
            out.append(noon_rule(nl, c_end=False, ctx=ctx, within=(nxt is not None)))
            i += 1
            continue
        # Keep initial hamza-kasra + consonantal ya visibly distinct in Bangla.
        # Without a boundary, ই + য়া looks like word-initial 'ya' (88:25).
        if (i == 1 and toks[0].c in 'أإؤئء' and toks[0].v == 'i'
                and not toks[0].shadda and c == 'ي' and t.v == 'a'
                and not t.shadda):
            out.append('-' + carry(c, v, t, True))
        else:
            out.append(carry(c, v, t, i == 0))
        if long_consumed: i += 1
        i += 1
    return ''.join(out)


# verbs whose 3rd-letter damma is temporary (start with i, not u): ٱمْشُوا۟ ٱقْضُوٓا۟ ٱبْنُوا۟ ٱئْتُوا۟ (expert E12, 5 Nov)
TEMP_DAMMA = {'امشوا', 'اقضوا', 'ابنوا', 'ائتوا'}
IKHFA = set('تثجدذزسشصضطظفقك')   # 15 ikhfa letters (Tuhfat al-Atfal)


def noon_rule(nl, c_end, ctx, within=False):
    """text for a noon-sakin / tanween noon given first letter of what follows ('' marker means idgham handled by caller)"""
    if ctx.get('waqf') and not within: return 'ন' + HAS
    if nl in IKHFA:
        return 'ঁ'   # ikhfa: hidden noon = nasal vowel with ghunnah (ঁ), not ন্ and not ং/ঙ (experts E12/E14, 5 Nov)
    if nl == 'ب':
        return 'ম' if c_end else 'ম' + HAS
    if not within and nl in IDGHAM and c_end is not None:
        ctx['idgham'] = nl
        return ''
    return 'ন' + HAS if not c_end else 'ন'


def carry(c, v, t, first):
    """consonant + vowel text. v None = sukun (coda)."""
    if c in 'أإؤئء':
        if v is None:
            return '’'
        base = INDEP[v] if v in INDEP else ''
        if not first and t.after_glide:
            base = '’' + base   # hamza after a vowel / ya-waw sukun: glottal stop shown (expert E22/E33, 5 Nov)
        if t.shadda: return '’' + HAS + base
        return base if first else base
    if c == 'ع':
        # Ayn uses its own marker, but still represents two consonants
        # under shadda, including when the final vowel is dropped at waqf.
        return ('‘‘' if t.shadda else '‘') + (INDEP[v] if v else '')
    if c in 'وي' and v is not None and v in ('aw', 'ay'):
        # Use the same medial ya spelling as the other vowel branches.
        return ('ওয়' if c == 'و' else ('ইয়' if first else 'য়')) + SIGN[v]
    cb = CONS.get(c, '')
    if c == 'ي' or c == 'ى':
        cb = 'ইয়' if first else 'য়'
    if c == 'و':
        cb = 'ওয়'
    if v is None:
        return (cb + HAS if t.shadda else '') + cb + HAS
    s = sign_for(c, v)
    if t.shadda:
        if c in 'وي':
            return cb + HAS + cb + s
        return cb + HAS + cb + s if True else ''
    return cb + s


def first_sounded(word):
    """first consonant that is actually pronounced when this word follows another (wasl)"""
    ts = parse_word(word)
    if not ts: return None, False
    if ts[0].c == 'ٱ':
        if len(ts) > 1 and ts[1].c == 'ل':
            return 'ل', True
        return (ts[1].c if len(ts) > 1 else None), True
    c = ts[0].c
    if c in 'أإؤئ': c = 'ء'
    return c, False


def sakt_segments(text):
    """Only standalone internal sakt in our Tanzil source is a boundary.

    Embedded small seen over sad is a pronunciation sign, not a pause.
    A terminal sakt does not change our existing ayah-end stop policy.
    """
    segments = [[]]
    for word in text.split():
        if word == SAKT and any(parse_word(w) for w in segments[-1]):
            segments.append([])
        else:
            segments[-1].append(word)
    return [' '.join(part) for part in segments if any(parse_word(w) for w in part)]


def convert_ayah(text):
    segments = sakt_segments(text)
    if len(segments) > 1:
        return (' ' + SAKT_NOTE + ' ').join(convert_ayah(part) for part in segments)
    # Standalone pause/sajdah signs are not words: they must not hide the
    # actual last word or interrupt lookahead for a connected reading.
    words = [w for w in text.split() if parse_word(w)]
    parts = []
    for k, w in enumerate(words):
        toks = parse_word(w)
        # Initial shadda from the preceding ayah is a wasl-only assimilation.
        # Each helper string starts independently after an ayah-end stop.
        if k == 0:
            toks[0].shadda = False
        last_w = (k == len(words) - 1)
        nf, nwasla = (None, False) if last_w else first_sounded(words[k + 1])
        next_token = None if last_w else parse_word(words[k + 1])[0]
        ctx = {'next_token': next_token, 'waqf': last_w, 'next_first': nf, 'start': k == 0 or False, 'idgham': None, 'next_wasla': nwasla and not last_w}
        # tanween / noon sakin at end of word: noon_rule inside render_word uses ctx.next_first
        txt = render_word(toks, ctx)
        # idgham: noon dropped -> next word's first letter doubles; glue to next word
        if ctx.get('merged_boundary'):
            # The next source shadda already renders the doubled consonant.
            parts.append((txt, True, next_token.c, False, ''))
        elif ctx.get('idgham'):
            parts.append((txt, True, ctx['idgham'], False, '#noon'))   # noon/tanween idgham (ghunnah rules apply)
        else:
            parts.append((txt, False, None, nwasla, re.sub('[^\u0621-\u064A]', '', w)))
    # join: wasl alif elision => glue to previous (no space); idgham => glue and double next first
    out = ''
    for idx, (txt, idg, letter, nwasla, bare_w) in enumerate(parts):
        out += txt
        if idx == len(parts) - 1: break
        nxt_txt = parts[idx + 1][0]
        if idg and letter in 'وي' and bare_w == '#noon':
            # idgham WITH ghunnah into waw/ya is incomplete: the nasal stays (ঁ), noon itself not pronounced (expert E15)
            out += 'ঁ-'
        elif idg:
            # double the next word's first consonant: take its first consonant cluster
            dbl = first_cluster(nxt_txt)
            out += dbl + HAS if dbl and not nxt_txt.startswith(dbl + HAS) else ''
            out += ''  # glued
        elif nwasla:
            # At this connected boundary the madd carrier is dropped before
            # the sakin after hamzat al-wasl. Stops/sakt never reach this join.
            # Bangla uses the same sign for short/long a; only i/u differ here.
            short = {'ী': 'ি', 'ূ': 'ু', 'ঈ': 'ই', 'ঊ': 'উ'}
            if out and out[-1] in short:
                out = out[:-1] + short[out[-1]]
            # A consonantal sukun instead takes the existing helping kasra.
            # (expert 5 Nov: مِنْ takes fatha, the plural meem takes damma, others kasra)
            if out.endswith(HAS):
                helper = 'া' if bare_w == 'من' else ('ু' if bare_w.endswith(('هم', 'كم', 'تم')) else 'ি')
                out = out[:-1] + helper
        else:
            out += ' '
    return tidy(out)


def tidy(s):
    for iv in 'অআইঈউঊএঐওঔ‘’':
        s = s.replace(HAS + iv, HAS + '-' + iv)
    # A sukun consonant + য/ব/ম would print as য-ফলা/ব-ফলা/ম-ফলা, which a Bangla reader doubles or drops
    # (আন্যাল্না read 'annalna', আক্বার read 'aqar'). Split with a hyphen unless it is a real doubling (ব্ব, ম্ম, য্য).
    s = re.sub('([\u0995-\u09B9\u09DC-\u09DF\ue001\ue002])\u09CD(?=([\u09AC\u09AE\u09AF]))',
               lambda m: m.group(0) if m.group(1) == m.group(2) else m.group(0) + '-', s)
    for k, v in DIGRAPH.items():
        s = s.replace(k, v)
    return s


def first_cluster(s):
    # first Bangla consonant (with possible multi-letter forms ওয়/ইয়/ক্ব/ত্ব)
    for pre in (TW, QW, 'ত্ব', 'ক্ব', 'ওয়', 'ইয়', 'য়'):
        if s.startswith(pre): return pre
    return s[0] if s else ''


def main():
    args = sys.argv[1:]
    if '--text' in args:
        print(convert_ayah(args[args.index('--text') + 1])); return
    only = int(args[args.index('--sura') + 1]) if '--sura' in args else None
    src = os.path.join(WWW, 'quran.json')
    if not os.path.exists(src): src = os.path.join(WWW, 'juz_amma.json')
    d = json.load(open(src, encoding='utf-8'))
    suras = d['suras'] if isinstance(d, dict) else d
    out = {}
    for s in suras:
        if only and s['sura'] != only: continue
        if only is None and s['sura'] < 78: continue   # Juz Amma first
        out[str(s['sura'])] = [convert_ayah(a['t']) for a in s['ayas']]
    json.dump({'note': 'Bangla pronunciation helper, rule engine tools/translit_bn.py; VERIFY by Huzur', 'suras': out},
              open(os.path.join(WWW, 'pron_bn.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('wrote pron_bn.json suras:', len(out), 'ayahs:', sum(len(v) for v in out.values()))


if __name__ == '__main__':
    main()
