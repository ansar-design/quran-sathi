# কুরআন সাথী (Quran Sathi)

A free Bangla app for reading, listening to and memorising the Quran. Free forever: no ads, no in-app purchases, no tracking. Recordings and progress stay on the phone.

বাংলায় কুরআন পড়া, শোনা ও হিফজের একটি ফ্রি অ্যাপ। বিজ্ঞাপন নেই, কেনাকাটা নেই, তথ্য সংগ্রহ নেই।

## What it does
- All 114 suras: Arabic text (Tanzil Uthmani, unchanged), Bangla meaning, experimental Bangla pronunciation and letter-by-letter spelling.
- Recitation by Sheikh Mahmoud Khalil Al-Husary: Juz Amma works offline; other suras stream or download per sura. Repeat 1/3/5/10 times, slow mode, tap a word to hear it.
- Record your own recitation and listen back (on the phone only, deleted when the app closes).
- Tajweed colours for Juz Amma.
- Hifz plan (sabaq / sabqi / amukhta) for Juz Amma.
- Hafezi page view: Juz Amma in the pages of the 15-line IndoPak (Hafezi) mushaf, with page recitation and a "read without looking" mode.
- Step-by-step learning (letters, harakat, spelling, words, ayah).

The app does **not** check recitation for mistakes. It is a practice aid, not a replacement for a qualified teacher. Bangla pronunciation and spelling are experimental and still under scholar review.

## Build
Requirements: Node 20+, Python 3, Android SDK / JDK 21.
```bash
npm install
python3 tools/fetch_audio.py --small   # downloads the Juz Amma Husary audio (not in this repository); --small needs ffmpeg
bash tests/run.sh                 # all tests
npx cap sync android
cd android && ./gradlew assembleDebug
```
Release signing reads `AW_KEYSTORE` and `AW_KEYPASS` from the environment; no keys are in this repository.

## Project layout
- `www/` the app (plain JavaScript, no framework): `app.js` screens, `lib/` hifz plan, learn path, Bangla dialog, `data/` Quran text and generated data.
- `tools/` scripts that build the data files (`build_quran.py`, `translit_bn.py`, `spell_bn.py`, `build_tajweed.py`, `build_word_audio.py`, `build_pages15.py`, `fetch_audio.py`).
- `tests/` Node and Python tests (`bash tests/run.sh`).
- `android/` Capacitor Android project.

## Licence
The app's own code is licensed under the **GNU General Public License v3.0** (see `LICENSE`).
Quran text, translation, audio, fonts and other data keep their **own** licences, listed in `NOTICE.md`. Some of them allow only non-commercial use, so they may not be sold or used with ads.

## Feedback
Use the "মতামত" button in the app, or open an issue here. Corrections to pronunciation or spelling are very welcome; please give the sura and ayah.

Publisher: Tosa Creations Limited, Dhaka, Bangladesh.
