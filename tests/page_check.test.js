const assert = require('node:assert/strict');
const PC = require('../www/lib/page_check');
const RC = require('../www/lib/recite_check');
const q = require('../www/data/quran.json');
const pages = require('../www/data/pages15.json').pages;
let count = 0;
for (const [ix, p] of pages.entries()) {
  if (p[0] < 587 || p[0] > 611) continue;
  const end = pages[ix + 1];
  const items = q.suras.flatMap(s => s.ayas.filter(a =>
    (s.sura > p[1] || s.sura === p[1] && a.n >= p[2]) &&
    (!end || s.sura < end[1] || s.sura === end[1] && a.n < end[2])
  ).map(a => ({sura:s.sura, ayah:a.n, text:a.t, name:s.name_ar})));
  const ref = PC.reference(items, RC);
  const result = RC.compare(ref.text, ref.text);
  const groups = PC.groups(ref, result);
  assert(result.allOk);
  const ayahs = groups.filter(g=>!g.bism);
  assert.equal(ayahs.length,items.length);
  ayahs.forEach((g,i)=>assert.deepEqual(g.words.map(w=>w.word),RC.words(items[i].text).map(w=>w.raw)));
  // Omit a whole distinct ayah: later references stay assigned to their original sura/ayah.
  const target = ref.segments.findIndex(s=>!s.bism);
  const skipped = RC.compare(ref.text,ref.segments.filter((_,i)=>i!==target).map(s=>s.text).join(' '));
  const sg = PC.groups(ref,skipped);
  assert(!skipped.allOk);
  assert.equal(sg.length,groups.length);
  assert.equal(sg.at(-1).label,groups.at(-1).label);
  count+=items.length;
}
assert.equal(count,564);
assert.throws(()=>PC.groups({segments:[{count:2}]},{words:[]}));
const ref=PC.reference([{sura:113,ayah:1,text:'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',name:'Falaq'},{sura:114,ayah:1,text:'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',name:'Nas'}],RC);
assert.equal(ref.segments.filter(s=>s.bism).length,2);
assert(RC.compare(ref.text,ref.text+' مرحبا').extra.length>0);
console.log('PASS: all25pages/564ayahs mapped, multi-sura Bismillah, omission, extras, alignment guard');
