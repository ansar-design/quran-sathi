# Third-party content and licences

The source code written for Quran Sathi is licensed under GPL-3.0 (see `LICENSE`). Copyright (C) 2026 Tosa Creations Limited.
The content below is **not** covered by that licence. Each item keeps its own terms.

| Content | Where | Source | Licence / terms |
|---|---|---|---|
| Quran Arabic text (Uthmani) | `www/data/quran.json`, `www/data/juz_amma.json` | Tanzil Project, https://tanzil.net | CC BY 3.0, verbatim copying only (no changes to the text), keep the credit and link. See https://tanzil.net/docs/Text_License |
| Bangla meaning (Muhiuddin Khan) | `www/data/quran_bn.json`, `www/data/juz_amma_bn.json` | Tanzil translations (bn.bengali) | Non-commercial use only; other use needs the translator/publisher's permission. https://tanzil.net/trans/ |
| Recitation audio (Al-Husary) | downloaded by `tools/fetch_audio.py`, NOT in this repository | Islamic Network / alquran.cloud (cdn.islamic.network) | Reciter's copyright; free non-commercial redistribution. https://alquran.cloud/terms-and-conditions |
| Tajweed rule spans | `www/data/tajweed.json`, `tools/src/cpfair_tajweed_*` | cpfair/quran-tajweed (Collin Fair) | CC BY 4.0 |
| Word timings | `www/data/words_husary.json`, `tools/src/Husary_64kbps.json` | cpfair/quran-align (Collin Fair) | CC BY 4.0 |
| 15-line Hafezi page map | `www/data/pages15.json`, `tools/src/quran_android_naskh_QuranData.java` | quran/quran_android (https://github.com/quran/quran_android) | GPL-3.0 |
| Fonts: Scheherazade New, Amiri, Hind Siliguri, Tiro Bangla | `www/fonts/` | SIL Global, Amiri project, Indian Type Foundry, Tiro Typeworks | SIL Open Font License 1.1 (licence texts in `www/fonts/`) |

Generated data (`pron_bn.json`, `spell_bn.json`) is produced by the GPL tools in `tools/` from the Tanzil text above.

If you are a rights holder and want something changed or removed, please open an issue.
