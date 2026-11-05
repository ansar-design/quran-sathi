#!/bin/bash
# One-click text check (MD 3 Nov): downloads 2 outside copies and compares every ayah + meaning. ~1 min.
set -e
cd "$(dirname "$0")/.."
D=$(mktemp -d); mkdir -p "$D/qpc"
curl -sf -o "$D/cloud_uth.json" https://api.alquran.cloud/v1/quran/quran-uthmani
curl -sf -o "$D/cloud_bn.json" https://api.alquran.cloud/v1/quran/bn.bengali
for i in $(seq 1 114); do curl -sf -o "$D/qpc/$i.json" "https://api.quran.com/api/v4/quran/verses/qpc_hafs?chapter_number=$i"; done
python3 tools/verify_text.py "$D" | tee "$(dirname "$0")/../release/text_check.txt"
