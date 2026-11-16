import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindVerifiedKernel} from '../scripts/proof-result.mjs';
import {patchVerifier} from '../scripts/prism-verifier-backport.mjs';
const result={schema:'prismpm/verify-result/1',build_id:'a'.repeat(64),attestation_id:'b'.repeat(64)};
test('proof result binds both published artifacts to the full verified build',()=>{
  for(const project of ['round','evolution','identity']){
    const read=(path:string)=>Buffer.from(path.endsWith('.wasm')?'wasm':'holo');
    const bound=bindVerifiedKernel(project,result,read);
    assert.equal(bound.kernelBinding,'identical');assert.equal(bound.holoBinding,'identical');
  }
});
test('proof result rejects mismatched shipped WASM and Holo independently',()=>{
  for(const extension of ['.wasm','.holo'])assert.throws(()=>bindVerifiedKernel('round',result,(path:string)=>Buffer.from(path.startsWith('public/')&&path.endsWith(extension)?'tampered':'original')),/differs/);
});
test('proof result rejects unsuccessful results and malformed build references',()=>{
  assert.throws(()=>bindVerifiedKernel('round',{schema:'prismpm/error-result/1'}),/Invalid/);
  assert.throws(()=>bindVerifiedKernel('round',{...result,build_id:'../other'}),/Invalid/);
  assert.throws(()=>bindVerifiedKernel('other',result),/Unknown/);
});
test('verifier backport fails closed on any source except the pinned SDK source',()=>{
  assert.throws(()=>patchVerifier('different upstream verifier'),/digest differs/);
});

test('identity proof also binds the discoverable app.holo alias',()=>{
  assert.throws(()=>bindVerifiedKernel('identity',result,(path:string)=>Buffer.from(path==='public/app.holo'?'wrong':'same')),/discoverable Holo differs/);
});
