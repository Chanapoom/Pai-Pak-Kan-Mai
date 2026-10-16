import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FACILITY_FILTERS,SPORT_FACILITIES,sportFacilities,facilityStatus,filterPlaces,matchesIntent,recommend} from '../dist/core.js';
const {places}=JSON.parse(await readFile(new URL('../dist/places.json',import.meta.url),'utf8'));
const byId=Object.fromEntries(places.map(p=>[p.id,p]));
const noon=new Date(Date.UTC(2026,9,14,5,0)); // 12:00 Bangkok

test('sports facilities are their own group with unique ids',()=>{
 assert.deepEqual(SPORT_FACILITIES.map(f=>f.id),['track','cycle','football','basketball','pool','equipment','badminton','takraw','tennis','table-tennis']);
 assert.equal(new Set(FACILITY_FILTERS.map(f=>f.id)).size,FACILITY_FILTERS.length);
 assert.ok(FACILITY_FILTERS.every(f=>['sport','service'].includes(f.group)));
});

test('every sports entry carries evidence: a source link, how it was found, and a short detail',()=>{
 for(const p of places)for(const [id,a] of Object.entries(p.amenities||{})){
  if(!SPORT_FACILITIES.some(f=>f.id===id))continue;
  assert.equal(typeof a.value,'boolean',`${p.id}.${id}`);
  assert.equal(new URL(a.source).protocol,'https:',`${p.id}.${id}`);
  assert.ok(['source','osm'].includes(a.via),`${p.id}.${id} via`);
  assert.ok(a.detail&&a.checkedAt,`${p.id}.${id} detail`);
  if(a.via==='osm'){assert.equal(new URL(a.source).hostname,'www.openstreetmap.org');assert.equal(a.value,true,'OSM can only add, never deny');}
  if(a.via==='source')assert.ok(/(^|\.)(bangkok\.go\.th|dasta\.or\.th|nakornnont\.go\.th|thanyaburi\.go\.th|suansri-bangkachao\.com)$/.test(new URL(a.source).hostname),`${p.id}.${id} cites an official or operator source`);
 }
});

test('facts quoted from the park pages are in place',()=>{
 assert.equal(facilityStatus(byId.benjakitti,'track'),true);
 assert.equal(facilityStatus(byId.benjakitti,'cycle'),true);
 assert.equal(facilityStatus(byId.benchasiri,'pool'),true);
 assert.equal(facilityStatus(byId.rotfai,'pool'),true);
 assert.match(byId.rotfai.amenities.pool.detail,/สมาชิก/,'members-only is said out loud');
 assert.equal(facilityStatus(byId.serithai,'football'),true);
 assert.equal(facilityStatus(byId.chatuchak,'cycle'),false,'Chatuchak forbids cycling');
 assert.equal(facilityStatus(byId['queen-sirikit'],'cycle'),false);
});

test('the sports filter keeps only confirmed places and composes',()=>{
 const pools=filterPlaces(places,{facilities:['pool']});
 assert.ok(pools.length>=2&&pools.every(p=>facilityStatus(p,'pool')===true));
 const both=filterPlaces(places,{facilities:['basketball','takraw']});
 assert.ok(both.length>=1&&both.every(p=>facilityStatus(p,'basketball')&&facilityStatus(p,'takraw')));
 assert.ok(filterPlaces(places,{facilities:['cycle']}).every(p=>p.id!=='chatuchak'));
});

test('cycling intent respects a ban and a confirmed track lifts runners\' picks',()=>{
 assert.equal(matchesIntent(byId.chatuchak,'bike'),false);
 assert.equal(matchesIntent(byId['queen-sirikit'],'bike'),false);
 assert.equal(matchesIntent(byId.benjakitti,'bike'),true);
 const run=recommend(places,{intent:'run'},noon).filter(r=>r.tier===2);
 const firstWithTrack=run.findIndex(r=>facilityStatus(r.place,'track')===true);
 assert.ok(firstWithTrack>=0&&firstWithTrack<5,'a place with a confirmed running path is near the top for "วิ่ง"');
});

test('sportFacilities lists only confirmed kinds in a fixed order',()=>{
 const ids=sportFacilities(byId.benjakitti).map(f=>f.id);
 assert.deepEqual(ids,SPORT_FACILITIES.map(f=>f.id).filter(id=>ids.includes(id)));
 assert.ok(!sportFacilities(byId.chatuchak).some(f=>f.id==='cycle'));
});

test('every Bangkok park listed on Greener Bangkok is in the data, sourced to its own page',()=>{
 const greener=places.filter(p=>p.source?.startsWith('https://greener.bangkok.go.th/park/'));
 assert.equal(greener.length,48,'Greener Bangkok lists 48 parks');
 assert.equal(new Set(greener.map(p=>p.source)).size,48,'no park added twice');
 for(const p of greener){
  assert.equal(p.province,'กรุงเทพมหานคร');
  assert.ok(p.district&&p.name&&p.description,p.id);
  assert.equal(p.sources.hours,p.source,`${p.id} hours come from its page`);
  assert.ok(p.open===null||/^\d{2}:\d{2}$/.test(p.open),p.id);
  for(const r of p.rail)assert.ok(r.line&&r.station&&r.instruction,`${p.id} rail entry is complete`);
 }
 const allDay=greener.filter(p=>p.close==='24:00');
 assert.ok(allDay.length>=5&&allDay.every(p=>p.hours==='เปิด 24 ชั่วโมง'));
});

test('BMA sports centres are sourced and never invent opening hours',()=>{
 const centres=places.filter(p=>p.id.startsWith('bma-'));
 assert.equal(centres.length,13);
 for(const p of centres){
  assert.equal(p.type,'exercise',p.id);
  assert.equal(p.province,'กรุงเทพมหานคร',p.id);
  assert.ok(p.source.startsWith('https://www.openstreetmap.org/'),`${p.id} location comes from OSM`);
  assert.equal(p.open,null,`${p.id} has no confirmed hours`);
  assert.equal(p.sources.hours,null,`${p.id} must not claim an hours source`);
  assert.equal(p.sources.fee,'https://greener.bangkok.go.th/green-space/cstd/');
  for(const [id,a] of Object.entries(p.amenities||{})){
   assert.equal(a.value,true,`${p.id}.${id}: only confirmed facilities`);
   assert.ok(a.via==='osm'&&a.source.startsWith('https://www.openstreetmap.org/')||a.via==='source'&&new URL(a.source).hostname.endsWith('.bangkok.go.th'),`${p.id}.${id}`);
  }
 }
 assert.ok(centres.filter(p=>sportFacilities(p).length).length>=5,'most centres show at least one court');
});

test('official enrichment distinguishes futsal, pool restrictions and additional courts',()=>{
 assert.match(byId['bma-sport-bang-mod'].amenities.football.detail,/ฟุตซอล/);
 assert.match(byId.rotfai.amenities.pool.detail,/สมาชิก/);
 assert.match(byId.lumphini.amenities.cycle.detail,/10:00–15:00/);
 assert.equal(facilityStatus(byId['bma-sport-bang-mod'],'tennis'),true);
 assert.equal(facilityStatus(byId['bma-youth-thai-japan'],'table-tennis'),true);
 assert.equal(facilityStatus(byId['bma-sport-prachaniwet'],'tennis'),null,'generic tennis fee table is not proof of a court');
 assert.equal(facilityStatus(byId['ram-inthra-sport'],'pool'),null,'a nearby centre does not establish pool access for the park');
 assert.equal(byId['bma-sport-bang-mod'].open,null,'conflicting centre hours remain unknown');
 assert.equal(facilityStatus({activities:['วิ่ง'],facilities:[],sources:{}},'track'),null,'running as an activity does not invent a physical path');
});

test('hours filled from the Thailand Tourism Directory point to that page',()=>{
 for(const id of ['srinagarindra','bung-ta-lua-korat','nong-prachak-udon','kanchanaphisek','ayutthaya-historical-park']){
  const p=byId[id];
  assert.match(p.open,/^\d{2}:\d{2}$/,id);
  assert.match(p.close,/^\d{2}:\d{2}$/,id);
  assert.ok(p.hours.includes(`${p.open}–${p.close}`),`${id} shows the times it is computed from`);
  assert.ok(p.sources.hours.startsWith('https://www.thailandtourismdirectory.go.th/'),id);
 }
});
