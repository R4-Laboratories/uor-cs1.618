import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEngine} from '../shared/engine';
import {HdBudget} from '../src/hd-budget';
const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
test('HD adaptation ignores nominal 60 Hz jitter, pauses and isolated slow frames',()=>{
 const b=new HdBudget(engine);let lod=2;
 for(let i=0;i<1200;i++)lod=b.sample(lod,i%2?1/59:1/61,true);
 assert.equal(lod,2);
 for(let i=0;i<100;i++)lod=b.sample(lod,.1,false);assert.equal(lod,2);
 lod=b.sample(lod,.1,true);assert.equal(lod,2);
});
test('sustained overload reduces HD detail and sustained headroom recovers it',()=>{
 const b=new HdBudget(engine);let lod=2;
 for(let i=0;i<200;i++)lod=b.sample(lod,1/30,true);assert.equal(lod,0);
 for(let i=0;i<2880;i++)lod=b.sample(lod,1/144,true);assert.equal(lod,4);
 b.reset();assert.equal(b.sample(2,NaN,true),2);
});
