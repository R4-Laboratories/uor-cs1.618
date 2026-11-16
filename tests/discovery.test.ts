import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discover} from '../scripts/evolution/discover';
const a='a'.repeat(40),b='b'.repeat(40);
const catalog={schema:'cs1618/source-catalog/1',sources:[{repository:'afflom/verdant-engine',commit:a},{repository:'afflom/verdant-resonance',commit:a}]};
test('source discovery distinguishes verified current pins from available updates',()=>{
 const calls:string[]=[];const report=discover(catalog,repo=>{calls.push(repo);return {sha:repo.endsWith('engine')?a:b};});
 assert.deepEqual(calls,catalog.sources.map(s=>s.repository));assert.equal(report.complete,true);assert.equal(report.checked,2);
 assert.deepEqual(report.sources.map(s=>s.status),['unchanged','review-available']);assert.equal(report.sources[1].observed,b);
});
test('unavailable or malformed responses cannot produce a successful discovery receipt',()=>{
 for(const lookup of [()=>{throw Error('credential-like data must not be logged');},()=>({sha:'OK'}),()=>null]){
  const report=discover(catalog,lookup);assert.equal(report.complete,false);assert.equal(report.checked,0);assert.equal(report.total,2);assert(report.sources.every(s=>s.status==='unavailable'));assert(!JSON.stringify(report).includes('credential-like'));
 }
 let n=0;const partial=discover(catalog,()=>++n===1?{sha:a}:{});assert.equal(partial.checked,1);assert.equal(partial.complete,false);
});
test('invalid catalogues are rejected before any GitHub lookup',()=>{
 for(const invalid of [{...catalog,sources:[]},{...catalog,schema:'other'},{...catalog,sources:[{repository:'x/y;echo surprise',commit:a}]},{...catalog,sources:[{repository:'x/y',commit:'main'}]}]){
  let calls=0;assert.throws(()=>discover(invalid,()=>{calls++;return {sha:a};}));assert.equal(calls,0);
 }
});
