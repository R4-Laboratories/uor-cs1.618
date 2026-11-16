import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('HD worker retries a transient engine download failure and then generates real geometry',async()=>{
 const bytes=await readFile('public/wasm/cs_verdant.wasm');const originalFetch=globalThis.fetch,originalSelf=(globalThis as any).self;
 const messages:any[]=[];let downloads=0;const worker={postMessage:(m:any)=>messages.push(m),onmessage:null as any};
 (globalThis as any).self=worker;
 globalThis.fetch=async()=>{downloads++;if(downloads===1)throw Error('temporary download failure');return new Response(bytes);};
 try{await import('../src/hd-worker');
  await worker.onmessage({data:{id:1,lod:0,engineUrl:'https://example.invalid/engine.wasm'}});assert.match(messages[0].error,/temporary/);
  await worker.onmessage({data:{id:2,lod:0,engineUrl:'https://example.invalid/engine.wasm'}});
  assert.equal(downloads,2);assert.equal(messages[1].error,undefined);assert.equal(messages[1].assets.length,3);assert(messages[1].assets[0].indices.length>100);
 }finally{globalThis.fetch=originalFetch;(globalThis as any).self=originalSelf;}
});
