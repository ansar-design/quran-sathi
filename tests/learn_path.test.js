'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const W = path.join(__dirname, '../www');
const L = require('../www/lib/learn_path');
assert(/\.learn-cards \.bism \{ font-size:var\(--az,32px\)/.test(fs.readFileSync(path.join(W,'index.html'),'utf8')), 'full learning ayah follows reading size');
const q = require('../www/data/quran.json');
for (const raw of [null, '{}', '[]', 'null', '{', '{"sura":1,"ayah":-1,"step":99}']) {
  assert.deepStrictEqual(L.restore(raw, q.suras), {sura:112, ayah:0, step:0});
}
assert.deepStrictEqual(L.restore('{"sura":114,"ayah":5,"step":4}', q.suras), {sura:114,ayah:5,step:4});
assert.deepStrictEqual(L.letters('قُلْ هُوَ'), ['ق','ل','ه','و']);
assert.deepStrictEqual(L.groups('قُلْ هُوَ'), ['قُ','لْ','هُ','وَ']);
// Separate source-encoded hamza from its preceding letter, retaining every mark.
for (const word of ['مَـَٔاب', 'مَـَٔاب', 'مَـ\u0654\u064eاب']) {
  assert.deepStrictEqual(L.letters(word), ['م','ء','ا','ب']);
  assert.equal(L.groups(word).join(''), word);
  assert(L.groups(word)[1].startsWith('ـ'));
  assert(L.groups(word)[1].includes('ٔ'));
}
assert.deepStrictEqual(L.letters('بِـَٔايَـٰتِنَا'), ['ب','ء','ا','ي','ت','ن','ا']);
assert.deepStrictEqual(L.groups('بِـَٔايَـٰتِنَا'), ['بِ','ـَٔ','ا','يَـٰ','تِ','نَ','ا']);
assert.deepStrictEqual(L.letters('أَ إِ ؤُ ئِ ءَ'), ['أ','إ','ؤ','ئ','ء']);
let hamzaCards = 0;
for (const s of q.suras.filter(s=>s.sura>=78)) for (const a of s.ayas) {
  const expected = (a.t.match(/ـ[\u064b-\u065f\u0670\u06d6-\u06ed]*ٔ[\u064b-\u065f\u0670\u06d6-\u06ed]*/g)||[]);
  const actual = L.groups(a.t).filter(g=>g.startsWith('ـ')&&g.includes('ٔ'));
  assert.deepStrictEqual(actual, expected, s.sura+':'+a.n+' independent hamza cards');
  hamzaCards += actual.length;
}
assert(hamzaCards > 0);
console.log('Learn independent hamza cards:', hamzaCards);
// Every vowel/letter in these teaching cards must survive the grouping operation.
for (const s of q.suras.filter(s=>s.sura>=78)) for (const a of s.ayas) {
  const keep = text => Array.from(text).filter(c=>/[\u0621-\u063a\u0641-\u065f\u0670\u0671]/.test(c)).join('');
  assert.equal(keep(L.groups(a.t).join('')),keep(a.t),s.sura+':'+a.n+' mark preservation');
}
// Execute the real app handlers with a small DOM fixture. No browser/device claims.
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
  confirm:message=>{confirmations.push(message);return acceptConfirm;},
  fetch:async name=>({json:async()=>JSON.parse(fs.readFileSync(path.join(W,name),'utf8'))})};
vm.runInNewContext(fs.readFileSync(path.join(W,'app.js'),'utf8'),context);
function all(e) { return [e,...e.children.flatMap(all)]; }
function click(label, root=nodes.main) { const b=all(root).find(e=>e.tag==='button'&&e.textContent===label); assert(b,'button '+label); b.onclick(); }
setImmediate(()=>{
  const fontButton = label => all(nodes.main).find(e=>e.tag==='button'&&e.textContent===label);
  assert(nodes.main.textContent.includes('পড়ার লেখার আকার: মাঝারি'));
  failure=true; click('লেখা বড় করুন'); assert.equal(saved.sz,undefined);
  assert(nodes.main.textContent.includes('পড়ার লেখার আকার: মাঝারি')); failure=false; alerts=[];
  click('লেখা বড় করুন'); assert.equal(saved.sz,'2');
  click('লেখা বড় করুন'); assert.equal(saved.sz,'3'); assert(fontButton('লেখা বড় করুন').disabled);
  click('লেখা বড় করুন'); assert.equal(saved.sz,'3');
  click('শিখি'); assert(nodes.main.textContent.includes('পড়ার লেখার আকার: সবচেয়ে বড়'));
  assert.equal(context.document.documentElement.style['--az'],'48px');
  click('লেখা ছোট করুন'); click('লেখা ছোট করুন'); click('লেখা ছোট করুন');
  assert(fontButton('লেখা ছোট করুন').disabled); assert.equal(saved.sz,'0');
  click('লেখা ছোট করুন'); assert.equal(saved.sz,'0'); click('লেখা বড় করুন');
  click('সূরা');
  click('শিখি'); assert(nodes.main.textContent.includes('ধাপ 1/5'));
  click('অনুশীলন করেছি · পরের ধাপ'); assert.equal(JSON.parse(saved['learn-v1']).step,1);
  failure=true; click('অনুশীলন করেছি · পরের ধাপ'); assert.equal(JSON.parse(saved['learn-v1']).step,1); assert.equal(alerts.length,1); failure=false;
  // Rejected dropdown changes must not mislabel the old ayah or reader target.
  const choose = name => all(nodes.main).find(e=>e.attrs['aria-label']===name);
  const beforeFailure = nodes.main.textContent;
  failure=true;
  const failedSura=choose('শেখার সূরা'); failedSura.value='78'; failedSura.onchange();
  assert.equal(failedSura.value,112); assert.equal(choose('শেখার আয়াত').value,0);
  assert.equal(nodes.main.textContent,beforeFailure);
  const failedAyah=choose('শেখার আয়াত'); failedAyah.value='3'; failedAyah.onchange();
  assert.equal(failedAyah.value,0); assert.equal(failedSura.value,112);
  assert.deepStrictEqual(JSON.parse(saved['learn-v1']),{sura:112,ayah:0,step:1});
  assert.equal(alerts.length,3); failure=false;
  click('5 · আয়াত'); assert(nodes.main.textContent.includes(q.suras.find(s=>s.sura===112).ayas[0].t));
  click('পরের আয়াত শিখি'); assert.deepStrictEqual(JSON.parse(saved['learn-v1']),{sura:112,ayah:1,step:0});
  click('সূরা'); click('শিখি'); assert(nodes.main.textContent.includes('ধাপ 1/5'));
  assert.equal(JSON.parse(saved['learn-v1']).ayah,1);
  const select=all(nodes.main).find(e=>e.attrs['aria-label']==='শেখার সূরা'); select.value='114';select.onchange();
  assert.deepStrictEqual(JSON.parse(saved['learn-v1']),{sura:114,ayah:0,step:0});
  saved['learn-v1']='{"sura":114,"ayah":5,"step":4}';click('সূরা');click('শিখি');
  assert(nodes.main.textContent.includes('এই সূরার শেষ আয়াত')); assert(!all(nodes.main).some(e=>e.textContent==='পরের আয়াত শিখি'));
  // Exercise the real reader/audio handlers; this stub does not test sound or media decoding.
  saved['learn-v1']='{"sura":78,"ayah":5,"step":2}';click('সূরা');click('শিখি');
  assert(nodes.main.textContent.includes('তানবীনের মূল ধ্বনি'));
  click('পুরো আয়াত শুনি ও পড়ি');
  click('বানান ✗'); assert(nodes.main.textContent.includes('তানবীনের মূল ধ্বনি'));
  click('বানান ✓'); assert(!nodes.main.textContent.includes('তানবীনের মূল ধ্বনি'));
  const selected=all(nodes.main).find(e=>e.className==='ayah sel');
  assert(selected.textContent.includes(q.suras.find(s=>s.sura===78).ayas[5].t));
  // 5 Nov: "পুরো আয়াত শুনি ও পড়ি" itself starts the qari on that ayah (device test: it opened silently).
  assert.equal(audio.at(-1).src,'audio/husary/78_6.mp3'); assert(!audio.at(-1).paused);
  assert(all(nodes.bar).some(e=>e.tag==='button'&&e.textContent==='■ ক্বারী থামান'));
  nodes.back.onclick(); assert(audio.at(-1).paused); assert.equal(audio.at(-1).onended,null);
  click('শিখি'); assert(nodes.main.textContent.includes('ধাপ 3/5'));
  assert.deepStrictEqual(JSON.parse(saved['learn-v1']),{sura:78,ayah:5,step:2});
  const ayah=choose('শেখার আয়াত'); ayah.value='6'; ayah.onchange();
  assert.deepStrictEqual(JSON.parse(saved['learn-v1']),{sura:78,ayah:6,step:0});
  // Each sura's last ayah must prevent crossing into a nonexistent ayah.
  for (const s of q.suras.filter(s=>s.sura>=78)) {
    saved['learn-v1']=JSON.stringify({sura:s.sura,ayah:s.ayas.length-1,step:4});
    click('সূরা');click('শিখি');
    assert(nodes.main.textContent.includes(s.ayas.at(-1).t));
    assert(nodes.main.textContent.includes('এই সূরার শেষ আয়াত'));
    assert(!all(nodes.main).some(e=>e.tag==='button'&&e.textContent==='পরের আয়াত শিখি'));
  }
  // Playback labels and final-ayah completion use real handlers, with fake media only.
  saved['learn-v1']=JSON.stringify({sura:114,ayah:5,step:4});
  click('সূরা');click('শিখি');click('পুরো আয়াত শুনি ও পড়ি');
  assert.equal(audio.at(-1).src,'audio/husary/114_6.mp3'); click('■ ক্বারী থামান',nodes.bar); // starts the qari; stop it for the controls below
  let card=all(nodes.main).find(e=>e.className==='ayah sel');
  assert.equal(card.attrs['aria-pressed'],'true');
  assert(card.textContent.includes('বাছাই করা হয়েছে'));
  const beforeTap=audio.length; card.onclick();
  assert.equal(audio.length,beforeTap,'selecting an ayah does not auto-play');
  for (const [current,next] of [[1,3],[3,5],[5,10],[10,1]]) {
    const bangla=n=>String(n); // 5 Nov: counters are Latin digits
    click('শুনব '+bangla(current)+' বার',nodes.bar);
    assert(nodes.bar.textContent.includes('শুনব '+bangla(next)+' বার'));
  }
  click('শুনব 1 বার',nodes.bar); // three repeats on the final ayah
  click('ধীরে',nodes.bar); click('🔊 ক্বারী',nodes.bar);
  assert.equal(audio.at(-1).playbackRate,0.75);
  assert(nodes.bar.textContent.includes('আয়াত 6 · শুনছেন 1/3 বার · ধীরে'));
  audio.at(-1).onended();
  assert(nodes.bar.textContent.includes('শুনছেন 2/3 বার'));
  audio.at(-1).onended();
  assert(nodes.bar.textContent.includes('শুনছেন 3/3 বার'));
  audio.at(-1).onended();
  assert(nodes.bar.textContent.includes('সূরার শেষ আয়াত পর্যন্ত শোনা হয়েছে'));
  assert.equal(all(nodes.bar).find(e=>e.attrs.role==='status').tag,'div');
  click('🔊 ক্বারী',nodes.bar);
  assert(!nodes.bar.textContent.includes('শেষ আয়াত পর্যন্ত শোনা হয়েছে'));
  click('■ ক্বারী থামান',nodes.bar);
  assert(!nodes.bar.textContent.includes('শেষ আয়াত পর্যন্ত শোনা হয়েছে'),'manual stop is not completion');
  click('🔊 ক্বারী',nodes.bar); audio.at(-1).onerror();
  assert(!nodes.bar.textContent.includes('শেষ আয়াত পর্যন্ত শোনা হয়েছে'),'media error is not completion');
  // Selected marker follows another ayah; interrupted audio is stopped.
  click('🔊 ক্বারী',nodes.bar);
  const playing=audio.at(-1);
  all(nodes.main).find(e=>e.className==='ayah').onclick();
  assert(playing.paused); assert.equal(playing.onended,null);
  card=all(nodes.main).find(e=>e.className==='ayah sel');
  assert(card.textContent.includes('আয়াত নম্বর 1 · বাছাই করা হয়েছে'));
  assert.equal(all(nodes.main).filter(e=>e.attrs['aria-pressed']==='true'&&e.className.startsWith('ayah')).length,1);
  // Real Hifz handlers: cancel, failure, retry, repeated tap, reload and final lesson.
  nodes.back.onclick(); click('হিফজ');
  const mark=()=>all(nodes.bar).find(e=>e.tag==='button'&&e.textContent==='✓ পারলাম (আজকের সবক)');
  let markButton=mark(); assert(markButton);
  const initial=nodes.main.textContent;
  markButton.onclick(); assert.equal(saved.hifz,undefined); assert.equal(nodes.main.textContent,initial);
  assert(confirmations.at(-1).includes('না দেখে')); assert(confirmations.at(-1).includes('অ্যাপ শুদ্ধতা যাচাই করে না'));
  acceptConfirm=true; failure=true; const alertCount=alerts.length;
  markButton.onclick(); assert.equal(saved.hifz,undefined); assert.equal(alerts.length,alertCount+1);
  assert.equal(nodes.main.textContent,initial,'failed save cannot show success or advance');
  failure=false; markButton.onclick(); assert.equal(JSON.parse(saved.hifz).done,1);
  assert(nodes.main.textContent.includes('সেভ হয়েছে:')); assert(nodes.main.textContent.includes('পরের দিনের সবক'));
  assert(all(nodes.main).some(e=>e.attrs.role==='status'&&e.textContent.includes('নিজের মূল্যায়ন')));
  const count=confirmations.length; markButton.onclick();
  assert.equal(JSON.parse(saved.hifz).done,1); assert.equal(confirmations.length,count,'stale tap cannot mark twice');
  click('সূরা'); click('হিফজ'); assert(nodes.main.textContent.includes('সেভ হয়েছে:'));
  assert(all(nodes.bar).some(e=>e.disabled&&e.textContent==='✓ আজকের সবক হয়েছে'));
  // A past marking day unlocks exactly one new lesson, with today's heading.
  let yesterday=JSON.parse(saved.hifz); yesterday.markedOn='2000-01-01'; saved.hifz=JSON.stringify(yesterday);
  click('সূরা'); click('হিফজ'); assert(mark());
  assert(nodes.main.textContent.includes('সবক (নতুন)')); assert(!nodes.main.textContent.includes('সেভ হয়েছে:'));
  mark().onclick(); assert.equal(JSON.parse(saved.hifz).done,2);
  // An old handler cannot apply to a plan changed since it rendered.
  yesterday=JSON.parse(saved.hifz); yesterday.markedOn=''; saved.hifz=JSON.stringify(yesterday);
  click('সূরা'); click('হিফজ'); const stale=mark();
  const changed={...yesterday,size:1,order:'forward',done:0}; saved.hifz=JSON.stringify(changed);
  const confirmsBefore=confirmations.length; stale.onclick();
  assert.deepStrictEqual(JSON.parse(saved.hifz),changed); assert.equal(confirmations.length,confirmsBefore);
  saved.hifz=JSON.stringify({...changed,size:2,order:'reverse'});
  const plan=context.HifzPlan.buildLessons(q.suras.filter(s=>s.sura>=78),2,'reverse');
  const h=JSON.parse(saved.hifz); h.markedOn=''; h.done=plan.length-1; saved.hifz=JSON.stringify(h);
  click('সূরা'); click('হিফজ'); mark().onclick();
  assert.equal(JSON.parse(saved.hifz).done,plan.length);
  assert(nodes.main.textContent.includes('সব সবক শেষ')); assert(nodes.main.textContent.includes('সেভ হয়েছে:'));
  assert(!mark(),'finished plan cannot mark past its end');
  saved.sz='3';
  vm.runInNewContext(fs.readFileSync(path.join(W,'app.js'),'utf8'),context);
  setImmediate(()=>{
    assert(nodes.main.textContent.includes('পড়ার লেখার আকার: সবচেয়ে বড়'));
    assert.equal(context.document.documentElement.style['--az'],'48px');
    console.log('reading size PASS: limits, failed save, navigation, fresh app reload');
  });
  console.log('hifz self-mark PASS: cancel, failed save/retry, saved feedback, duplicate tap, reload, final lesson');
  console.log('playback PASS: Bangla repeat cycle, slow rate, final repeat completion, restart/stop/error, selected ayah');
  console.log('learn_path PASS: reader/audio return, 37 sura bounds, rejected dropdown labels, corrupt storage, exact Arabic, navigation, resume, failed save, sura reset, last ayah');
});
