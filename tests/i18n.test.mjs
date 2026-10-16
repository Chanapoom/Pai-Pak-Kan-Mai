import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {t,setLangValue,PROVINCES_EN,DISTRICTS_EN,LINES_EN} from '../dist/i18n.js';
import {whyGo,formatDuration} from '../dist/core.js';
const read=f=>readFile(new URL(`../dist/${f}`,import.meta.url),'utf8');
const {places}=JSON.parse(await read('places.json'));
const rail=JSON.parse(await read('rail.json'));
const thai=/[฀-๿]/;
const english=th=>{setLangValue('en');const out=t(th);setLangValue('th');return out;};

test('every word the data uses has an English version, so new places surface missing translations',()=>{
 const missing=[];
 for(const p of places){
  for(const a of p.activities)if(english(a)===a)missing.push(`activity ${a}`);
  for(const f of p.facilities)if(thai.test(f)&&english(f)===f)missing.push(`facility ${f}`);
  if(!DISTRICTS_EN[p.district])missing.push(`district ${p.district}`);
  if(!PROVINCES_EN[p.province])missing.push(`province ${p.province}`);
  for(const r of p.rail)if(!LINES_EN[r.line])missing.push(`line ${r.line}`);
 }
 for(const l of rail.lines)if(!LINES_EN[l.name])missing.push(`line ${l.name}`);
 assert.deepEqual([...new Set(missing)],[]);
});

test('Thai text written in index.html and passed to t() in scripts has an English version',async()=>{
 // elements with data-en swap their whole markup, so their pieces are not dictionary entries
 const html=(await read('index.html')).replace(/<(\w+)[^>]*\sdata-en=(['"])[^]*?\2[^>]*>[^]*?<\/\1>/g,'');
 const texts=new Set();
 // text between tags, minus the brand name, the language button and noscript
 for(const m of html.replace(/<noscript>[\s\S]*?<\/noscript>/g,'').matchAll(/>([^<>]*[฀-๿][^<>]*)</g))texts.add(m[1].trim());
 for(const m of html.matchAll(/(?:placeholder|aria-label|title)="([^"]*[฀-๿][^"]*)"/g))texts.add(m[1]);
 for(const f of ['app.js','core.js','hours.js'])for(const m of (await read(f)).matchAll(/\bt\('([^']*[฀-๿][^']*)'/g))texts.add(m[1]);
 for(const keep of ['ไปพักกันไหม','ไทย','ภาษา / Language'])texts.delete(keep);
 const missing=[...texts].filter(x=>english(x)===x);
 assert.deepEqual(missing,[]);
});

test('Thai stays the default and the English view changes only the words',()=>{
 const p=places.find(x=>x.id==='lumphini');
 const at=new Date('2026-10-14T14:30:00Z'); // 21:30 Bangkok, half an hour before Lumphini closes
 assert.match(whyGo(p,{date:at}).hours.text,/ปิดในอีก 30 นาที/);
 setLangValue('en');
 try{
  assert.match(whyGo(p,{date:at}).hours.text,/^Open now · closes in 30 min$/);
  assert.equal(whyGo(p,{date:at}).fee.text,'Free entry');
  assert.equal(formatDuration(90),'1 h 30 min');
 }finally{setLangValue('th');}
 assert.equal(formatDuration(90),'1 ชม. 30 นาที');
});

test('place names come only from sources: an English name when one exists, the Thai name when one exists',()=>{
 for(const p of places){
  assert.ok(p.name,`${p.id} has a name`);
  // no name is made up: neither romanized English nor transliterated Thai
  assert.equal(p.nameEnMethod,undefined,`${p.id} has no romanized name`);
  if(p.nameEn){assert.ok(!thai.test(p.nameEn),`${p.id} English name has no Thai letters`);assert.match(p.sources.nameEn,/^https:\/\/(www\.openstreetmap\.org\/(node|way|relation)\/\d+|greener\.bangkok\.go\.th\/en\/park\/|www\.fitnessfirst\.com\/th\/en\/|www\.virginactive\.co\.th\/en\/|www\.jetts\.co\.th\/en\/|www\.anytimefitness\.co\.th\/gyms\/th-\d+\/|www\.thailandtourismdirectory\.go\.th\/en\/|www\.wikidata\.org\/wiki\/Q\d+)/,p.id);}
  else assert.equal(p.sources.nameEn,undefined,`${p.id} cites no English name it does not have`);
  if(p.sources.name)assert.match(p.sources.name,/^https:\/\/(www\.fitnessfirst\.com\/th\/th\/|www\.jetts\.co\.th\/(?!en\/)|www\.virginactive\.co\.th\/th\/|www\.wikidata\.org\/wiki\/Q\d+)/,`${p.id} Thai name source`);
  // a place whose sources give no Thai name keeps its own Latin name
  if(!thai.test(p.name))assert.ok(p.name===p.nameEn&&!p.sources.name,`${p.id}: a Latin-only name is the English name`);
 }
 for(const s of rail.stations.filter(x=>x.nameEn))assert.ok(!thai.test(s.nameEn)&&thai.test(s.name),s.name);
});

test('gym text has an English version for every Thai field it shows, with the same times',()=>{
 const times=s=>(String(s).match(/\d\d:\d\d/g)||[]).join();
 for(const p of places.filter(x=>x.type==='gym')){
  assert.ok(p.en,`${p.id} has English text`);
  const pairs=[['description',p.description],['hours',p.hours],['fee',p.fee],['busNote',p.busNote],['note',p.note],['holidayNote',p.schedule?.holidayNote]];
  for(const [k,th] of pairs){
   if(th==null){assert.equal(p.en[k],undefined,`${p.id} ${k}`);continue;}
   assert.ok(p.en[k]&&!thai.test(p.en[k]),`${p.id} ${k} is English`);
   assert.equal(times(p.en[k]),times(th),`${p.id} ${k} keeps the same times`);
  }
  if(p.access)assert.ok(!thai.test(p.en.access.label)&&!thai.test(p.en.access.instruction),p.id);
  for(const r of p.rail)assert.ok(r.instructionEn&&!thai.test(r.instructionEn),p.id);
 }
});
