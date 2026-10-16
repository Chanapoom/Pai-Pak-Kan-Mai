import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {daypart,clockText,recommend,whyGo,daypartFit,DAYPART_FIT,DAYPARTS,pickPool,hoursInfo} from '../dist/core.js';
const bkk=(hh,mm=0)=>new Date(Date.UTC(2026,9,14,hh-7,mm)); // Bangkok is UTC+7

test('time of day follows Bangkok time with exact boundaries',()=>{
 assert.equal(daypart(bkk(4,59)).id,'night');
 assert.equal(daypart(bkk(5,0)).id,'morning');
 assert.equal(daypart(bkk(10,59)).id,'morning');
 assert.equal(daypart(bkk(11,0)).id,'day');
 assert.equal(daypart(bkk(15,59)).id,'day');
 assert.equal(daypart(bkk(16,0)).id,'evening');
 assert.equal(daypart(bkk(18,59)).id,'evening');
 assert.equal(daypart(bkk(19,0)).id,'night');
 assert.equal(daypart(bkk(23,59)).id,'night');
 assert.equal(daypart(bkk(0,0)).id,'night');
});

test('every part has a Thai label and the clock reads Bangkok time',()=>{
 for(const h of [6,12,17,21])assert.match(daypart(bkk(h)).label,/[฀-๿]/);
 assert.equal(clockText(bkk(7,5)),'07:05 น.');
 assert.equal(clockText(bkk(18,32)),'18:32 น.');
 assert.equal(clockText(new Date('2026-10-13T17:00:00Z')),'00:00 น.');
});

const {places}=JSON.parse(await readFile(new URL('../dist/places.json',import.meta.url),'utf8'));
const top=(h,state={})=>recommend(places,state,bkk(h)).map(r=>r.place.id);

test('the recommendation changes with the time of day',()=>{
 const picks=[7,13,17,20].map(h=>top(h)[0]);
 assert.ok(new Set(picks).size>=3,`picks across the day: ${picks.join(', ')}`);
 assert.equal(recommend(places,{},bkk(13))[0].place.type,'forest','midday leans to forest parks');
 assert.ok(daypartFit(places.find(p=>p.id===top(17)[0]),{id:'evening'}).matches.length>=2,'evening pick suits exercise');
 const night=recommend(places,{},bkk(20)).filter(r=>r.hours.status==='open');
 assert.ok(night[0].hours.minutesLeft>=night.at(-1).hours.minutesLeft,'in the evening the place open longest leads');
});

test('time of day never lifts a place above its open / closed / unknown group',()=>{
 for(const h of [0,3,6,9,12,15,17,19,21,23]){
  const order=recommend(places,{},bkk(h)).map(r=>r.hours.closure?'seasonal':r.hours.status);
  const rank={open:2,closed:1,unknown:0,seasonal:-1};
  assert.ok(order.every((s,i)=>i===0||rank[order[i-1]]>=rank[s]),`${h}:00 ${order.join(',')}`);
 }
});

test('time-of-day reasons come only from the place data and every part has a mood line',()=>{
 for(const part of DAYPARTS)assert.match(DAYPART_FIT[part.id].mood,/[\u0E00-\u0E7F]/);
 for(const p of places)for(const h of [7,13,17,21]){
  const w=whyGo(p,{date:bkk(h)});
  assert.deepEqual([...w.activities].sort(),[...p.activities].sort(),'activities are only reordered');
  if(w.suits)for(const a of w.suits.text.split(': ')[1]?.split(' · ')||[])assert.ok(p.activities.includes(a),`${p.id}: ${a}`);
 }
});

test('"ask for another" only offers places that suit the current time of day',()=>{
 const forest=new Set(places.filter(p=>['forest','nature'].includes(p.type)).map(p=>p.id));
 const midday=pickPool(recommend(places,{},bkk(13)));
 assert.ok(midday.suitable&&midday.items.length>=2);
 assert.ok(midday.items.every(r=>forest.has(r.place.id)||r.place.type==='gym'),'midday offers forest parks or gyms only');
 for(const h of [7,13,17,20]){
  const pool=pickPool(recommend(places,{},bkk(h)));
  for(const r of pool.items){
   assert.equal(r.hours.status,'open',`${h}:00 ${r.place.id} is open`);
   assert.ok(r.hours.minutesLeft>=60,`${h}:00 ${r.place.id} stays open another hour`);
   if(h!==20)assert.ok(r.fit.score>=1,`${h}:00 ${r.place.id} clearly suits the time`);
  }
 }
 const evening=pickPool(recommend(places,{},bkk(17))).items.map(r=>r.place.id);
 assert.ok(!evening.includes('chatuchak'),'only walking and running is not enough for the evening workout pick');
 assert.ok(!pickPool(recommend(places,{},bkk(18,30))).items.some(r=>r.place.id==='queen-sirikit'),'a park closing at 19:00 is not offered at 18:30');
});

test('when nothing suits, the pick shows one best place and nothing to cycle through',()=>{
 // 24-hour parks and gyms staffed until midnight still suit late hours; everything else is closed or closing by then
 const openLate=p=>hoursInfo(p,bkk(22,0)).status==='open';
 const limited=places.filter(p=>!openLate(p));
 for(const [h,m] of [[21,30],[23,0],[3,0]]){
  const pool=pickPool(recommend(limited,{},bkk(h,m)));
  assert.equal(pool.suitable,false);assert.equal(pool.items.length,1);
 }
 assert.deepEqual(pickPool([]),{items:[],suitable:false});
 const late=pickPool(recommend(places,{},bkk(23,0)));
 assert.ok(late.suitable&&late.items.every(r=>openLate(r.place)&&r.hours.status==='open'),'late at night only places open past 22:00 are offered');
});
