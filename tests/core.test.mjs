import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {openingStatus,bangkokMinutes,distanceKm,filterPlaces,directionsUrl,escapeHtml} from '../dist/core.js';
import {PROVINCES_EN,DISTRICTS_EN} from '../dist/i18n.js';
const {places}=JSON.parse(await readFile(new URL('../dist/places.json',import.meta.url),'utf8'));
test('Bangkok time and exclusive closing boundary',()=>{
 const park={open:'04:30',close:'22:00'};
 assert.equal(bangkokMinutes(new Date('2026-10-13T00:00:00Z')),420);
 assert.equal(openingStatus(park,new Date('2026-10-12T21:29:00Z')),'closed');
 assert.equal(openingStatus(park,new Date('2026-10-12T21:30:00Z')),'open');
 assert.equal(openingStatus(park,new Date('2026-10-13T15:00:00Z')),'closed');
});
test('unknown hours never assert open; overnight interval works',()=>{
 for(const p of [{},{open:null,close:null},{open:'bad',close:'22:00'},{open:'24:70',close:'22:00'},{open:'00:00',close:'00:00'}])assert.equal(openingStatus(p),'unknown');
 assert.equal(openingStatus({open:'22:00',close:'04:00'},new Date('2026-10-13T18:00:00Z')),'open');
});
test('composed filters distinguish free venues, province, rail and activities',()=>{
 const gyms=filterPlaces(places,{category:'gym'});
 assert.equal(gyms.length,places.filter(p=>p.type==='gym').length);
 for(const id of ['fitness-first-ngamwongwan','virgin-westgate','fitness-first-future-park','fitness-first-mega-bangna','fitness-first-bangkapi','jetts-one-bangkok','anytime-chamchuri-square'])assert.ok(gyms.some(p=>p.id===id),id);
 assert.equal(filterPlaces(places,{category:'gym',freeOnly:true}).length,0);
 const free=filterPlaces(places,{freeOnly:true});assert.ok(free.length>0);assert.ok(free.every(p=>p.free===true));
 assert.ok(filterPlaces(places,{province:'nonthaburi'}).every(p=>p.province==='นนทบุรี'));
 assert.ok(filterPlaces(places,{province:'nonthaburi'}).some(p=>p.id==='moph-sports-park'));
 assert.ok(filterPlaces(places,{province:'samutprakan'}).some(p=>p.id==='srinakuean-khan'));
 assert.ok(filterPlaces(places,{province:'pathumthani'}).some(p=>p.id==='thotsamintharapirom'));
 assert.ok(filterPlaces(places,{province:'samutsakhon'}).some(p=>p.id==='samut-sakhon-60-health-park'));
 assert.ok(filterPlaces(places,{province:'nakhonpathom'}).some(p=>p.id==='phutthamonthon'));
 assert.ok(filterPlaces(places,{query:'พร้อมพงษ์'}).some(p=>p.id==='benchasiri'));
 assert.ok(filterPlaces(places,{category:'exercise'}).some(p=>p.id==='lumphini'));
 assert.equal(filterPlaces(places,{query:'ไม่มีสถานที่ชื่อนี้'}).length,0);
 const when=new Date('2026-10-13T00:00:00Z');const open=filterPlaces(places,{openOnly:true},when);assert.ok(open.length>0);assert.ok(open.every(p=>openingStatus(p,when)==='open'));
});
test('regional province choices return only their matching new places',()=>{
 const cases=[['chiangmai','buak-hat-chiangmai'],['nakhonratchasima','bung-ta-lua-korat'],['udonthani','nong-prachak-udon'],['ayutthaya','ayutthaya-historical-park'],['rayong','khao-laem-ya-rayong'],['phetchaburi','kaeng-krachan-phetchaburi'],['songkhla','hat-yai-municipal-park']];
 for(const [province,id] of cases){const result=filterPlaces(places,{province});assert.ok(result.some(p=>p.id===id));assert.ok(result.every(p=>p.province===places.find(q=>q.id===id).province));}
});
test('saved places and distance sort do not mutate data',()=>{
 assert.deepEqual(filterPlaces(places,{savedOnly:true,saved:new Set(['makut'])}).map(p=>p.id),['makut']);
 const before=places.map(p=>p.id);const origin=places.find(p=>p.id==='makut');
 assert.equal(filterPlaces(places,{sort:'distance',location:origin})[0].id,'makut');assert.deepEqual(places.map(p=>p.id),before);
 assert.equal(distanceKm(origin,origin),0);assert.ok(Math.abs(distanceKm({lat:0,lng:0},{lat:0,lng:1})-111.195)<0.01);
});
test('directions encode Thai origin and destination correctly',()=>{
 const p=places[0];const origin='สยาม & test=#?';const url=new URL(directionsUrl(p,origin,'walking'));
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('origin'),origin);assert.equal(url.searchParams.get('travelmode'),'walking');assert.ok(url.searchParams.get('destination').includes(p.name));
 assert.equal(new URL(directionsUrl(p)).searchParams.has('origin'),false);
 assert.equal(new URL(directionsUrl(p,'','invalid')).searchParams.get('travelmode'),'transit');
 assert.equal(escapeHtml('<img src=x onerror="a">'),'&lt;img src=x onerror=&quot;a&quot;&gt;');
});
test('dataset is scoped, sourced, and explicit about uncertainty',()=>{
 assert.equal(new Set(places.map(p=>p.id)).size,places.length);
 // every province and district shown has its English name, so the English view never falls back to Thai
 const provinces=new Set(Object.keys(PROVINCES_EN));
 for(const p of places){assert.ok(DISTRICTS_EN[p.district],`${p.id}: district ${p.district} needs an English name`);assert.ok(['park','forest','nature','exercise','gym'].includes(p.type),p.id);}
 for(const p of places){assert.ok(/^[a-z0-9-]+$/.test(p.id));assert.ok(provinces.has(p.province));assert.ok(p.lat>5&&p.lat<21&&p.lng>97&&p.lng<106);assert.ok(p.name.length>2);assert.equal(p.coordinatesApproximate,true);assert.equal(p.crowd.live,null);assert.equal(p.crowd.morning,null);assert.equal(p.crowd.evening,null);assert.ok(p.checkedAt);for(const source of Object.values(p.sources).filter(Boolean))assert.equal(new URL(source).protocol,'https:');if(p.bus.length)assert.ok(p.sources.bus);if(p.rail.length)assert.ok(p.sources.rail);if(p.free===true)assert.ok(p.sources.fee);}
});
