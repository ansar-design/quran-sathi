const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const W=path.join(__dirname,'../www'),L=require('../www/lib/learn_path');
class Element {
  constructor(tag) { this.tag=tag; this.children=[]; this.attrs={}; this._text=''; }
  appendChild(e) { this.children.push(e); return e; }
  set textContent(t) { this._text=t; this.children=[]; }
  get textContent() { return this._text + this.children.map(e=>e.textContent).join(''); }
  setAttribute(k,v) { this.attrs[k]=v; }
  scrollIntoView() {}
  insertBefore(e) { this.children.unshift(e); }
  get style() { return this._style || (this._style={setProperty(k,v){this[k]=v;}}); }
}
const nodes=Object.fromEntries(['main','bar','title','back','about-btn'].map(k=>[k,new Element('div')]));
let saved={}, failure=false, alerts=[], audio=[], confirmations=[], acceptConfirm=false;
class FakeAudio {
  constructor(src) { this.src=src; this.paused=false; audio.push(this); }
  play() { return Promise.resolve(); }
  pause() { this.paused=true; }
}
const context={console, Audio:FakeAudio, LearnPath:L, HifzPlan:require('../www/lib/hifz_plan'),
  document:{getElementById:id=>nodes[id],createElement:t=>new Element(t),createTextNode:t=>{const e=new Element('text');e.textContent=t;return e;},documentElement:new Element('html'),querySelector:()=>null},
  localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>{if(failure)throw Error('full');saved[k]=v;}},
  window:{scrollTo(){},addEventListener(){}}, navigator:{}, alert:s=>alerts.push(s),
  setTimeout, clearTimeout, setInterval, clearInterval, confirm:message=>{confirmations.push(message);return acceptConfirm;},
  fetch:async name=>({json:async()=>JSON.parse(fs.readFileSync(path.join(W,name),'utf8'))})};
vm.runInNewContext(fs.readFileSync(path.join(W,'app.js'),'utf8'),context);
function all(e) { return [e,...e.children.flatMap(all)]; }
function click(label, root=nodes.main) { const b=all(root).find(e=>e.tag==='button'&&e.textContent===label); assert(b,'button '+label); b.onclick(); }
setImmediate(()=>{
  click('শিখি');
  let choose=all(nodes.main).find(e=>e.attrs['aria-label']==='শেখার আয়াত');
  choose.value='2';choose.onchange();click('পুরো আয়াত শুনি ও পড়ি');
  assert.deepEqual(JSON.parse(saved['reading-v1']),{sura:112,ayah:3});
  click('■ ক্বারী থামান',nodes.bar);
  all(nodes.main).filter(e=>e.tag==='button'&&/^ayah/.test(e.className))[3].onclick();
  assert.deepEqual(JSON.parse(saved['reading-v1']),{sura:112,ayah:4});
  nodes.back.onclick();click('সূরা');
  click('↻ আগের পড়া: আল-ইখলাস · আয়াত 4');
  assert(all(nodes.main).find(e=>e.className==='ayah sel').textContent.includes('আয়াত নম্বর 4'));
  assert(audio.every(a=>a.paused),'resume does not autoplay');
  // Save automatic qari advancement, too.
  const cards=all(nodes.main).filter(e=>e.tag==='button'&&/^ayah/.test(e.className));cards[1].onclick();
  click('🔊 ক্বারী',nodes.bar);audio.at(-1).onended();
  assert.deepEqual(JSON.parse(saved['reading-v1']),{sura:112,ayah:3});
  nodes.back.onclick();
  for(const value of ['broken','null','{"sura":112,"ayah":999}','{"sura":"112","ayah":2}']){
    saved['reading-v1']=value;saved.lastSura='114';
    click('শিখি');click('সূরা');click('↻ আগের পড়া: আন-নাস · আয়াত 1');
    assert(all(nodes.main).find(e=>e.className==='ayah sel').textContent.includes('আয়াত নম্বর 1'));
    nodes.back.onclick();
  }
  failure=true;click('↻ আগের পড়া: আন-নাস · আয়াত 1');
  all(nodes.main).filter(e=>e.tag==='button'&&/^ayah/.test(e.className))[1].onclick();
  assert(all(nodes.main).find(e=>e.className==='ayah sel').textContent.includes('আয়াত নম্বর 2'),'storage failure does not break reading');
  console.log('PASS reading resume: manual/Learn/qari selections, exact home shortcut, no autoplay, legacy/invalid-state fallback, storage unavailable');
});
