// Execute actual app lifecycle functions with deferred native Filesystem promises.
// This is logic coverage, not a native storage/audio or UI test.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const tick = () => new Promise(resolve => setImmediate(resolve));
const source = fs.readFileSync(path.join(__dirname, '../www/app.js'), 'utf8');
(async () => {
  let saved = '{"1":2}', failSave = false;
  const deletes = [], downloads = [], alerts = [];
  const node = () => ({appendChild(){}, setAttribute(){}, style:{setProperty(){}}, textContent:''});
  const nodes = Object.fromEntries(['main','bar','title','back','about-btn'].map(k=>[k,node()]));
  const FS = {
    getUri: async () => ({uri:'file:///qari'}), mkdir: async () => {},
    deleteFile: args => new Promise((resolve,reject)=>deletes.push({args,resolve,reject})),
    downloadFile: args => new Promise((resolve,reject)=>downloads.push({args,resolve,reject}))
  };
  const context = {
    console, Promise, window:{Capacitor:{Plugins:{Filesystem:FS},convertFileSrc:x=>x},addEventListener(){}},
    document:{getElementById:k=>nodes[k],createElement:node,documentElement:node()},
    localStorage:{getItem:k=>k==='dl'?saved:null,setItem:(k,v)=>{if(failSave)throw Error('full');if(k==='dl')saved=v;}},
    alert:m=>alerts.push(m), fetch:()=>new Promise(()=>{})
  };
  // Expose closures only inside the test VM; production code has no test API.
  vm.runInNewContext(source.replace(/\}\)\(\);\s*$/, 'window.test = {removeSura, downloadSura, dlMap, busy:()=>removing}; })();'),context);
  const api=context.window.test, s={sura:1,g0:1,ayas:[{n:1},{n:2}]};
  for(const raw of ['true','"bad"','[]','null','{']){saved=raw;assert.equal(Object.keys(api.dlMap()).length,0);}
  saved='{"1":2}'; failSave=true; api.removeSura(s); await tick();
  assert.equal(deletes.length,0); assert.equal(saved,'{"1":2}'); assert(alerts.at(-1).includes('তথ্য'));
  failSave=false; api.removeSura(s); await tick(); assert.equal(deletes.length,2); assert.equal(saved,'{}'); assert.equal(api.busy(),1);
  api.removeSura(s); api.downloadSura(s); await tick(); assert.equal(deletes.length,2); assert.equal(downloads.length,0);
  deletes[0].resolve(); await tick(); api.downloadSura(s); await tick(); assert.equal(downloads.length,0,'all deletes must settle before download');
  deletes[1].reject(Error('IO')); await tick(); assert.equal(api.busy(),null); assert(alerts.at(-1).includes('মোছা যায়নি'));
  api.downloadSura(s); await tick(); assert.equal(downloads.length,1);
  api.removeSura(s); await tick(); assert.equal(deletes.length,2,'no removal during download');
  downloads[0].resolve(); await tick(); assert.equal(downloads.length,2);
  failSave=true; downloads[1].resolve(); await tick(); assert.equal(saved,'{}'); assert(alerts.at(-1).includes('তথ্য'));
  failSave=false; api.downloadSura(s); await tick(); downloads[2].resolve(); await tick(); downloads[3].resolve(); await tick();
  assert.equal(JSON.parse(saved)['1'],2);
  api.removeSura(s); await tick(); deletes[2].resolve(); deletes[3].resolve(); await tick();
  assert.equal(api.busy(),null); assert.equal(saved,'{}');
  console.log('download.test OK: malformed metadata, failed saves, delayed/failed deletion, operation exclusion, retry/completion');
})().catch(e=>{console.error(e);process.exitCode=1;});
