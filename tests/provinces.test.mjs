import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {provinces,source}=JSON.parse(await readFile(new URL('../dist/provinces.json',import.meta.url),'utf8'));
const {places}=JSON.parse(await readFile(new URL('../dist/places.json',import.meta.url),'utf8'));
const inside=(p,ring)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [yi,xi]=ring[i],[yj,xj]=ring[j];if((yi>p.lat)!==(yj>p.lat)&&p.lng<(xj-xi)*(p.lat-yi)/(yj-yi)+xi)c=!c;}return c;};

test('both province outlines exist as [lat, lng] rings around the right area',()=>{
 assert.deepEqual(Object.keys(provinces).sort(),['bangkok','nonthaburi']);
 assert.ok(source.includes('OpenStreetMap'));
 for(const [key,p] of Object.entries(provinces)){
  assert.ok(p.name&&p.osm.startsWith('https://www.openstreetmap.org/relation/'));
  assert.ok(p.rings.length>=1);
  for(const ring of p.rings){
   assert.ok(ring.length>=50,`${key} outline keeps its shape`);
   // no sea strip: Bangkok's southernmost land is about 13.49°N
   for(const [lat,lng] of ring)assert.ok(lat>13.45&&lat<14.2&&lng>100.2&&lng<101,`${key} point ${lat},${lng} is lat,lng`);
  }
 }
});

test('the select values map to outlines and every place lies inside its own province',()=>{
 for(const p of places){
  const key=p.province==='นนทบุรี'?'nonthaburi':p.province==='กรุงเทพมหานคร'?'bangkok':null;
  if(!key)continue; // Outlines are currently provided for Bangkok and Nonthaburi; metro pins still appear normally.
  assert.ok(provinces[key].rings.some(r=>inside(p,r)),`${p.id} should be inside ${key}`);
  const other=key==='bangkok'?'nonthaburi':'bangkok';
  assert.ok(!provinces[other].rings.some(r=>inside(p,r)),`${p.id} should not be inside ${other}`);
 }
});
