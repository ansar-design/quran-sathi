// Execute production dialog callbacks and backup flow. No rendered/UI claims.
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const W=path.join(__dirname,'../www');
class E {
 constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.style={setProperty(){}};}
 appendChild(e){this.children.push(e);e.parent=this;return e;}
 setAttribute(k,v){this[k]=v;}
 addEventListener(k,f){this.handlers[k]=f;}
 showModal(){this.open=true;}
 close(){this.open=false;if(this.handlers.close)this.handlers.close();}
 remove(){this.parent.children=this.parent.children.filter(e=>e!==this);}
 focus(){doc.activeElement=this;}
 select(){this.selected=true;}
}
const doc={body:new E('body'),createElement:t=>new E(t),documentElement:new E('html'),getElementById:()=>new E('div')};
const ctx={document:doc,window:{addEventListener(){}},fetch:()=>new Promise(()=>{})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(W,'lib/bangla_dialog.js'),'utf8'),ctx);
const D=ctx.window.BanglaDialog;
function dialog(){assert.equal(doc.body.children.length,1);return doc.body.children[0];}
function buttons(){return dialog().children.find(e=>e.className==='row').children;}
let result=[], old;
const show=E.prototype.showModal;
E.prototype.showModal=function(){throw Error('unavailable');};
assert.throws(()=>D.open({title:'failure',message:'test'}),/unavailable/);
assert.equal(doc.body.children.length,0);
E.prototype.showModal=show;
D.open({title:'test',message:'<b>literal</b>',value:'HZ1',readOnly:true,accept:'বন্ধ করুন'},x=>result.push(x));
assert(doc.activeElement.selected);assert(doc.activeElement.readOnly);assert.equal(dialog().children[1].textContent,'<b>literal</b>');
assert.equal(D.open({title:'duplicate'}),false);old=buttons()[0];old.onclick();old.onclick();assert.equal(result.length,1);assert.equal(doc.body.children.length,0);
D.open({title:'confirm',message:'test',cancel:'বাতিল',accept:'ফিরিয়ে আনুন'},x=>result.push(x));
assert.equal(doc.activeElement.textContent,'বাতিল');let prevented=false;dialog().handlers.cancel({preventDefault(){prevented=true;}});assert(prevented);assert.equal(result.at(-1),null);
D.open({title:'input',message:'test',value:'',cancel:'বাতিল',accept:'next'},x=>{result.push(x);D.open({title:'next',message:'test'});});
doc.activeElement.value='abc';buttons()[1].onclick();assert.equal(result.at(-1),'abc');buttons()[0].onclick();
// Run actual backup import/confirm/storage closures.
let saved=JSON.stringify({start:'2026-11-01',size:2,order:'reverse',done:3,markedOn:''}), fail=false, renders=0, prompts=[];
ctx.localStorage={getItem:k=>k==='hifz'?saved:null,setItem:(k,v)=>{if(fail)throw Error('quota');saved=v;}};
ctx.HifzPlan=require('../www/lib/hifz_plan');ctx.BanglaDialog={open:(o,f)=>prompts.push({o,f})};
ctx.alert=()=>{throw Error('native dialog in backup flow');};
let src=fs.readFileSync(path.join(W,'app.js'),'utf8').replace(/\}\)\(\);\s*$/, 'window.test={restoreBackup,setData:d=>data=d,setRender:f=>render=f};})();');
vm.runInContext(src,ctx);const api=ctx.window.test;api.setData(require('../www/data/juz_amma.json'));api.setRender(()=>renders++);
const original=saved;const code='HZ1-2026-11-02-2-r-10';
function start(value){prompts=[];api.restoreBackup();prompts[0].f(value);}
start(null);assert.equal(saved,original);assert.equal(prompts.length,1);
for(const bad of ['', 'bad', 'HZ1-2026-02-30-2-r-10']){start(bad);assert.equal(saved,original);assert.equal(prompts.length,2);assert(!prompts[1].f);}
start(code);prompts[1].f(null);assert.equal(saved,original);
start(code);saved='newer';prompts[1].f(true);assert.equal(saved,'newer');assert(prompts.at(-1).o.message.includes('বদলেছে'));saved=original;
start(code);fail=true;prompts[1].f(true);assert.equal(saved,original);assert.equal(renders,0);assert(prompts.at(-1).o.message.includes('সেভ হয়নি'));fail=false;
start(code);prompts[1].f(true);assert.equal(JSON.parse(saved).done,10);assert.equal(renders,1);
console.log('backup_dialog.test PASS: modal lifecycle, duplicate clicks, cancel/Escape, read-only export, chained dialogs, invalid import, stale progress, quota failure, restore');
