import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

test('pin and legend icons point at files that ship with the site',async()=>{
 const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const paths=new Set([...app.matchAll(/'(icons\/[\w-]+\.(?:png|svg))'/g),...html.matchAll(/src="(icons\/[\w-]+\.(?:png|svg))"/g)].map(m=>m[1]));
 assert.deepEqual([...paths].sort(),['icons/exercise.svg','icons/gym.png','icons/park.png']);
 for(const p of paths){
  await access(new URL(`../dist/${p}`,import.meta.url));
  const file=await readFile(new URL(`../dist/${p}`,import.meta.url));
  if(p.endsWith('.png'))assert.deepEqual([...file.subarray(0,8)],[137,80,78,71,13,10,26,10],`${p} is a PNG`);
  else assert.match(file.toString('utf8'),/^<svg [^>]*viewBox="0 0 64 64"/,`${p} is a standalone SVG`);
 }
});
