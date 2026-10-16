// น้องน่องไม้ (Nong Nong Mai) lives on the map. The drawing and the eight-way walking come from the engine in
// buddy/nong-nong-mai.js; this file is his mind.
//  - Needs: energy, boredom and a wish for company rise and fall with what he does.
//  - Time: the Bangkok day is split into seven slots (dawn … night), each with its own thoughts and favourite
//    activities; weekends add a few more. On the hour he says what time it is.
//  - Free time: he picks an activity by weighted chance (slot × needs), from a stroll to jogging laps, stretching,
//    napping, star-gazing or walking over to a pin on the map and reading its name.
//  - Visitor: he can be carried anywhere on the map, swung (he tilts and gets dizzy if shaken), thrown (he slides and
//    bounces off the edges) and dropped on a pin (he reads it). He also reacts to clicks, choices, saves and searches.
// What he says is feelings, invitations or what the map itself shows (a pin's name, a cluster's count); never a claim
// about a place that the data does not hold.
import {getLang} from './i18n.js';
import {bangkokMinutes} from './core.js';

const KEY='paipak:buddy';
const BASE=new URL('./buddy/',import.meta.url).href;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=list=>list[Math.floor(Math.random()*list.length)];
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const still=()=>Boolean(reduceMotion?.matches);

// ---- time of day ------------------------------------------------------------------------------------------------
// seven slots of the Bangkok day; boundaries in minutes after midnight
const SLOTS=[['dawn',5*60],['morning',7*60],['noon',11*60],['afternoon',13*60],['evening',16*60],['dusk',19*60],['night',22*60]];
function slotNow(){const m=bangkokMinutes(new Date());let id='night';for(const [name,from] of SLOTS)if(m>=from)id=name;return id;}
const bangkokHour=()=>Math.floor(bangkokMinutes(new Date())/60);
const isWeekend=()=>['Sat','Sun'].includes(new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'Asia/Bangkok'}).format(new Date()));

// ---- what he says: [Thai, English] -------------------------------------------------------------------------------
export const LINES={
  dawn:[['อรุณสวัสดิ์!','Good morning!'],['ตื่นเช้าแล้ว ยืดเส้นก่อน','Up early, stretch first'],['ใครตื่นเช้าเหมือนกันบ้าง','Anyone else up early?'],['วิ่งก่อนแดดแรงกัน','A run before the sun gets strong']],
  morning:[['สายแล้ว ไปเดินสวนกันไหม','Late morning, park walk?'],['วันนี้จะไปไหนดีนะ','Where shall we go today?'],['ขอวิ่งอีกสักรอบ','One more lap'],['ฮัมเพลงไปเดินไป','Humming as I walk']],
  noon:[['เที่ยงแล้ว หิวข้าวจัง','Noon already, I’m hungry'],['พักกลางวันหาที่ร่ม ๆ ดีกว่า','Somewhere shady for lunch break'],['กินอะไรดีนะ…','What to eat…'],['ยิมในร่มก็ดีนะ','An indoor gym works too']],
  afternoon:[['บ่ายแล้ว ง่วงนิด ๆ','Afternoon, a bit drowsy'],['ขอนั่งพักแป๊บ','Let me sit a moment'],['งีบสักห้านาที…','Five-minute nap…'],['ใกล้เย็นแล้ว เตรียมไปสวนกัน','Nearly evening, park time soon']],
  evening:[['เลิกงานแล้ว ไปขยับตัวกัน!','Work’s over, let’s move!'],['เย็นนี้ไปวิ่งกัน','Run this evening?'],['ไปเดินรับลมเย็นกัน','Evening breeze walk?'],['ชวนเพื่อนไปออกกำลังกาย','Bring a friend to work out']],
  dusk:[['ค่ำแล้ว เดินช้า ๆ ก็พอ','Evening now, a slow walk is enough'],['พรุ่งนี้ไปไหนดีนะ','Where to tomorrow?'],['วันนี้เหนื่อยไหม','Tired today?'],['ดึกแล้ว เลือกที่ยังเปิดอยู่นะ','Pick somewhere still open']],
  night:[['ดึกแล้ว ง่วงจัง…','So late, so sleepy…'],['อยากดูดาวจัง','I’d love to see the stars'],['นอนเร็วตื่นเช้านะ','Early to bed, early to rise'],['Zzz…','Zzz…']],
  weekend:[['วันหยุดแล้ว! ไปเที่ยวสวนกัน','It’s the weekend! Park trip?'],['เสาร์อาทิตย์นี้ไปไหนดี','Plans for the weekend?']],
  hello:[['หวัดดี! วันนี้ไปไหนดี','Hi! Where to today?'],['มาเลือกที่พักใจกัน','Let’s pick a place to unwind']],
  walk:[['เดินเล่นสักรอบ','Just a little stroll'],['ไปทางไหนดีนะ','Which way now?'],['ต้นไม้ก็เดินได้นะ','Yes, trees can walk']],
  run:[['วิ่งเหยาะ ๆ หน่อย','A quick jog!'],['ฮึบ ๆ','Hup hup!']],
  laps:[['วิ่งวนอีกรอบ!','Another lap!'],['อีกรอบเดียว!','Just one more!']],
  stretch:[['ยืดเส้นยืดสาย','Stretch it out'],['หนึ่ง สอง สาม สี่!','One, two, three, four!']],
  dance:[['เต้นสักหน่อย','A little dance'],['ดิ้น ๆ ~','Wiggle wiggle~']],
  tired:[['เหนื่อยจัง ขอพักแป๊บ','Phew, need a breather']],
  sit:[['ขอนั่งพักใต้ร่มตัวเองแป๊บ','Resting in my own shade'],['นั่งเฉย ๆ ก็ดีนะ','Sitting still is nice too']],
  sleep:[['Zzz…','Zzz…']],
  wake:[['อ๊ะ! ตื่นแล้ว ๆ','Oh! I’m awake'],['ง่วง… ขอนอนต่ออีกนิด','Sleepy… five more minutes']],
  look:[['มีอะไรตรงนั้นนะ','Something over there?'],['หืม…','Hmm…']],
  stargaze:[['อยากเห็นดาวจัง','I’d love to see the stars'],['ดวงจันทร์อยู่ไหนนะ','Where’s the moon?']],
  bored:[['เบื่อจัง หาอะไรทำดีกว่า','Bored… let’s find something to do'],['มีใครอยู่ไหม~','Anyone there~?']],
  follow:[['จะไปไหนเหรอ ไปด้วย!','Where are you going? Wait for me!']],
  visitPin:[['ตรงนี้คือ {name}','This one is {name}'],['เจอแล้ว {name}','Found it: {name}']],
  visitCluster:[['ตรงนี้มีตั้ง {n} แห่งแน่ะ','There are {n} places here'],['{n} แห่งรวมกันอยู่ตรงนี้','{n} places bunched up here']],
  tryIt:[['ลองกดดูสิ','Try tapping it']],
  pan:[['ไปดูแถวไหนกันเนี่ย','Where are we heading?'],['แผนที่เลื่อนไปเลื่อนมา','The map is on the move']],
  zoomIn:[['ซูมเข้าไปดูใกล้ ๆ','Zooming in close']],
  zoomOut:[['ซูมออกให้เห็นกว้าง ๆ','Zooming out wide']],
  poke:[['อุ๊ย! จั๊กจี้','Oops! That tickles'],['หวัดดี!','Hello!'],['เบา ๆ นะ ใบร่วง','Gently, my leaves!']],
  dodge:[['ขอโทษ ขวางทางอยู่หรือเปล่า','Sorry, am I in the way?']],
  grab:[['ว้าย! ตัวลอยแล้ว','Whoa, I’m flying!'],['จะพาไปไหนเนี่ย','Where are we going?'],['จั๊กจี้ ๆ','That tickles!']],
  holdLong:[['ปล่อยได้ยัง~','Put me down soon~?'],['ห้อยนานแล้วนะ','I’ve been dangling a while']],
  dizzy:[['เวียนหัว~ หยุดก่อน','So dizzy~ stop!'],['โลกหมุนติ้วเลย','The world is spinning']],
  thrown:[['ว้ายยย!','Wheee!'],['บินได้ด้วย!','I can fly!']],
  bump:[['โอ๊ย ชนขอบ','Ouch, the edge!']],
  drop:[['ถึงแล้ว ขอบคุณที่พามา','Here we are, thanks!'],['ตรงนี้ก็ดีนะ','This spot is nice']],
  back:[['กลับมาแล้ว! คิดถึงนะ','You’re back! Missed you']],
  saved:[['จดไว้ให้แล้ว!','Saved it!'],['เยี่ยม ไปกันเลย','Nice, let’s go']],
  open:[['ไปดูที่นี่กัน','Let’s look at this one'],['น่าไปไหมนะ','Worth a visit?']],
  empty:[['หาไม่เจอเลย ลองคำอื่นไหม','Nothing yet. Try another word?']],
  error:[['เน็ตหลุดหรือเปล่านะ','Is the internet down?']],
  intent:{walk:['ไปเดินเล่นกัน','Let’s go for a walk'],run:['ไปวิ่งกัน!','Let’s run!'],bike:['ปั่นจักรยานกัน','Let’s ride'],mind:['หายใจลึก ๆ…','Deep breaths…'],gym:['ยกเวทกัน!','Time to lift!'],kids:['ไปกันทั้งบ้าน','Bring the whole family'],all:['อะไรก็ได้ ตามใจเลย','Anything goes']}
};
// on the hour; special lines at the slot changes
const CHIME={6:['หกโมงเช้าแล้ว ตื่น ๆ!','6 a.m., rise and shine!'],12:['เที่ยงแล้ว! พักกินข้าวกัน','Noon! Lunch break'],17:['ห้าโมงเย็นแล้ว เลิกงานไปขยับตัวกัน','5 p.m., time to move after work'],22:['สี่ทุ่มแล้ว เตรียมนอนกัน','10 p.m., getting ready for bed']};
const hourLine=h=>[`${h} นาฬิกาแล้ว`,`It’s ${h}:00`];
const UI={label:['น้องน่องไม้ กดเพื่อทักทาย ลากไปวางตรงไหนก็ได้ หรือกดลูกศรเพื่อย้าย','Nong Nong Mai: select to say hi, drag him anywhere on the map, or use arrow keys'],hide:['ซ่อนน้องน่องไม้','Hide Nong Nong Mai'],show:['แสดงน้องน่องไม้','Show Nong Nong Mai']};
const say1=pair=>pair[getLang()==='en'?1:0];

// ---- state ------------------------------------------------------------------------------------------------------
let mascot=null,loading=null,enabled=true,stage,canvas,hit,bubble,toggle,panel;
let busy=false,nextAt=0,lastSaid=0,bubbleTimer=0,hiddenAt=0,pointer=null,hoverTimer=0,lookedAt=0,holdCancel=null,awayGreeted=true;
let lastHour=null,zone={left:0,right:0,top:0,bottom:0},fling=null,drag=null,lastActivity='';
const mood={energy:.8,boredom:.3,social:.6};
try{enabled=localStorage.getItem(KEY)!=='off';}catch{}

function say(key,{chance=1,force=false,vars={}}={}){
  const lines=typeof key==='string'?LINES[key]:Array.isArray(key[0])?key:[key];
  if(!lines||!bubble||Math.random()>chance)return;
  const now=Date.now();if(!force&&now-lastSaid<9000)return;
  lastSaid=now;
  bubble.textContent=say1(pick(lines)).replace(/\{(\w+)\}/g,(m,k)=>vars[k]??m);
  bubble.hidden=false;bubble.classList.remove('is-out');
  clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>{bubble.classList.add('is-out');bubbleTimer=setTimeout(()=>bubble.hidden=true,250);},3600);
}
// a pause that a reaction to the visitor can cut short
function hold(ms){return new Promise(resolve=>{const timer=setTimeout(done,ms);function done(){clearTimeout(timer);holdCancel=null;resolve();}holdCancel=done;});}
function interrupt(){holdCancel?.();}
// play a one-off clip and wait for it to finish (or give up after a few seconds)
function playOnce(state){
  return new Promise(resolve=>{
    const finish=()=>{canvas.removeEventListener('mascot:stateend',on);clearTimeout(timer);resolve();};
    const on=event=>{if(event.detail.state===state)finish();};
    const timer=setTimeout(finish,6000);
    canvas.addEventListener('mascot:stateend',on);
    mascot.react(state).then(ok=>{if(!ok)finish();},finish);
  });
}
const DIRS=['E','SE','S','SW','W','NW','N','NE'];
const towards=(dx,dy)=>DIRS[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
// a spot inside his walking zone (between the map tools and the legend), at least minDistance away
function zoneSpot(minDistance=110){
  const {left,right,top,bottom}=zone;
  for(let i=0;i<10;i++){const x=rnd(left,right),y=rnd(top,bottom);if(Math.hypot(x-mascot.position.x,y-mascot.position.y)>=minDistance)return {x,y};}
  return {x:rnd(left,right),y:bottom};
}
const inZone=p=>p.x>=zone.left-1&&p.x<=zone.right+1&&p.y>=zone.top-1&&p.y<=zone.bottom+1;
const sitting=()=>['sit','sleep'].includes(mascot.state);
const visible=()=>stage&&!document.hidden&&stage.offsetWidth>0&&getComputedStyle(panel).visibility!=='hidden';
const stageRect=()=>stage.getBoundingClientRect();
async function getUp(){if(sitting()){const slept=mascot.state==='sleep';await mascot.stop();if(slept)say('wake',{force:true});}}
async function walkTo(spot,run=false){await getUp();return mascot.moveTo(spot.x,spot.y,{run});}

// pins and clusters on the map that sit inside his zone, read straight from the map (name = the pin's title)
function mapPins(){
  const r=stageRect();
  return [...panel.querySelectorAll('.leaflet-marker-icon.pin-wrap,.leaflet-marker-icon.cluster-wrap')].map(el=>{
    const b=el.getBoundingClientRect();if(!b.width)return null;
    const cluster=el.classList.contains('cluster-wrap');
    return {x:b.left+b.width/2-r.left,y:b.bottom-r.top+Math.min(28,mascot.size*.3),name:el.getAttribute('title')||el.querySelector('.pin-label')?.textContent||'',n:cluster?Number((el.textContent.match(/\d+/)||[])[0]):0,cluster};
  }).filter(p=>p&&(p.cluster?p.n>0:p.name)&&p.x>zone.left&&p.x<zone.right&&p.y>zone.top&&p.y<zone.bottom+40);
}
function readPin(p){
  if(!p)return false;
  if(p.cluster)say('visitCluster',{force:true,vars:{n:p.n}});else say('visitPin',{force:true,vars:{name:p.name}});
  return true;
}
// the pin or cluster under a point (used when he is dropped)
function pinAt(x,y){return mapPins().filter(p=>Math.hypot(p.x-x,p.y-y)<Math.max(36,mascot.size*.4)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];}

// ---- activities ---------------------------------------------------------------------------------------------------
const ACTIVITIES={
  async stroll(){say('walk',{chance:.3});await walkTo(zoneSpot());},
  async jog(){say('run',{chance:.35});await walkTo(zoneSpot(200),true);if(mood.energy<.4){say('tired',{force:true});await playOnce('tired');await playOnce('sweat');}},
  async laps(){
    say('laps',{chance:.6});
    const {left,right,top,bottom}=zone,corners=[{x:left,y:bottom},{x:left,y:top},{x:right,y:top},{x:right,y:bottom}];
    const start=Math.floor(Math.random()*4);
    for(let i=0;i<5;i++){const r=await walkTo(corners[(start+i)%4],true);if(r&&!r.arrived)return;}
    say('tired',{force:true});await playOnce('sweat');
  },
  async stretch(){say('stretch',{chance:.7});await getUp();await playOnce('cheer');await playOnce('nod');await playOnce('jump');await playOnce('cheer');},
  async dance(){say('dance',{chance:.7});await getUp();for(const s of ['hello','jump','cheer','shake','jump','happy'])await playOnce(s);},
  async sit(){await mascot.react('sit');say('sit',{chance:.35});await hold(rnd(7000,15000));if(mascot.state==='sit')await mascot.stop();},
  async nap(){
    await playOnce('yawn');await mascot.react('sleep');say('sleep',{chance:.6});
    const slot=slotNow();await hold(slot==='night'?rnd(25000,45000):rnd(10000,18000));
    if(mascot.state==='sleep'){await mascot.stop();if(Math.random()<.5)await playOnce('yawn');say('wake',{chance:.5});}
  },
  async look(){
    for(const d of [pick(DIRS),pick(DIRS)]){await mascot.turnTo(d);await hold(rnd(700,1400));}
    say('look',{chance:.3});await mascot.turnTo('S');
  },
  async ponder(){await playOnce('ponder');say(slotNow(),{chance:.7});if(Math.random()<.4)await playOnce('nod');},
  async visit(){
    const pins=mapPins();if(!pins.length)return ACTIVITIES.stroll();
    const p=pick(pins);const r=await walkTo({x:clamp(p.x,zone.left,zone.right),y:clamp(p.y,zone.top,zone.bottom)},Math.random()<.25);
    if(r&&!r.arrived)return;
    await mascot.turnTo(towards(p.x-mascot.position.x,-1));await playOnce(Math.random()<.5?'curious':'ponder');readPin(p);
    if(Math.random()<.3){await hold(1800);say('tryIt',{force:true});await playOnce('hello');}
  },
  async stargaze(){await getUp();await mascot.turnTo('N');say('stargaze',{chance:.8});await hold(rnd(4000,7000));await mascot.turnTo('S');await mascot.react('sit');await hold(rnd(5000,9000));if(mascot.state==='sit')await mascot.stop();},
  async bored(){say('bored',{force:true});await playOnce('shake');if(Math.random()<.5)await playOnce('sad');mood.boredom=clamp(mood.boredom-.2);},
  async greet(){await getUp();await playOnce(Math.random()<.5?'wave':'hello');say(isWeekend()&&Math.random()<.4?'weekend':Math.random()<.5?'hello':slotNow(),{force:true});mood.social=0;},
  async follow(){
    if(!pointer)return;say('follow',{force:true});
    await walkTo({x:clamp(pointer.x,zone.left,zone.right),y:clamp(pointer.y+mascot.size*.6,zone.top,zone.bottom)},true);await playOnce('hello');mood.social=0;
  },
  async home(){await walkTo(zoneSpot(0));}   // back into his zone after being carried out of it
};
// favourite things per slot (relative weights; needs scale them below)
const HABITS={
  dawn:{stretch:3,jog:2,laps:1.5,stroll:1.5,look:1,greet:1,ponder:.6},
  morning:{jog:2,laps:1.5,stroll:2,visit:1.6,stretch:1,greet:1,look:1,ponder:1},
  noon:{sit:2.5,ponder:2,stroll:1,visit:1.6,look:1,nap:.8,greet:.6},
  afternoon:{nap:2,sit:2,stroll:1.5,visit:1.6,ponder:1,look:1,jog:.4},
  evening:{jog:2.5,laps:2,stroll:2,dance:1,greet:1.5,visit:1.2,stretch:.8},
  dusk:{stroll:2,sit:1.5,visit:1.6,ponder:1.5,dance:.6,look:1,nap:.4,greet:.8},
  night:{nap:4,sit:1.5,stargaze:1.2,stroll:.5,ponder:.6}
};
const ACTIVE=new Set(['jog','laps','dance','stretch']),RESTFUL=new Set(['sit','nap']);
function chooseActivity(){
  const slot=slotNow(),near=pointer&&Date.now()-pointer.t<3000;
  const weights={...HABITS[slot]};
  if(isWeekend()){weights.visit=(weights.visit||0)+1;weights.dance=(weights.dance||0)+.6;weights.greet=(weights.greet||0)+.5;}
  if(mood.boredom>.65)weights.bored=1.5;
  if(mood.social>.7&&near){weights.follow=1.2;weights.greet=(weights.greet||0)+1.5;}
  for(const k of Object.keys(weights)){
    if(ACTIVE.has(k))weights[k]*=mood.energy<.35?.15:.4+mood.energy;
    if(RESTFUL.has(k))weights[k]*=.5+(1-mood.energy)*2;
    if(k===lastActivity)weights[k]*=.35;   // rarely the same thing twice in a row
  }
  if(still())for(const k of Object.keys(weights))if(!['ponder','greet','bored'].includes(k))delete weights[k];
  const entries=Object.entries(weights).filter(([,w])=>w>0),total=entries.reduce((s,[,w])=>s+w,0);
  let r=Math.random()*total;for(const [k,w] of entries)if((r-=w)<=0)return k;
  return entries[0]?.[0]||'ponder';
}
function think(){
  if(!mascot||!enabled)return;
  if(!visible()){mascot.pause();return;}
  if(mascot.paused)mascot.resume();
  const s=mascot.state,k=.5;
  mood.energy=clamp(mood.energy+(s==='walk'?-.012:s==='run'?-.035:s==='sit'?.025:s==='sleep'?.045:.006)*k);
  mood.boredom=clamp(mood.boredom+(s==='idle'?.014:-.02)*k);
  mood.social=clamp(mood.social+.004*k);
  // on the hour
  const h=bangkokHour();
  if(lastHour!==null&&h!==lastHour&&!drag&&!fling)buddyReact('chime',h);
  lastHour=h;
  if(drag||fling)return;
  // he notices the visitor's pointer nearby and turns towards it
  if(!busy&&s==='idle'&&pointer&&Date.now()-pointer.t<1500&&Date.now()-lookedAt>2500){
    const dx=pointer.x-mascot.position.x,dy=pointer.y-(mascot.position.y-mascot.size*.5);
    if(Math.hypot(dx,dy)<280){const d=towards(dx,dy);if(d!==mascot.direction){lookedAt=Date.now();mascot.turnTo(d).catch(()=>{});}}
  }
  if(busy||Date.now()<nextAt||s!=='idle')return;
  const name=!inZone(mascot.position)&&!still()&&Math.random()<.6?'home':chooseActivity();
  lastActivity=name;busy=true;
  ACTIVITIES[name]().catch(()=>{}).finally(()=>{busy=false;nextAt=Date.now()+rnd(2500,8000)*(slotNow()==='night'?1.7:1);});
}

// ---- reactions to the visitor ------------------------------------------------------------------------------------
export function buddyReact(kind,arg){
  if(!mascot||!enabled||!visible()||drag||fling)return;
  interrupt();
  const run=async()=>{
    if(kind!=='pan'&&kind!=='zoom')await getUp();
    if(kind==='intent'){
      const line=LINES.intent[arg];if(line)say(line,{force:true});
      if(still())return;
      if(arg==='run'||arg==='bike'||arg==='walk')await walkTo(zoneSpot(160),arg!=='walk');
      else if(arg==='gym'){await playOnce('jump');await playOnce('cheer');}
      else if(arg==='mind'){await mascot.react('sit');await hold(4000);if(mascot.state==='sit')await mascot.stop();}
      else await playOnce('wave');
    }
    else if(kind==='saved'){say('saved',{force:true});await playOnce('jump');await playOnce('cheer');await playOnce('happy');mood.social=0;}
    else if(kind==='open'){say('open',{chance:.5});await playOnce(Math.random()<.5?'curious':'ponder');}
    else if(kind==='empty'){say('empty',{force:true});await playOnce('shake');await playOnce('sad');}
    else if(kind==='error'){say('error',{force:true});await playOnce('cry');}
    else if(kind==='poke'){say('poke',{force:true});await playOnce('shocked');await playOnce('surprised');await playOnce('wave');mood.social=0;mood.boredom=clamp(mood.boredom-.3);}
    else if(kind==='dodge'){say('dodge',{force:true});if(!still()){const x=mascot.position.x+(mascot.position.x>mascot.width/2?-1:1)*Math.min(180,mascot.width*.35);await mascot.moveTo(x,mascot.position.y);}}
    else if(kind==='back'){say('back',{force:true});await playOnce('surprised');await playOnce('hello');}
    else if(kind==='chime'){say(CHIME[arg]||hourLine(arg),{force:true});await playOnce(CHIME[arg]?'cheer':'nod');}
    else if(kind==='pan'){if(mascot.state==='idle')await mascot.turnTo(arg||'S');say('pan',{chance:.5});}
    else if(kind==='zoom'){say(arg==='in'?'zoomIn':'zoomOut',{chance:.5});await playOnce(arg==='in'?'curious':'surprised');}
  };
  busy=true;run().catch(()=>{}).finally(()=>{busy=false;nextAt=Date.now()+rnd(4000,8000);});
}

// ---- stage: the whole map; his walking zone sits between the map tools and the legend -----------------------------
function layout(){
  if(!stage)return;
  const box=panel.getBoundingClientRect();if(!box.width)return;
  const w=stage.clientWidth,h=stage.clientHeight;
  if(mascot&&w&&h){mascot.size=w<520?84:112;mascot.resize(w,h);}
  const s=mascot?.size||100,tr=panel.querySelector('.map-tools')?.getBoundingClientRect();
  const floor=[...panel.querySelectorAll('.map-legend,.map-search')].map(el=>el.getBoundingClientRect()).filter(r=>r.height).reduce((top,r)=>Math.min(top,r.top),box.bottom-16);
  const top=Math.max(tr&&tr.height?tr.bottom-box.top+8:0,h*.38)+s*.95;
  zone={left:s*.6,right:Math.max(s*.6,w-s*.6),top:Math.min(top,floor-box.top-12),bottom:floor-box.top-6};
}
function frame(now){
  requestAnimationFrame(frame);
  if(!mascot||!visible())return;
  // a throw: slide with friction, bounce off the edges of the map
  if(fling){
    const dt=Math.min(.05,(now-(fling.t||now))/1000);fling.t=now;
    const b=mascot._bounds(mascot.position.x+fling.vx*dt,mascot.position.y+fling.vy*dt);
    if(b.x!==mascot.position.x+fling.vx*dt){fling.vx*=-.55;fling.bumps++;}
    if(b.y!==mascot.position.y+fling.vy*dt){fling.vy*=-.55;fling.bumps++;}
    mascot.position=b;const f=Math.pow(.18,dt);fling.vx*=f;fling.vy*=f;
    mascot.tilt=(mascot.tilt||0)+fling.vx*dt*.012;
    if(fling.bumps&&!fling.said){fling.said=true;say('bump',{force:true});}
    if(Math.hypot(fling.vx,fling.vy)<40)land();
  }else if(!drag&&mascot.tilt){mascot.tilt*=.82;if(Math.abs(mascot.tilt)<.01)mascot.tilt=0;}
  const {x,y}=mascot.position,s=mascot.size;
  hit.style.transform=`translate(${Math.round(x-s*.32)}px,${Math.round(y-s*.92)}px)`;hit.style.width=`${Math.round(s*.64)}px`;hit.style.height=`${Math.round(s*.92)}px`;
  if(!bubble.hidden){
    const bw=bubble.offsetWidth||120,bh=bubble.offsetHeight||30,W=stage.clientWidth;
    const bx=clamp(x,bw/2+8,W-bw/2-8),above=y-s*.95;
    bubble.style.left=`${Math.round(bx)}px`;bubble.style.top=`${Math.round(above-bh<8?y+bh+14:above)}px`;
  }
}
// after a throw or a drop: dizzy if shaken or thrown hard, then read the pin he landed on
async function land(){
  const thrown=fling,shook=drag?.shakes>=4||thrown?.shakes>=4;fling=null;
  busy=true;mascot.tilt=0;
  try{
    if(shook||(thrown&&thrown.speed>1400)){say('dizzy',{force:true});await playOnce('shake');await playOnce('sweat');}
    const p=pinAt(mascot.position.x,mascot.position.y);
    if(p){readPin(p);await playOnce('ponder');}
    else{if(!shook&&!thrown)say('drop',{force:true});if(still())await mascot.stop();else{await playOnce('cheer');await playOnce('happy');}}
  }catch{}
  mood.social=0;mood.boredom=clamp(mood.boredom-.3);
  busy=false;nextAt=Date.now()+rnd(3000,6000);
}
function syncToggle(){
  document.body.classList.toggle('buddy-on',enabled);
  if(toggle)toggle.textContent=say1(enabled?UI.hide:UI.show);
  if(hit)hit.setAttribute('aria-label',say1(UI.label));
  if(stage)stage.hidden=!enabled;
}
export function setBuddyEnabled(value){
  enabled=Boolean(value);try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}
  syncToggle();
  if(enabled)startBuddy();else{mascot?.pause();interrupt();if(bubble)bubble.hidden=true;}
}
export const syncBuddyLanguage=syncToggle;
// Reaction clips are authored multi-frame cycles in buddy/nong-nong-mai.js.
function loadEngine(){
  if(window.NongNongMai)return Promise.resolve();
  loading??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=BASE+'nong-nong-mai.js';s.onload=resolve;s.onerror=reject;document.head.append(s);});
  return loading;
}
function bindCarry(){
  // a press without moving is a poke; a press and move picks him up. He can be carried anywhere on the map, tilts
  // with the swing, gets dizzy when shaken, and a quick release throws him.
  let dragged=false;
  hit.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    clearTimeout(hoverTimer);dragged=false;fling=null;
    const r=stageRect();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:mascot.position.x-(event.clientX-r.left),dy:mascot.position.y-(event.clientY-r.top),lifted:false,samples:[],shakes:0,lastDir:0,since:0,heldTimer:0};
    hit.setPointerCapture(event.pointerId);event.preventDefault();
  });
  hit.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    if(!drag.lifted){
      if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<6)return;
      drag.lifted=true;dragged=true;interrupt();busy=true;hit.classList.add('is-held');drag.since=Date.now();
      mascot.play('shocked',{direction:'S',loop:true}).catch(()=>{});say('grab',{force:true});
      drag.heldTimer=setTimeout(()=>{if(drag?.lifted)say('holdLong',{force:true});},4000);
    }
    const r=stageRect(),t=performance.now();
    mascot.position=mascot._bounds(event.clientX-r.left+drag.dx,event.clientY-r.top+drag.dy);
    drag.samples.push({x:event.clientX,y:event.clientY,t});while(drag.samples.length>2&&t-drag.samples[0].t>90)drag.samples.shift();
    const a=drag.samples[0],vx=drag.samples.length>1?(event.clientX-a.x)/Math.max(1,t-a.t):0;
    if(!still())mascot.tilt=clamp(vx*.35,-.5,.5);
    // shaking: quick changes of horizontal direction
    const dir=Math.abs(vx)>.6?Math.sign(vx):0;
    if(dir&&drag.lastDir&&dir!==drag.lastDir){drag.shakes++;if(drag.shakes===4)say('dizzy',{force:true});}
    if(dir)drag.lastDir=dir;
  });
  const release=event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const d=drag;clearTimeout(d.heldTimer);hit.classList.remove('is-held');
    if(!d.lifted){drag=null;return;}
    const a=d.samples[0],b=d.samples.at(-1),dt=b&&a?Math.max(1,b.t-a.t):1;
    const vx=b&&a?(b.x-a.x)/dt*1000:0,vy=b&&a?(b.y-a.y)/dt*1000:0,speed=Math.hypot(vx,vy);
    drag=null;
    if(!still()&&speed>700&&performance.now()-b.t<80){
      fling={vx,vy,speed,bumps:0,said:false,shakes:d.shakes,t:0};say('thrown',{force:true});
      mascot.play('surprised',{direction:'S',loop:true}).catch(()=>{});
    }else{drag={shakes:d.shakes};land().finally(()=>{drag=null;});}
  };
  hit.addEventListener('pointerup',release);hit.addEventListener('pointercancel',release);
  hit.addEventListener('click',()=>{clearTimeout(hoverTimer);if(dragged){dragged=false;return;}buddyReact('poke');});
  // keyboard: arrow keys carry him the same way (Shift for bigger steps)
  hit.addEventListener('keydown',event=>{
    const step=event.shiftKey?60:20,dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!dir)return;event.preventDefault();interrupt();
    if(mascot.state!=='idle')mascot.stop().catch(()=>{});
    mascot.position=mascot._bounds(mascot.position.x+dir[0]*step,mascot.position.y+dir[1]*step);nextAt=Date.now()+5000;
  });
  hit.addEventListener('pointerenter',()=>{clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>{if(!drag)buddyReact('dodge');},1600);});
  hit.addEventListener('pointerleave',()=>clearTimeout(hoverTimer));
}
function bindMapWatch(){
  // he notices the visitor moving and zooming the map
  let down=null,lastComment=0;
  panel.addEventListener('pointermove',event=>{const r=stageRect();pointer={x:event.clientX-r.left,y:event.clientY-r.top,t:Date.now()};},{passive:true});
  panel.addEventListener('pointerdown',event=>{if(!hit.contains(event.target)&&event.target.closest('#map'))down={x:event.clientX,y:event.clientY};},{passive:true});
  panel.addEventListener('pointerup',event=>{
    if(!down)return;const dx=event.clientX-down.x,dy=event.clientY-down.y;down=null;
    if(Math.hypot(dx,dy)>60&&Date.now()-lastComment>20000&&Math.random()<.35&&!busy){lastComment=Date.now();buddyReact('pan',towards(-dx,-dy));}
  },{passive:true});
  panel.addEventListener('wheel',event=>{
    if(!event.target.closest('#map')||Date.now()-lastComment<20000||Math.random()>.2||busy)return;
    lastComment=Date.now();buddyReact('zoom',event.deltaY<0?'in':'out');
  },{passive:true});
}
export async function startBuddy(){
  panel=document.querySelector('.map-panel');toggle=document.getElementById('buddy-toggle');
  if(toggle&&!toggle.dataset.bound){toggle.dataset.bound='1';toggle.addEventListener('click',()=>setBuddyEnabled(!enabled));}
  syncToggle();
  if(!enabled||!panel||mascot)return;
  stage=document.createElement('div');stage.className='buddy-stage';
  stage.innerHTML='<canvas class="buddy-canvas" aria-hidden="true"></canvas><button type="button" class="buddy-hit"></button><p class="buddy-say" aria-hidden="true" hidden></p>';
  panel.append(stage);
  canvas=stage.querySelector('canvas');hit=stage.querySelector('.buddy-hit');bubble=stage.querySelector('.buddy-say');
  syncToggle();
  try{await loadEngine();}catch{stage.remove();stage=null;return;}
  const w=stage.clientWidth||600,h=stage.clientHeight||300;
  mascot=new window.NongNongMai(canvas,{assetBase:BASE,width:w,height:h,size:w<520?84:112});
  layout();
  mascot.position={x:rnd(zone.left,zone.right),y:zone.bottom};
  await mascot.ready.catch(()=>{});
  new ResizeObserver(layout).observe(panel);layout();
  const search=panel.querySelector('.map-search');if(search)new MutationObserver(layout).observe(search,{attributes:true,attributeFilter:['hidden','class','style']});
  bindCarry();bindMapWatch();
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){hiddenAt=Date.now();awayGreeted=false;return;}
    if(!awayGreeted&&Date.now()-hiddenAt>45000){awayGreeted=true;setTimeout(()=>buddyReact('back'),400);}else awayGreeted=true;
  });
  setInterval(think,500);requestAnimationFrame(frame);
  lastHour=bangkokHour();
  nextAt=Date.now()+rnd(5000,9000);
  // first hello: the time of day, or the weekend
  setTimeout(()=>{if(visible())say(isWeekend()&&Math.random()<.4?'weekend':Math.random()<.4?'hello':slotNow(),{force:true});},1800);
}
