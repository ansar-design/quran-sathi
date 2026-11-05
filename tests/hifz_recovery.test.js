// Real app closures; no browser/device claims. Invalid backups must never replace progress.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const HifzPlan = require('../www/lib/hifz_plan.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../www/data/juz_amma.json')));
let saved = null;
const node = () => ({ appendChild(){}, setAttribute(){}, style:{setProperty(){}}, textContent:'' });
const context = {
  window:{addEventListener(){}}, document:{getElementById:node,createElement:node,documentElement:node()},
  localStorage:{getItem:()=>saved}, fetch:()=>new Promise(()=>{}), HifzPlan
};
const source = fs.readFileSync(path.join(__dirname, '../www/app.js'), 'utf8');
vm.runInNewContext(source.replace(/\}\)\(\);\s*$/, 'window.test={dayNo,hzLoad,hzImport,hzExport,today,setData:d=>data=d}; })();'),context);
const api = context.window.test; api.setData(data);
for (const date of ['2026-02-29','2024-02-30','2026-04-31','2026-00-01','2026-13-01','2026-01-00','2026-99-99','1900-02-29','bad',null,[],['2026-11-05'],{}]) {
  assert(Number.isNaN(api.dayNo(date)), String(date));
  if (typeof date === 'string') assert.strictEqual(api.hzImport('HZ1-'+date+'-2-r-20'),null);
  saved=JSON.stringify({start:date,done:20});
  const h=api.hzLoad(); assert.equal(h.start,api.today()); assert.equal(h.done,20,'preserve valid progress');
  const plan=HifzPlan.dayPlan(HifzPlan.buildLessons(data.suras,2,'reverse'),h.done,api.dayNo(api.today())-api.dayNo(h.start));
  assert(plan.manzil.length>0 && plan.manzil.every(Boolean));
}
for(const date of ['2024-02-29','2000-02-29','2026-11-05','0099-01-01','0000-02-29']) {
  const h=api.hzImport('HZ1-'+date+'-2-r-20'); assert(h); assert.equal(api.hzExport(h),'HZ1-'+date+'-2-r-20');
}
assert.equal(api.dayNo('0100-01-01')-api.dayNo('0099-12-31'),1);
assert.equal(api.dayNo('2026-03-09')-api.dayNo('2026-03-08'),1,'civil dates independent of DST');
for(const raw of ['null','true','[]','"bad"','{','{"done":1e999}','{"done":"20"}','{"done":1.5}','{"done":-1}']) {
  saved=raw; const h=api.hzLoad(); assert.equal(h.done,0); assert.equal(h.start,api.today());
}
saved=JSON.stringify({start:'2024-02-29',size:1,order:'forward',done:20,markedOn:'2026-99-99'});
assert.equal(api.hzLoad().markedOn,''); assert.equal(api.hzLoad().done,20);
assert.equal(api.hzImport('HZ1-2026-11-05-2-r-999'),null);
console.log('hifz_recovery.test OK: invalid calendar/backup/storage, preserved progress, leap years, early years, DST');
