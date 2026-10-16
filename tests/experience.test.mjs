import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {hoursInfo,formatDuration,filterPlaces,recommend,whyGo,matchesIntent,INTENTS,contactConfig,suggestionMessage} from '../dist/core.js';
const {places}=JSON.parse(await readFile(new URL('../dist/places.json',import.meta.url),'utf8'));
const at=iso=>new Date(iso);
const byId=Object.fromEntries(places.map(p=>[p.id,p]));

test('hoursInfo counts down to closing and to opening, never for unknown hours',()=>{
 const park={open:'04:30',close:'22:00'};
 assert.deepEqual(hoursInfo(park,at('2026-10-13T14:00:00Z')),{status:'open',minutesLeft:60}); // 21:00 in Bangkok, closes 22:00
 assert.deepEqual(hoursInfo(park,at('2026-10-13T16:00:00Z')),{status:'closed',minutesToOpen:330}); // 23:00 -> 04:30
 assert.deepEqual(hoursInfo({open:'22:00',close:'04:00'},at('2026-10-13T18:00:00Z')),{status:'open',minutesLeft:180}); // overnight, 01:00
 assert.deepEqual(hoursInfo({open:null,close:null}),{status:'unknown'});
 assert.equal(formatDuration(25),'25 นาที');
 assert.equal(formatDuration(90),'1 ชม. 30 นาที');
 assert.equal(formatDuration(200),'3 ชม.');
});

test("intent chips only match what a place's own data supports",()=>{
 assert.ok(matchesIntent(byId.lumphini,'run'));
 assert.ok(matchesIntent(byId.lumphini,'bike'));
 assert.ok(!matchesIntent(byId['queen-sirikit'],'bike'));
 assert.ok(matchesIntent(byId['fitness-first-ngamwongwan'],'gym'));
 assert.ok(!matchesIntent(byId.lumphini,'gym'));
 assert.ok(matchesIntent(byId.lumphini,'all'));
 assert.ok(matchesIntent(byId.lumphini,undefined));
 for(const i of INTENTS)assert.ok(filterPlaces(places,{intent:i.id}).length>0,`${i.id} should never be an empty chip`);
 const kids=filterPlaces(places,{intent:'kids',freeOnly:true});
 assert.ok(kids.length>0&&kids.every(p=>p.facilities.includes('สนามเด็กเล่น')&&p.free===true));
});

test('recommend puts open places first, then those reopening soonest, then unknown hours',()=>{
 const noon=at('2026-10-14T05:00:00Z'); // 12:00 in Bangkok
 const ranked=recommend(places,{},noon);
 assert.equal(ranked.length,places.length);
 const order=ranked.map(r=>r.hours.status);
 assert.ok(order.lastIndexOf('open')<order.indexOf('unknown'),'every open place precedes every unknown one');
 assert.ok(ranked.slice(0,3).every(r=>r.hours.status==='open'));
 const night=recommend(places,{},at('2026-10-13T17:00:00Z')); // 00:00: only places listed as open 24 hours are open
 const allDay=p=>(p.open==='00:00'&&p.close==='24:00')||(p.schedule&&Object.values(p.schedule.week).every(s=>s?.length===1&&s[0][0]==='00:00'&&s[0][1]==='24:00'));
 assert.ok(night.filter(r=>r.hours.status==='open').every(r=>allDay(r.place)));
 assert.ok(night.some(r=>r.hours.status==='open'),'24-hour parks are open at midnight');
 const statuses=night.filter(r=>!r.hours.closure).map(r=>r.hours.status);
 assert.ok(statuses.lastIndexOf('closed')<statuses.indexOf('unknown'),'known-closed places still outrank guesses');
 const early={...byId.lumphini,id:'early',open:'04:00',close:'22:00'}, late={...byId.lumphini,id:'late',open:'07:00',close:'22:00'};
 assert.deepEqual(recommend([late,early],{},at('2026-10-13T17:00:00Z')).map(r=>r.place.id),['early','late'],'otherwise equal places: soonest to reopen first');
 assert.deepEqual(recommend(places,{query:'ไม่มีสถานที่ชื่อนี้'},noon),[]);
 assert.ok(recommend(places,{freeOnly:true},noon).every(r=>r.place.free===true));
});

test('a nearby place outranks a distant one when location is known',()=>{
 const noon=at('2026-10-14T05:00:00Z');
 const here=byId.rama8; // standing in Rama VIII Park
 const rank=state=>recommend(places,state,noon).findIndex(r=>r.place.id==='rama8');
 assert.ok(rank({location:here,intent:'run'})<rank({intent:'run'}),'knowing the location lifts the place you are at');
 const distant={...here,id:'distant-equal-park',lat:here.lat+.5};
 assert.equal(recommend([distant,here],{location:here,intent:'run'},noon)[0].place.id,here.id,'otherwise equal parks: the nearby one ranks first');
 const far=recommend(places,{location:here,intent:'run'},noon).findIndex(r=>r.place.id==='srinagarindra');
 assert.ok(far<0||far>rank({location:here,intent:'run'}),'a park across the city ranks below it');
});

test('whyGo words come from sourced fields only',()=>{
 const noon=at('2026-10-14T05:00:00Z');
 const w=whyGo(byId.lumphini,{date:noon});
 assert.equal(w.hours.status,'open');
 assert.equal(w.fee.kind,'free');
 assert.ok(w.rail.text.startsWith('ใกล้ MRT'));
 assert.equal(w.distance,null);
 assert.equal(whyGo(byId.makut,{date:noon}).hours.text,'เช็กเวลาก่อนไป');
 assert.equal(whyGo(byId['luang-r9']).fee.kind,'paid');
 assert.match(whyGo(byId.lumphini,{date:at('2026-10-14T14:30:00Z')}).hours.text,/ปิดในอีก 30 นาที/);
 assert.match(whyGo(byId.lumphini,{location:byId.makut}).distance.text,/^\d+\.\d กม\.$/);
});

test('contact config only accepts a plain email or an https link',()=>{
 assert.equal(contactConfig({}).enabled,false);
 assert.equal(contactConfig(null).enabled,false);
 assert.deepEqual(contactConfig({suggest:{email:'hi@example.com',formUrl:''}}),{email:'hi@example.com',formUrl:'',enabled:true});
 assert.equal(contactConfig({suggest:{email:'a b@example.com'}}).enabled,false);
 assert.equal(contactConfig({suggest:{email:'x@y.com?cc=evil@z.com'}}).email,'');
 assert.equal(contactConfig({suggest:{formUrl:'javascript:alert(1)'}}).enabled,false);
 assert.equal(contactConfig({suggest:{formUrl:'http://example.com/form'}}).enabled,false);
 assert.equal(contactConfig({suggest:{formUrl:'https://example.com/form'}}).formUrl,'https://example.com/form');
 const m=suggestionMessage({kind:'fix',name:'สวนลุมพินี',area:'ปทุมวัน',link:'',details:'ปิดซ่อม',placeId:'lumphini'});
 assert.ok(m.subject.includes('แจ้งข้อมูลผิด')&&m.body.includes('lumphini')&&m.body.includes('ปิดซ่อม'));
 assert.ok(suggestionMessage({kind:'new',name:'x'}).subject.includes('แนะนำสถานที่'));
});

test('the shipped config.json leaves the suggest form hidden until an address is chosen',async()=>{
 const config=JSON.parse(await readFile(new URL('../dist/config.json',import.meta.url),'utf8'));
 assert.equal(typeof config.suggest.email,'string');
 assert.equal(typeof config.suggest.formUrl,'string');
 if(!config.suggest.email&&!config.suggest.formUrl)assert.equal(contactConfig(config).enabled,false);
});

test('photos are licensed, credited, and load from a local asset or Wikimedia Commons',async()=>{
 const withPhoto=places.filter(p=>p.photo);
 assert.ok(withPhoto.length>=10);
 for(const p of withPhoto){
  const {src,thumb,alt,author,license,licenseUrl,page}=p.photo;
  assert.ok(['CC0','CC BY 4.0','CC BY-SA 4.0','CC BY-SA 3.0','CC BY 3.0','CC BY-SA 2.5','CC BY 2.5','CC BY-SA 2.0','CC BY 2.0'].includes(license),`${p.id} licence ${license}`);
  assert.ok(author&&alt.length>5,`${p.id} needs an author and alt text`);
  assert.equal(new URL(licenseUrl).protocol,'https:');
  assert.equal(new URL(page).hostname,'commons.wikimedia.org');
  for(const asset of [src,thumb]){
   const url=new URL(asset,import.meta.url);
   if(url.protocol==='https:'&&url.hostname==='commons.wikimedia.org')assert.match(url.pathname,/^\/wiki\/Special:FilePath\//);
   else await access(new URL(`../dist/${asset}`,import.meta.url));
  }
 }
});

test('regional launch set covers every Thai region with a real, credited venue photo',()=>{
 const regional=['buak-hat-chiangmai','bung-ta-lua-korat','nong-prachak-udon','ayutthaya-historical-park','khao-laem-ya-rayong','kaeng-krachan-phetchaburi','hat-yai-municipal-park'].map(id=>byId[id]);
 assert.equal(regional.length,7);
 for(const p of regional){
  assert.ok(p,`missing regional place`);
  assert.ok(p.photo,`${p.id} needs its real venue photo`);
  assert.ok(p.photo.page.startsWith('https://commons.wikimedia.org/wiki/File:'));
  assert.ok(p.sources.coordinates.startsWith('https://www.openstreetmap.org/'));
 }
 assert.deepEqual(new Set(regional.map(p=>p.province)),new Set(['เชียงใหม่','นครราชสีมา','อุดรธานี','พระนครศรีอยุธยา','ระยอง','เพชรบุรี','สงขลา']));
});

test('added places carry the same evidence as the originals',()=>{
 const added=['luang-r9','rama8','saranrom','santipap','serithai','thanaburirom','romaninat','sanam-luang'].map(id=>byId[id]);
 for(const p of added){
  assert.ok(p,'present');
  assert.ok(p.source.startsWith('https://greener.bangkok.go.th/park/'));
  assert.match(p.sources.coordinates,/^https:\/\/www\.openstreetmap\.org\/(way|node)\/\d+$/);
  assert.ok(p.open&&p.close);
 }
 assert.equal(byId['luang-r9'].free,false,'a 10 baht entry fee must not read as free');
 assert.ok(byId.thanaburirom.note.includes('Pet Park'),'the conflicting pet rule is surfaced, not resolved');
});
