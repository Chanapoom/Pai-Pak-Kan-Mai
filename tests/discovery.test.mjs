import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hoursInfo,openingStatus,localVisitDate,weeklyRows,boundaryLabel} from '../dist/hours.js';
import {filterPlaces,recommend,whyGo,facilityStatus,locationCandidates,directionsUrl} from '../dist/core.js';
const {places}=JSON.parse(fs.readFileSync(new URL('../dist/places.json',import.meta.url),'utf8'));
const at=value=>new Date(`${value}:00+07:00`);
const byId=id=>places.find(p=>p.id===id);
const everyDay=intervals=>Object.fromEntries(Array.from({length:7},(_,i)=>[i,intervals]));

test('split sessions close during the midday break and reopen in the evening',()=>{
  const place=byId('thotsamintharapirom');
  assert.deepEqual(hoursInfo(place,at('2026-10-15T08:59')),{status:'open',minutesLeft:1});
  assert.deepEqual(hoursInfo(place,at('2026-10-15T09:00')),{status:'closed',minutesToOpen:420});
  assert.deepEqual(hoursInfo(place,at('2026-10-15T16:00')),{status:'open',minutesLeft:240});
  assert.deepEqual(hoursInfo(place,at('2026-10-15T20:00')),{status:'closed',minutesToOpen:540});
  assert.match(whyGo(place,{date:at('2026-10-15T12:00')}).hours.text,/เปิด 16:00/);
  assert.match(whyGo(place,{date:at('2026-10-15T20:00')}).hours.text,/พรุ่งนี้ 05:00/);
});

test('weekly hours use the Thai weekday; branch-unconfirmed holidays stay unknown',()=>{
  const gym=byId('fitness-first-ngamwongwan');
  assert.deepEqual(hoursInfo(gym,at('2026-10-15T21:30')),{status:'open',minutesLeft:30});
  assert.equal(openingStatus(gym,at('2026-10-17T07:00')),'closed');
  assert.deepEqual(hoursInfo(gym,at('2026-10-17T20:30')),{status:'open',minutesLeft:30});
  assert.equal(openingStatus(gym,at('2026-10-23T12:00')),'unknown');
  assert.equal(openingStatus(gym,at('2027-01-04T12:00')),'unknown');
  assert.equal(openingStatus(gym,at('2026-05-01T12:00')),'closed');
  assert.equal(openingStatus(byId('virgin-westgate'),at('2026-05-01T12:00')),'unknown');
  assert.ok(weeklyRows(gym).some(r=>r.day==='เสาร์'&&r.text==='08:00–21:00'));
});

test('overnight hours belong to the starting day; dated overrides take precedence',()=>{
  const week=everyDay([]);week[5]=[['22:00','04:00']];
  const p={schedule:{week}};
  assert.deepEqual(hoursInfo(p,at('2026-10-17T01:00')),{status:'open',minutesLeft:180});
  assert.equal(openingStatus(p,at('2026-10-17T04:00')),'closed');
  p.schedule.overrides={'2026-10-17':[]};
  assert.equal(openingStatus(p,at('2026-10-17T01:00')),'closed');
  p.schedule.overrides['2026-10-17']=null;
  assert.deepEqual(hoursInfo(p,at('2026-10-17T01:00')),{status:'unknown'});
  assert.equal(openingStatus({schedule:{week:{4:[['bad','20:00']]}}},at('2026-10-15T12:00')),'unknown');
});

test('seasonal closure overrides any regular hours and is never a recommended open venue',()=>{
  const p=byId('kaeng-krachan-phetchaburi'),date=at('2026-10-15T12:00');
  assert.equal(hoursInfo({...p,open:'00:00',close:'23:59'},date).status,'closed');
  assert.match(whyGo(p,{date}).hours.text,/ปิดฤดูกาล/);
  assert.ok(!filterPlaces(places,{openOnly:true},date).some(x=>x.id===p.id));
  assert.equal(recommend(places,{},date).at(-1).place.id,p.id);
  assert.equal(openingStatus(p,at('2026-11-01T12:00')),'unknown');
});

test('planned dates always use Thailand time and reject impossible dates',()=>{
  assert.equal(localVisitDate('2026-10-15T12:00').toISOString(),'2026-10-15T05:00:00.000Z');
  assert.equal(localVisitDate('2026-02-31T12:00'),null);
  assert.equal(localVisitDate('2026-10-15T99:00'),null);
  assert.match(boundaryLabel(120,at('2026-10-15T23:00')),/พรุ่งนี้ 01:00/);
  assert.match(whyGo(byId('lumphini'),{date:at('2026-10-15T12:00'),planned:true}).hours.text,/เปิดตามเวลาที่เลือก/);
});

const sample=(id,lat,lng,extras={})=>({id,name:id,district:'เขตทดสอบ',province:'กรุงเทพมหานคร',type:'park',lat,lng,activities:['วิ่ง'],facilities:[],rail:[],free:null,sources:{},open:'05:00',close:'22:00',...extras});
test('radius, map area, facility and fee filters compose without mutating input',()=>{
  const origin={lat:13.7,lng:100.5};
  const near=sample('near',13.705,100.5,{free:true,facilities:['ห้องน้ำ','ที่จอดรถ'],sources:{facilities:'https://example.com'},photo:{}});
  const far=sample('far',14,100.5,{free:true});
  const unknown=sample('unknown',13.7,100.501);
  const input=[far,near,unknown],when=at('2026-10-15T12:00');
  const state={searchOrigin:origin,radiusKm:1,facilities:['toilet','parking'],feeFilter:'free',photoOnly:true,openOnly:true};
  assert.deepEqual(filterPlaces(input,state,when).map(p=>p.id),['near']);
  assert.deepEqual(filterPlaces(input,{searchOrigin:origin,sort:'distance'},when).map(p=>p.id),['unknown','near','far']);
  assert.deepEqual(filterPlaces(input,{bounds:{south:13.704,north:13.706,west:100.49,east:100.51}},when).map(p=>p.id),['near']);
  assert.deepEqual(filterPlaces(input,{feeFilter:'unknown'},when).map(p=>p.id),['unknown']);
  assert.deepEqual(input.map(p=>p.id),['far','near','unknown']);
});

test('missing facility evidence is unknown and cannot pass a confirmed-facility filter',()=>{
  const p=sample('x',13.7,100.5);
  assert.equal(facilityStatus(p,'parking'),null);
  assert.equal(filterPlaces([p],{facilities:['parking']}).length,0);
  p.amenities={parking:{value:false,source:'https://example.com'}};
  assert.equal(facilityStatus(p,'parking'),false);
  p.amenities.parking.value=true;
  assert.equal(filterPlaces([p],{facilities:['parking']}).length,1);
  assert.equal(facilityStatus(byId('benjakitti'),'pets'),true);
});

test('manual point search uses known venue and station coordinates without a location permission',()=>{
  const result=locationCandidates(places,[{name:'สยาม',lat:13.745,lng:100.534}],'สยาม');
  assert.ok(result.some(p=>p.kind==='station'&&p.label==='สถานีสยาม'));
  assert.ok(locationCandidates(places,[],'เชียงใหม่').some(p=>p.id==='buak-hat-chiangmai'));
  assert.deepEqual(locationCandidates(places,[],'ส'),[]);
  assert.deepEqual(locationCandidates([], [{name:'สยาม',lat:NaN,lng:100}],'สยาม'),[]);
});

test('a driving-only entrance is not silently used for a walking route',()=>{
  const p={name:'สวน',province:'กรุงเทพมหานคร',access:{destination:'ประตูรถยนต์ที่ยืนยัน',source:'https://example.com',mode:'driving'}};
  assert.equal(new URL(directionsUrl(p,'','driving')).searchParams.get('destination'),p.access.destination);
  assert.ok(!new URL(directionsUrl(p,'','walking')).searchParams.get('destination').includes('ประตูรถยนต์'));
  p.access.source=null;
  assert.ok(!new URL(directionsUrl(p,'','driving')).searchParams.get('destination').includes('ประตูรถยนต์'));
});
