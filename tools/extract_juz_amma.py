#!/usr/bin/env python3
"""Extract Juz Amma (suras 78-114) verbatim from the Tanzil Uthmani XML (CC-BY 3.0, source: tanzil.net).
Text is copied byte-for-byte; nothing is retyped or normalised. Output: www/data/juz_amma.json"""
import json, os, re
import xml.etree.ElementTree as ET

# Tanzil Uthmani XML (no pause marks), e.g. from the quran_transcript pip package: quran-script/quran-uthmani-without-pause-sajda-hizb-marks.xml
SRC = os.environ.get("QURAN_XML", "quran-uthmani-without-pause-sajda-hizb-marks.xml")
OUT = os.path.join(os.path.dirname(__file__), "..", "www", "data", "juz_amma.json")

root = ET.parse(SRC).getroot()
suras = []
total = 0
for s in root.iter("sura"):
    idx = int(s.get("index"))
    if idx < 78:
        continue
    ayas = []
    for a in s.iter("aya"):
        txt = a.get("text")
        # Tanzil puts the basmala in 'bismillah' attribute of aya 1 for suras other than 1, 9
        ayas.append({"n": int(a.get("index")), "t": txt})
    suras.append({"sura": idx, "name_ar": s.get("name"), "name_en": s.get("tname"), "ayas": ayas})
    total += len(ayas)

expected = {78:40,79:46,80:42,81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,90:20,91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,101:11,102:8,103:3,104:9,105:5,106:4,107:7,108:3,109:6,110:3,111:5,112:4,113:5,114:6}
for s in suras:
    assert len(s["ayas"]) == expected[s["sura"]], (s["sura"], len(s["ayas"]))
assert len(suras) == 37 and total == 564, (len(suras), total)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"source": "Tanzil Uthmani v1.1 (tanzil.net, CC BY 3.0), unchanged", "suras": suras}, f, ensure_ascii=False)
print("OK", len(suras), "suras", total, "ayas ->", os.path.abspath(OUT))
