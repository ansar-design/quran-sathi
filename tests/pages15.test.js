// 5 Nov 2026: 15-line Hafezi page view (Juz Amma). Data: www/data/pages15.json (tools/build_pages15.py, quran_android GPL-3.0).
// Checks: map is complete and ordered, Juz Amma pages cover every ayah exactly once, page view / player / back work.
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const W=path.join(__dirname,'../www');
const q=JSON.parse(fs.readFileSync(path.join(W,'data/quran.json'),'utf8'));
const pg=JSON.parse(fs.readFileSync(path.join(W,'data/pages15.json'),'utf8'));
assert(/GPL-3\.0/.test(pg.source));
assert.equal(pg.pages.length,610); assert.deepEqual(pg.pages[0],[2,1,1]); assert.deepEqual(pg.pages.at(-1),[611,113,1]);
pg.pages.forEach((x,i)=>{ if(i){const p=pg.pages[i-1]; assert(x[0]===p[0]+1 && (x[1]>p[1]||(x[1]===p[1]&&x[2]>p[2])),'order '+x);} });
const at=p=>pg.pages.find(x=>x[0]===p);
assert.deepEqual(at(587),[587,78,1]); assert.deepEqual(at(588),[588,78,28]); assert.deepEqual(at(598),[598,87,1]);  // = QUL Qudratullah (+1 title page)
// app harness
class E{constructor(t){this.tag=t;this.children=[];this.attrs={};this._text='';this.className='';}
 appendChild(e){this.children.push(e);e.parent=this;return e;} set textContent(t){this._text=t;this.children=[];}
 get textContent(){return this._text+this.children.map(e=>e.textContent).join('');}
 setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return this.attrs[k];} remove(){} get style(){return {setProperty(){}};} scrollIntoView(){} insertBefore(e){this.children.unshift(e);}}
const all=e=>[e,...e.children.flatMap(all)],tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const nodes=Object.fromEntries(['main','bar','title','back','about-btn'].map(k=>[k,new E('div')]));
 const audios=[],alerts=[],saved={};
 class Audio{constructor(s){this.src=s;this.paused=false;audios.push(this);} play(){return new Promise(()=>{});} pause(){this.paused=true;}}
 const c={console,Promise,Audio,LearnPath:require('../www/lib/learn_path'),HifzPlan:require('../www/lib/hifz_plan'),
  document:{body:new E('body'),getElementById:id=>nodes[id],createElement:t=>new E(t),createTextNode:t=>{let e=new E('text');e.textContent=t;return e;},documentElement:new E('html'),querySelector:()=>null},
  window:{scrollTo(){},addEventListener(){}},navigator:{},localStorage:{getItem:k=>k in saved?saved[k]:null,setItem:(k,v)=>saved[k]=v},alert:s=>alerts.push(s),
  setTimeout(){},setInterval:()=>1,clearInterval(){},fetch:async n=>({json:async()=>JSON.parse(fs.readFileSync(path.join(W,n),'utf8'))})};
 vm.runInNewContext(fs.readFileSync(path.join(W,'app.js'),'utf8'),c);for(let i=0;i<8;i++)await tick();
 const click=(label,root=nodes.main)=>{const b=all(root).find(e=>e.tag==='button'&&e.textContent.startsWith(label));assert(b,label);b.onclick();return b;};
 const ayahs=()=>all(nodes.main).filter(e=>e.tag==='span'&&/(^| )pgay( |$)/.test(e.className));
 click('হিফজ'); assert(nodes.main.textContent.includes('হাফেজি পাতা (15 লাইন)')); assert(nodes.main.textContent.includes('হাফেজি পাতা 6'),'lesson rows show page');
 click('📖 পাতা 611'); // default plan = reverse order -> first sabaq in An-Nas (page 611)
 assert.equal(nodes.title.textContent,'হাফেজি পাতা 611');
 assert.deepEqual(ayahs().map(b=>b.attrs['data-n']+''),['1','2','3','4','5','1','2','3','4','5','6']); // Falaq + Nas
 // every Juz Amma ayah sits on exactly one page
 let seen=0; const juzAmma=q.suras.filter(s=>s.sura>=78).reduce((n,s)=>n+s.ayas.length,0);
 nodes.back.onclick(); click('📖 পাতা');
 // walk all pages with the bar buttons, from the first page
 const sel=all(nodes.main).find(e=>e.tag==='select'); assert(sel); sel.value='587'; sel.onchange();
 assert.equal(nodes.title.textContent,'হাফেজি পাতা 587');
 assert(nodes.main.textContent.includes('সূরা আন-নাবা')); 
 for(let p=587;;p++){ seen+=ayahs().length; if(p===611)break; click('← পরের',nodes.bar); assert.equal(nodes.title.textContent,'হাফেজি পাতা '+(p+1)); }
 assert.equal(seen,juzAmma,'every Juz Amma ayah once');
 assert(all(nodes.bar).find(e=>e.textContent==='← পরের').disabled,'no page after 611');
 // player: bismillah before each sura start, then the ayat
 click('🔊 পাতা শুনুন',nodes.bar); assert.equal(audios.at(-1).src,'audio/husary/bismillah.mp3');
 audios.at(-1).onended(); assert.equal(audios.at(-1).src,'audio/husary/113_1.mp3');
 audios.at(-1).onended(); assert.equal(audios.at(-1).src,'audio/husary/113_2.mp3');
 click('■ থামুন',nodes.bar); assert(audios.at(-1).paused); assert(nodes.bar.textContent.includes('🔊 পাতা শুনুন'));
 // hide mode: ayat covered until tapped
 click('না দেখে পড়ি'); assert.equal(saved.pghide,'1'); assert(/pghid/.test(ayahs()[0].className));
 ayahs()[0].onclick(); assert(!/pghid/.test(ayahs()[0].className)); assert(/pghid/.test(ayahs()[1].className));
 click('না দেখে পড়ি ✓');
 // tap an ayah -> sura view at that ayah; header back returns to the same page
 ayahs()[2].onclick(); assert(nodes.title.textContent.includes('আল-ফালাক')); assert(nodes.main.textContent.includes('হাফেজি পাতা 611 শুরু'));
 nodes.back.onclick(); assert.equal(nodes.title.textContent,'হাফেজি পাতা 611');
 nodes.back.onclick(); assert.equal(nodes.title.textContent,'হিফজ পরিকল্পনা');
 assert.equal(alerts.length,0);
 console.log('pages15.test OK: 25 Juz Amma pages, '+seen+' ayat, player/hide/back');
})().catch(e=>{console.error(e);process.exit(1);});
