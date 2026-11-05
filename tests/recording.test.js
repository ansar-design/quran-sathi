// Real app event handlers with deferred media promises; no device/audio-quality claims.
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const W=path.join(__dirname,'../www');
class E {
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this._text='';}
 appendChild(e){this.children.push(e);e.parent=this;return e;}
 set textContent(t){this._text=t;this.children=[];}
 get textContent(){return this._text+this.children.map(e=>e.textContent).join('');}
 setAttribute(k,v){this.attrs[k]=v;}
 remove(){this.parent.children=this.parent.children.filter(e=>e!==this);}
 get style(){return {setProperty(){}};}
 scrollIntoView(){} insertBefore(e){this.children.unshift(e);}
}
const all=e=>[e,...e.children.flatMap(all)],tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const nodes=Object.fromEntries(['main','bar','title','back','about-btn'].map(k=>[k,new E('div')]));
 const body=new E('body'),pending=[],recorders=[],alerts=[],timers=[],revoked=[],events={},saved={spell:'1','learn-v1':'{"sura":112,"ayah":0,"step":4}'};
 let failConstructor=false,failStart=false,url=0;
 const audios=[];
 class Audio {
  constructor(src){this.src=src;this.paused=false;audios.push(this);}
  play(){return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
  pause(){this.paused=true;}
 }
 class Recorder {
  constructor(st){if(failConstructor)throw Error('unsupported');this.st=st;this.state='inactive';recorders.push(this);}
  start(){if(failStart)throw Error('start failed');this.state='recording';}
  stop(){this.state='inactive';}
  finish(){this.ondataavailable({data:{size:10}});if(this.onstop)this.onstop();}
 }
 const c={console,Promise,Blob,Audio,MediaRecorder:Recorder,URL:{createObjectURL:()=>`blob:${++url}`,revokeObjectURL:u=>revoked.push(u)},
  LearnPath:require('../www/lib/learn_path'),HifzPlan:require('../www/lib/hifz_plan'),
  document:{body,getElementById:id=>nodes[id],createElement:t=>new E(t),createTextNode:t=>{let e=new E('text');e.textContent=t;return e;},documentElement:new E('html'),querySelector:()=>null},
  window:{MediaRecorder:Recorder,scrollTo(){},addEventListener:(n,f)=>events[n]=f},navigator:{mediaDevices:{getUserMedia:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}},
  localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v},alert:s=>alerts.push(s),
  setTimeout:f=>timers.push(f),setInterval:()=>1,clearInterval(){},
  fetch:async name=>({json:async()=>JSON.parse(fs.readFileSync(path.join(W,name),'utf8'))})};
 vm.runInNewContext(fs.readFileSync(path.join(W,'app.js'),'utf8'),c);await tick();
 function click(label,root=nodes.main){let b=all(root).find(e=>e.tag==='button'&&e.textContent===label);assert(b,label);b.onclick();}
 function open(){click('শিখি');click('পুরো আয়াত শুনি ও পড়ি');click('■ ক্বারী থামান',nodes.bar);} // 5 Nov: the button also starts the qari
 async function request(expectExplained=false){click(all(nodes.bar).some(e=>e.textContent==='● আবার রেকর্ড')?'● আবার রেকর্ড':'● রেকর্ড',nodes.bar);if(expectExplained)assert.equal(body.children.length,0,'no repeated privacy disclosure before accepting anything');if(body.children.length)click('ঠিক আছে',body);await tick();assert(nodes.bar.textContent.includes('মাইক্রোফোনের অপেক্ষায়'));return pending.at(-1);}
 function tapWord(){const card=all(nodes.main).find(e=>e.className==='sw tap');assert(card,'word card');card.onclick({stopPropagation(){}});}
 function blockedWord(){const count=audios.length,bar=nodes.bar.textContent;tapWord();assert.equal(audios.length,count,'no qari audio during mic lifecycle');assert.equal(nodes.bar.textContent,bar);assert(alerts.at(-1).includes('রেকর্ডিং থামান'));}
 function stream(){const track={stopped:0,stop(){this.stopped++;}};return {track,getTracks:()=>[track]};}
 open();let p=await request();blockedWord();click('বাতিল',nodes.bar);let st=stream();p.resolve(st);await tick();assert.equal(st.track.stopped,1);assert.equal(recorders.length,0);
 p=await request();nodes.back.onclick();st=stream();p.resolve(st);await tick();assert.equal(st.track.stopped,1);assert.equal(recorders.length,0);
 open();p=await request();all(nodes.main).find(e=>e.className==='ayah').onclick();st=stream();p.resolve(st);await tick();assert.equal(st.track.stopped,1);assert.equal(recorders.length,0);
 // Denial restores controls and gives an actionable message; retry works.
 p=await request();p.reject({name:'NotAllowedError'});await tick();assert(alerts.at(-1).includes('অনুমতি'));assert(nodes.bar.textContent.includes('● রেকর্ড'));
 // Error recovery must not repeat the privacy explanation.
 for(const name of ['NotReadableError','AbortError','SecurityError','NotFoundError','UnknownError']) {
  const count=alerts.length;p=await request(true);
  p.reject({name});await tick();assert.equal(alerts.length,count+1);
 }
 p=await request();st=stream();p.resolve(st);await tick();let r=recorders.at(-1);assert.equal(r.state,'recording');assert(nodes.bar.textContent.includes('■ থামুন'));blockedWord();
 click('■ থামুন',nodes.bar);assert(nodes.bar.textContent.includes('প্রস্তুত হচ্ছে'));blockedWord();r.finish();assert.equal(st.track.stopped,1);assert(nodes.bar.textContent.includes('▶ শুনুন'));
 // Word playback owns its controls and ignores replaced players' late callbacks.
 click('🔊 ক্বারী',nodes.bar);let qariAudio=audios.at(-1);tapWord();assert(qariAudio.paused);assert(nodes.bar.textContent.includes('■ শব্দ থামান'));assert(!nodes.bar.textContent.includes('■ ক্বারী থামান'));
 let wordOld=audios.at(-1);tapWord();let wordNew=audios.at(-1),beforeErrors=alerts.length;assert(wordOld.paused);
 wordOld.onended();wordOld.reject(Error('replaced'));await tick();assert(!wordNew.paused);assert.equal(alerts.length,beforeErrors);
 click('■ শব্দ থামান',nodes.bar);assert(wordNew.paused);assert(nodes.bar.textContent.includes('▶ শুনুন'));
 tapWord();audios.at(-1).onerror();assert(nodes.bar.textContent.includes('▶ শুনুন'));assert.equal(alerts.length,beforeErrors+1);
 tapWord();audios.at(-1).onended();assert(nodes.bar.textContent.includes('▶ শুনুন'));
 // A stopped player's delayed failure must not steal a newer player's controls.
 click('▶ শুনুন',nodes.bar);let oldAudio=audios.at(-1),alertCount=alerts.length;
 click('■ থামুন',nodes.bar);assert(oldAudio.paused);
 click('▶ শুনুন',nodes.bar);let newAudio=audios.at(-1);
 oldAudio.reject(Error('interrupted'));await tick();
 assert.equal(alerts.length,alertCount);assert(nodes.bar.textContent.includes('■ থামুন'));
 click('■ থামুন',nodes.bar);assert(newAudio.paused);
 // Current failure still restores retry and reports the problem.
 click('▶ শুনুন',nodes.bar);audios.at(-1).reject(Error('decode'));await tick();
 assert.equal(alerts.length,alertCount+1);assert(nodes.bar.textContent.includes('▶ শুনুন'));
 // Navigation ignores late errors without redrawing the abandoned practice bar.
 click('▶ শুনুন',nodes.bar);oldAudio=audios.at(-1);nodes.back.onclick();
 const leftBar=nodes.bar.textContent;alertCount=alerts.length;
 oldAudio.reject(Error('interrupted'));await tick();
 assert(oldAudio.paused);assert.equal(nodes.bar.textContent,leftBar);assert.equal(alerts.length,alertCount);open();all(nodes.main).find(e=>e.className==='ayah').onclick();
 // Unsupported recorder/start failures must release hardware and preserve the previous take.
 for(const mode of ['constructor','start']){failConstructor=mode==='constructor';failStart=mode==='start';p=await request();st=stream();p.resolve(st);await tick();assert.equal(st.track.stopped,1);assert(nodes.bar.textContent.includes('▶ শুনুন'));assert.equal(revoked.length,0);failConstructor=failStart=false;}
 // Replacement happens on completion, and old cap callback cannot stop a newer recorder.
 p=await request();st=stream();p.resolve(st);await tick();r=recorders.at(-1);timers[0]();assert.equal(r.state,'recording');click('■ থামুন',nodes.bar);r.finish();assert.deepEqual(revoked,['blob:1']);
 p=await request();st=stream();p.resolve(st);await tick();r=recorders.at(-1);timers.at(-1)();assert.equal(r.state,'inactive');r.finish();assert(nodes.bar.textContent.includes('▶ শুনুন'));
 // Pagehide must pause private playback before revoking its blob and ignore late failure.
 click('▶ শুনুন',nodes.bar);oldAudio=audios.at(-1);alertCount=alerts.length;
 events.pagehide();assert(oldAudio.paused);oldAudio.reject(Error('interrupted'));await tick();
 assert.equal(alerts.length,alertCount);
 // Qari playback is also stopped and its continuation handlers detached on pagehide.
 nodes.back.onclick();open();click('🔊 ক্বারী',nodes.bar);oldAudio=audios.at(-1);
 events.pagehide();assert(oldAudio.paused);assert.equal(oldAudio.onended,null);assert.equal(oldAudio.onerror,null);
 oldAudio.reject(Error('interrupted'));await tick();nodes.back.onclick();open();
 // Rejected Bismillah and ayah playback reports once, pauses, and supports retry.
 for(const bism of [true,false]) {
  click('🔊 ক্বারী',nodes.bar);let intro=audios.at(-1);
  if(!bism) intro.onended();
  const failed=audios.at(-1), count=alerts.length, lateError=failed.onerror;
  failed.reject({name:'NotAllowedError'});await tick();
  assert(failed.paused);assert.equal(alerts.length,count+1);assert(alerts.at(-1).includes('আবার ক্বারী'));
  assert(nodes.bar.textContent.includes('🔊 ক্বারী'));lateError();assert.equal(alerts.length,count+1);
  click('🔊 ক্বারী',nodes.bar);const retry=audios.at(-1);assert(!retry.paused);
  failed.reject(Error('late'));await tick();assert(!retry.paused);click('■ ক্বারী থামান',nodes.bar);
 }
 // Closing the page invalidates pending permission and releases any late stream.
 p=await request();events.pagehide();st=stream();p.resolve(st);await tick();assert.equal(st.track.stopped,1);assert.equal(url,3);
 // Active pagehide discards queued final data rather than recreating a take.
 nodes.back.onclick();open();p=await request();st=stream();p.resolve(st);await tick();r=recorders.at(-1);events.pagehide();r.finish();assert.equal(url,3);assert(st.track.stopped>=1);
 nodes.back.onclick();open();p=await request();st=stream();p.resolve(st);await tick();r=recorders.at(-1);click('■ থামুন',nodes.bar);events.pagehide();r.finish();assert.equal(url,3);assert(st.track.stopped>=1);
 console.log('recording.test OK: delayed permission, cancel/back/ayah/pagehide, denial/retry, cleanup, preserved takes, cap isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
