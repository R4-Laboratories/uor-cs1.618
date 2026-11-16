import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {HologramPolicy} from '../shared/hologram-policy';
// @ts-expect-error Node registration adapter is JavaScript.
import {registrationPayload,readIndex} from '../scripts/register-prism.mjs';
const bytes=readFileSync('public/app.holo');
test('actual Holo loader replays acceptance and admits only all sixteen required observations',async()=>{
 const policy=await HologramPolicy.load(bytes);for(let n=0;n<16;n++)assert.equal(await policy.admits({origin:!!(n&1),fresh:!!(n&2),signature:!!(n&4),consent:!!(n&8)}),n===15);
 await assert.rejects(policy.admits({origin:1,fresh:true,signature:true,consent:true} as any));
 const tampered=Buffer.from(bytes);tampered[80]^=1;await assert.rejects(HologramPolicy.load(tampered));
});
test('registry registration binds actual Holo fingerprint to the owning repository and Pages origin',async()=>{
 const meta=JSON.parse(readFileSync('public/app.json','utf8')),payload=await registrationPayload(meta,bytes,'R4-Laboratories/uor-cs1.618');assert.equal(payload.name,'cs1.618');assert.match(payload.fingerprint,/^[a-f0-9]{64}$/);
 await assert.rejects(registrationPayload(meta,bytes,'attacker/project'));await assert.rejects(registrationPayload({...meta,live:'https://evil.example/'},bytes,'R4-Laboratories/uor-cs1.618'));
});
test('address-bar index reader refuses altered content and untrusted pointer paths',async()=>{
 const raw=Buffer.from(JSON.stringify({apps:[{name:'cs1.618'}]})),sha=createHash('sha256').update(raw).digest('hex');
 let calls=0;const fetcher=async(url:string)=>{calls++;return new Response(calls===1?JSON.stringify({sha256:sha,path:'https://evil.example'}):raw);};
 assert.equal((await readIndex(fetcher)).apps[0].name,'cs1.618');
 let n=0;await assert.rejects(readIndex(async()=>new Response(++n===1?JSON.stringify({sha256:sha}):'altered')));
 await assert.rejects(readIndex(async()=>new Response(JSON.stringify({sha256:'../evil'}))));
});
