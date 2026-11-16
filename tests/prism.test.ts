import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRoundKernel} from '../shared/round-kernel';
import {roundDecision} from '../shared/round.generated';
const kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
test('compiled Prism Wasm agrees with all 288 finite decision-table inputs',()=>{
 let count=0;for(const bomb of ['absent','planted','defused','exploded']as const)for(let attackers=0;attackers<=5;attackers++)for(let defenders=0;defenders<=5;defenders++)for(let clock=0;clock<=1;clock++){
  const input={bomb,attackers,defenders,clock};assert.equal(kernel.decide(input),roundDecision(input),JSON.stringify(input));count++;
 }assert.equal(count,288);
});
test('Prism round boundary rejects requests outside the modeled domain',()=>{assert.throws(()=>kernel.decide({bomb:'absent',attackers:6,defenders:1,clock:1}),/Invalid/);assert.throws(()=>kernel.decide({bomb:'absent',attackers:1,defenders:1,clock:NaN}),/Invalid/);});
test('Prism Hologram is a binary HOLO v4 archive, not a JSON surrogate',async()=>{const data=await readFile('public/prism/CS-Round.holo');assert.equal(data.subarray(0,6).toString('hex'),'484f4c4f0400');});
