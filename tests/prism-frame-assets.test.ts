import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import pin from '../model/prism-frame.json';

test('frame dependency mirrors retain exact published hashes and generated map custody',()=>{
 const dependencies=(pin as any).dependencies;assert(Array.isArray(dependencies)&&dependencies.length===2,'Both immutable published dependencies must be in local custody');
 for(const asset of dependencies){const bytes=readFileSync('public/'+asset.path);assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert(asset.url.includes('/'+asset.sha256+'/'));}
 execFileSync(process.execPath,['scripts/prism-frame-assets.mjs','--check']);
});
test('dependency route accepts only exact GET URLs and resolves beneath each app scope',async()=>{
 // @ts-expect-error Native service-worker module is also tested by Node.
 const {assetTarget}=await import('../public/prism-frame-worker.js');
 const url='https://uor-foundation.github.io/template/frame/9e618c80b716a37942a69c82b24b0843c80f612c6c580e5e63a1e5a64bd29e02/prism-panels.mjs';
 for(const scope of ['http://127.0.0.1:3000/','https://example.test/uor-cs1.618/']){
  const target=assetTarget({url,method:'GET'},scope);assert(target);assert.equal(target.href,scope+'prism-frame/9e618c80b716a37942a69c82b24b0843c80f612c6c580e5e63a1e5a64bd29e02/prism-panels.mjs');
  for(const changed of [url+'?changed=1',url.replace('https:','http:'),url.replace('uor-foundation','evil'),url.replace('prism-panels','unknown'),scope+'assets/game.js',scope+'wasm/cs_verdant.wasm',scope+'identity.html'])assert.equal(assetTarget({url:changed,method:'GET'},scope),null);
  assert.equal(assetTarget({url,method:'POST'},scope),null);assert.equal(assetTarget({url,method:'HEAD'},scope),null);
 }
});
test('mirror response rejects altered bytes and unavailable assets without external fallback',async()=>{
 // @ts-expect-error Native service-worker module is also tested by Node.
 const {assetTarget,serveAsset}=await import('../public/prism-frame-worker.js');const asset=(pin as any).dependencies[0],scope='https://example.test/game/',target=assetTarget({url:asset.url,method:'GET'},scope);let calls=0;
 const bytes=readFileSync('public/'+asset.path);
 const valid=await serveAsset(target,async(url:string)=>{calls++;assert.equal(url,target.href);return new Response(bytes);});assert.equal(valid.status,200);assert.deepEqual(Buffer.from(await valid.arrayBuffer()),bytes);assert.equal(calls,1);
 const corrupt=Buffer.from(bytes);corrupt[100]^=1;
 assert.equal((await serveAsset(target,async()=>new Response(corrupt))).status,502);
 assert.equal((await serveAsset(target,async()=>new Response('missing',{status:404}))).status,502);
});
