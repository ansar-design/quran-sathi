#!/bin/bash
set -e
D="$(dirname "$0")"
node --check "$D/../www/app.js"
node --check "$D/../www/feedback.js"
node --check "$D/../www/lib/hifz_plan.js"
node "$D/data.test.js"
node "$D/hifz_plan.test.js"
node "$D/audio_map.test.js"
node "$D/tajweed.test.js"
node "$D/pages15.test.js"
node "$D/recite_check.test.js"
node "$D/page_check.test.js"
node "$D/words_audio.test.js"
node "$D/quran.test.js"
node "$D/qari_url.test.js"
python3 "$D/translit_bn_test.py" > /dev/null
python3 "$D/hamza_test.py"
python3 "$D/ayn_test.py"
python3 "$D/overhaul_20261105_test.py"
python3 "$D/silent_waw_test.py"
python3 "$D/waw_alif_test.py"
python3 "$D/sakt_test.py"
python3 "$D/assimilation_test.py"
python3 "$D/waw_merge_test.py"
python3 "$D/wasl_test.py"
python3 "$D/jia_test.py"
python3 "$D/iya_test.py"
node "$D/pron.test.js"
node "$D/spell.test.js"
python3 "$D/tanween_test.py"
node "$D/learn_path.test.js"
node "$D/recording.test.js"
node "$D/download.test.js"

# Tests for the diagnostic itself; content findings remain in the separate audit.
python3 "$D/spell_madd_audit_test.py"

python3 "$D/madd_ya_test.py"

python3 "$D/madd_waw_label_test.py"

python3 "$D/madd_ya_label_test.py"

python3 "$D/spell_edges_test.py"

python3 "$D/fatha_sukun_test.py"

python3 "$D/small_sign_context_test.py"

python3 "$D/sukun_variant_test.py"

python3 "$D/lexical_small_test.py"


node "$D/hifz_recovery.test.js"


node "$D/backup_dialog.test.js"

python3 "$D/silah_hamza_test.py"

node "$D/reading_resume.test.js"

python3 "$D/medial_ya_test.py"

python3 "$D/iqlab_spelling_test.py"
