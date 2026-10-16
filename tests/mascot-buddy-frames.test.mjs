import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const directory=fileURLToPath(new URL('../dist/buddy/',import.meta.url));
const source=readFileSync(path.join(directory,'nong-nong-mai.js'),'utf8');
const reactions=['cheer','ponder','shocked','cry','sweat','yawn','hello'];
const flush=()=>new Promise(resolve=>setImmediate(resolve));

function harness({reduced=false,holdReaction=false}={}){
  const draws=[],held=[];let sequence=0;
  class FakeImage{
    set src(url){
      this.url=url;assert.ok(existsSync(fileURLToPath(url)),url);
      this.naturalWidth=512;
      const done=()=>this.onload();
      if(holdReaction&&url.endsWith('reactions-a-v3.webp'))held.push(done);else queueMicrotask(done);
    }
  }
  const ctx={setTransform(){},clearRect(){},save(){},restore(){},translate(){},scale(){},drawImage(...args){draws.push(args);}};
  const canvas=new EventTarget();canvas.getContext=()=>ctx;
  const context=vm.createContext({Image:FakeImage,URL,CustomEvent,console,devicePixelRatio:1,
    document:{baseURI:pathToFileURL(directory+path.sep).href,currentScript:null,hidden:false},
    matchMedia:()=>({matches:reduced,addEventListener(){},removeEventListener(){}}),
    requestAnimationFrame:()=>++sequence,cancelAnimationFrame(){}});
  vm.runInContext(source,context);
  const actor=new context.NongNongMai(canvas,{assetBase:pathToFileURL(directory+path.sep).href,width:640,height:440});
  return {actor,canvas,draws,held,data:context.NONG_NONG_MAI_DATA};
}

test('the actual map buddy has multiple drawings for every action and idle direction',async()=>{
  const h=harness();await h.actor.ready;
  for(const [state,variants] of Object.entries(h.data.clips)){
    if(state==='turn')continue; // turnTo assembles these orientation references.
    for(const [direction,clip] of Object.entries(variants)){
      assert.ok(new Set(clip.frames.map(f=>f.rect.join(','))).size>=4,`${state}/${direction}`);
      const atlas=h.data.atlases.find(a=>a.id===clip.atlas);assert.ok(atlas);
      for(const {rect:[x,y,w,height],duration} of clip.frames){
        assert.ok(x>=0&&y>=0&&x+w<=atlas.width&&y+height<=atlas.height,`${state}/${direction}: bounds`);
        assert.ok(duration>0);
      }
    }
  }
  h.actor.destroy();
});

test('all seven new reactions advance through four drawings, finish once and restore their facing',async()=>{
  const h=harness();await h.actor.ready;
  for(const name of reactions){
    await h.actor.face('NE');const seen=new Set();let ends=0;
    const onEnd=e=>{if(e.detail.state===name)ends++;};h.canvas.addEventListener('mascot:stateend',onEnd);
    await h.actor.react(name);assert.equal(h.actor.direction,'S');
    for(let i=0;i<40;i++){
      if(h.actor.state===name)seen.add(h.actor.clip.frames[h.actor.frame].rect.join(','));
      h.actor._update(.05);await flush();
    }
    assert.equal(seen.size,4,name);assert.equal(ends,1,name);assert.equal(h.actor.state,'idle');assert.equal(h.actor.direction,'NE');
    h.canvas.removeEventListener('mascot:stateend',onEnd);
  }
  h.actor.destroy();
});

test('the shocked reaction continues cycling while the visitor drags the buddy',async()=>{
  const h=harness();await h.actor.ready;await h.actor.play('shocked',{direction:'S',loop:true});
  const seen=new Set();let ends=0;h.canvas.addEventListener('mascot:stateend',()=>ends++);
  for(let i=0;i<160;i++){seen.add(h.actor.clip.frames[h.actor.frame].rect.join(','));h.actor._update(.05);}
  assert.equal(seen.size,4);assert.equal(h.actor.state,'shocked');assert.equal(ends,0);h.actor.destroy();
});

test('resting cycles use several seated drawings without replaying the stand-to-sit transition',async()=>{
  const h=harness();await h.actor.ready;await h.actor.react('sit');h.actor._update(.6);
  const seen=new Set();
  for(let i=0;i<240;i++){
    assert.ok(h.actor.frame>=h.actor.clip.loopStart);
    seen.add(h.actor.clip.frames[h.actor.frame].rect.join(','));h.actor._update(.05);
  }
  assert.equal(seen.size,4);assert.equal(h.actor.state,'sit');h.actor.destroy();
});

test('all idle directions animate and half-resolution website atlases crop correctly',async()=>{
  const h=harness();await h.actor.ready;
  for(const direction of h.data.directions){
    await h.actor.face(direction);const seen=new Set();
    for(let i=0;i<160;i++){
      const rect=Array.from(h.actor.clip.frames[h.actor.frame].rect);seen.add(rect.join(','));h.actor._render();
      assert.deepEqual(h.draws.at(-1).slice(1,5),rect.map(v=>v/2));h.actor._update(.05);
    }
    assert.ok(seen.size>=4,direction);
    if(['NW','W','SW'].includes(direction))assert.equal(h.actor.clip.mirror,true);
  }
  h.actor.destroy();
});

test('new cycles honor reduced motion by rendering a stable expression',async()=>{
  const h=harness({reduced:true});await h.actor.ready;
  for(const name of [...reactions,'sit']){
    await h.actor.play(name,{direction:'S',loop:true});
    const rect=Array.from(h.actor.clip.frames[h.actor.clip.stillFrame||0].rect).map(v=>v/2);
    for(let i=0;i<80;i++){h.actor._update(.05);h.actor._render();assert.deepEqual(h.draws.at(-1).slice(1,5),rect);}
  }
  h.actor.destroy();
});

test('a late new atlas cannot replace a newer animation; facing the same way remains animated idle',async()=>{
  const h=harness({holdReaction:true});await h.actor.ready;
  const late=h.actor.react('cheer');await flush();assert.equal(h.held.length,1);
  await h.actor.react('sit');h.held[0]();assert.equal(await late,false);assert.equal(h.actor.state,'sit');
  await h.actor.face('SE');await h.actor.turnTo('SE');assert.equal(h.actor.state,'idle');assert.ok(h.actor.clip.frames.length>=4);
  h.actor.destroy();
});

// the mascot kits live in a separate private repo; this comparison runs only where mascot-kits/ is checked out
const kitPresent=existsSync(fileURLToPath(new URL('../mascot-kits/living-v3/manifest.json',import.meta.url)));
test('the reusable V3 kit exposes the same clips and its preview includes every new reaction',{skip:!kitPresent&&'mascot-kits/ is not in this checkout'},async()=>{
  const h=harness();await h.actor.ready;
  const kit=JSON.parse(readFileSync(new URL('../mascot-kits/living-v3/manifest.json',import.meta.url),'utf8'));
  assert.deepEqual(JSON.parse(JSON.stringify(h.data.clips)),kit.clips);
  const html=readFileSync(new URL('../mascot-kits/living-v3/index.html',import.meta.url),'utf8');
  for(const name of reactions)assert.ok(html.includes(`data-action="${name}"`),name);
  for(const atlas of kit.atlases){assert.ok(existsSync(fileURLToPath(new URL('../mascot-kits/living-v3/'+atlas.file,import.meta.url))));}
  h.actor.destroy();
});
