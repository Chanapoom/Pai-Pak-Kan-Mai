import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const rail=JSON.parse(await readFile(new URL('../dist/rail.json',import.meta.url),'utf8'));
const inBox=([lat,lng])=>lat>13.45&&lat<14.15&&lng>100.25&&lng<100.95;
const on=id=>rail.stations.filter(s=>s.lines.includes(id)).map(s=>s.name);

test('rail overlay has ten lines, each with its own colour and real track geometry',()=>{
 assert.equal(rail.lines.length,10);
 assert.equal(new Set(rail.lines.map(l=>l.id)).size,rail.lines.length);
 assert.equal(new Set(rail.lines.map(l=>l.color)).size,rail.lines.length,'each line has its own colour');
 for(const l of rail.lines){
  assert.match(l.color,/^#[0-9a-f]{6}$/);
  assert.ok(l.name.length>3);
  for(const seg of l.segments){assert.ok(seg.length>=2);assert.ok(seg.every(inBox));}
  assert.ok(l.segments.flat().length>=40,`${l.id} follows the track, not a few straight links`);
 }
 assert.ok(rail.source.includes('OpenStreetMap')&&rail.fetched);
});

test('every line has exactly its stations in service',()=>{
 const expected={'bts-sukhumvit':47,'bts-silom':14,'bts-gold':3,'mrt-blue':38,'mrt-purple':16,'mrt-pink':32,'mrt-yellow':23,'arl':8,'srt-darkred':10,'srt-lightred':4};
 for(const [id,n] of Object.entries(expected))assert.equal(on(id).length,n,`${id}: ${on(id).join(' ')}`);
});

test('stations sit on their own line, not on a neighbour that passes close by',()=>{
 const wrong=[['mrt-blue','อโศก'],['mrt-blue','หมอชิต'],['bts-silom','สีลม'],['bts-sukhumvit','สุขุมวิท'],['bts-sukhumvit','สวนจตุจักร'],['arl','อโศก'],['arl','เพชรบุรี'],['srt-lightred','บางซื่อ'],['srt-darkred','บางซื่อ'],['bts-sukhumvit','เสนาร่วม']];
 for(const [id,name] of wrong)assert.ok(!on(id).includes(name),`${name} must not be on ${id}`);
 const right=[['bts-silom','ศาลาแดง'],['mrt-blue','สีลม'],['mrt-blue','สุขุมวิท'],['bts-sukhumvit','อโศก'],['srt-lightred','บางซ่อน'],['srt-darkred','ดอนเมือง'],['mrt-yellow','หัวหมาก'],['arl','หัวหมาก']];
 for(const [id,name] of right)assert.ok(on(id).includes(name),`${name} belongs on ${id}`);
});

test('stations are named in Thai, inside the map area, and interchanges are one dot',()=>{
 const ids=new Set(rail.lines.map(l=>l.id));
 for(const s of rail.stations){
  assert.ok(/[฀-๿]/.test(s.name)&&!/^สถานี/.test(s.name),`Thai name without prefix: ${s.name}`);
  assert.ok(inBox([s.lat,s.lng]));
  assert.ok(s.lines.length>=1&&s.lines.every(id=>ids.has(id)));
  assert.equal(new Set(s.lines).size,s.lines.length);
 }
 const siam=rail.stations.filter(s=>s.name==='สยาม');
 assert.equal(siam.length,1);assert.deepEqual([...siam[0].lines].sort(),['bts-silom','bts-sukhumvit']);
 for(const l of rail.lines){const names=on(l.id);assert.equal(new Set(names).size,names.length,`${l.id} lists a station twice`);}
});

test('stations named in places.json exist on the overlay',async()=>{
 const {places}=JSON.parse(await readFile(new URL('../dist/places.json',import.meta.url),'utf8'));
 const names=new Set(rail.stations.map(s=>s.name));
 const wanted=places.flatMap(p=>p.rail.map(r=>r.station)).filter(n=>!n.includes('/'));
 const missing=wanted.filter(n=>!names.has(n));
 assert.ok(missing.length<=Math.ceil(wanted.length/3),`too many stations missing from overlay: ${missing.join(', ')}`);
});
