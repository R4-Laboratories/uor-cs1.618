import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createIdentity,signIdentity} from '../shared/hologram-identity';
import {HologramPolicy} from '../shared/hologram-policy';
const modulePath='../shared/match-discovery.ts';
const discovery:any=await import(modulePath).catch(()=>({}));
const app='https://game.example',now=Date.now();
const room={room:'012345abcdef',token:'1'.repeat(32)};
const fields={...room,name:'Public host',players:1,capacity:10,map:'meridian',signaling:'peerjs-cloud'};
const policy=await HologramPolicy.load(readFileSync('public/app.holo'));
const encode=(p:any)=>new TextEncoder().encode(JSON.stringify(p));

test('directory admits a real Stitch signature through the compiled Holo and expires the lease',async()=>{
 assert.equal(typeof discovery.MatchRecords,'function','Verified match directory is not implemented');
 const host=await createIdentity(),records=new discovery.MatchRecords(app,policy);
 const proof=await discovery.signListing(host,app,fields,now);
 assert.equal(await records.accept(encode(proof),now),true);
 assert.equal(records.list(now)[0].prism,host.prism);
 assert.equal(records.list(now)[0].name,'Public host');
 assert.equal(records.list(now+45000).length,0);
});
test('tampering, wrong audience, stale/future records, withdrawal replay and endpoint substitution are refused',async()=>{
 assert.equal(typeof discovery.MatchRecords,'function','Verified match directory is not implemented');
 const host=await createIdentity(),records=new discovery.MatchRecords(app,policy);
 const proof=await discovery.signListing(host,app,fields,now);
 for(const bad of [structuredClone(proof),await discovery.signListing(host,'https://other.example',fields,now),await discovery.signListing(host,app,fields,now-45001),await discovery.signListing(host,app,fields,now+10000)]){
  if(bad===undefined)continue;
  if(bad.envelope.body.payload.payload.at===now&&bad.envelope.body.audience===app)bad.envelope.body.payload.payload.token='2'.repeat(32);
  assert.equal(await records.accept(encode(bad),now),false);
 }
 assert.equal(await records.accept(encode(proof),now),true);
 assert.equal(await records.accept(encode(proof),now),false);
 const withdrawal=await discovery.signListing(host,app,fields,now+1,true);
 assert.equal(await records.accept(encode(withdrawal),now+1),true);
 assert.equal(records.list(now+1).length,0);
 assert.equal(await records.accept(encode(proof),now+1),false);
 for(const signaling of ['https://evil.example/signal','javascript:alert(1)','http://127.0.0.1:123/signal']){
  const forged=await signIdentity(host,app,'cs1618/matches/1',{...proof.envelope.body.payload.payload,signaling},now);
  assert.equal(await records.accept(encode(forged),now),false);
 }
});
test('untrusted input, pending verifications and room state remain bounded',async()=>{
 assert.equal(typeof discovery.MatchRecords,'function','Verified match directory is not implemented');
 const records=new discovery.MatchRecords(app,policy),host=await createIdentity();
 assert.equal(await records.accept(new Uint8Array(131073),now),false);
 assert.equal(await records.accept(encode({records:new Array(33).fill({})}),now),false);
 const proof=await discovery.signListing(host,app,fields,now);
 assert.equal(await records.accept(encode({...proof,records:new Array(33).fill(proof.records[0])}),now),false);
 const results=await Promise.all(Array.from({length:20},()=>records.accept(encode(proof),now)));
 assert.equal(results.filter(Boolean).length,1,'Concurrent duplicates cannot pass');
 for(let i=0;i<80;i++)await records.accept(encode(await discovery.signListing(host,app,{...fields,room:i.toString(16).padStart(12,'0')},now)),now);
 assert.ok(records.list(now).length<=64);
});
test('fresh live proof binds Prism, room, token, both transport peers and endpoint',async()=>{
 assert.equal(typeof discovery.verifyHostProof,'function','Live host proof is not implemented');
 const host=await createIdentity(),other=await createIdentity();
 const binding={...room,hostPeer:'cs1618-v2-'+room.room,guestPeer:'cs1618-v2-guest-test',signaling:'peerjs-cloud',challenge:'a'.repeat(64)};
 const proof=await discovery.signHostProof(host,app,binding,now);
 await discovery.verifyHostProof(proof,host.prism,app,binding,policy,now);
 for(const altered of [{...binding,token:'2'.repeat(32)},{...binding,room:'0'.repeat(12)},{...binding,hostPeer:'substitute'},{...binding,guestPeer:'other-guest'},{...binding,challenge:'b'.repeat(64)},{...binding,signaling:'other'}])await assert.rejects(discovery.verifyHostProof(proof,host.prism,app,altered,policy,now));
 await assert.rejects(discovery.verifyHostProof(proof,other.prism,app,binding,policy,now));
 await assert.rejects(discovery.verifyHostProof(await discovery.signHostProof(other,app,binding,now),host.prism,app,binding,policy,now));
 await assert.rejects(discovery.verifyHostProof(proof,host.prism,app,binding,policy,now+15001));
});
test('short signed withdrawals or replacements cannot erase rollback protection',async()=>{
 const host=await createIdentity(),proof=await discovery.signListing(host,app,fields,now);
 for(const withdrawn of [true,false]){
  const records=new discovery.MatchRecords(app,policy);
  assert.equal(await records.accept(encode(proof),now),true);
  const shortened=await signIdentity(host,app,'cs1618/matches/1',{...proof.envelope.body.payload.payload,at:now+1,expires:now+2,withdrawn},now+1);
  assert.equal(await records.accept(encode(shortened),now+1),false,'Only exact 45-second leases may change ordering state');
  assert.equal(await records.accept(encode(proof),now+3),false);
 }
});
test('a delayed older verification cannot undo an already-admitted withdrawal',async()=>{
 const host=await createIdentity(),proof=await discovery.signListing(host,app,fields,now),withdrawal=await discovery.signListing(host,app,fields,now+1,true);
 let entered!:()=>void,release!:()=>void;const held=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);let calls=0;
 // Delay scheduling only: both admissions still execute the actual compiled Holo.
 const scheduledPolicy={admits:async(facts:any)=>{const admitted=await policy.admits(facts);if(++calls===1){entered();await held;}return admitted;}};
 const records=new discovery.MatchRecords(app,scheduledPolicy);
 const older=records.accept(encode(proof),now+1);await started;
 assert.equal(await records.accept(encode(withdrawal),now+1),true);release();
 assert.equal(await older,false);assert.equal(records.list(now+1).length,0);
 assert.equal(await records.accept(encode(proof),now+3),false);
});
test('same-origin blob and non-HTTP signaling endpoints never enter the directory',async()=>{
 const host=await createIdentity(),proof=await discovery.signListing(host,app,fields,now),records=new discovery.MatchRecords(app,policy);
 for(const signaling of ['blob:https://game.example/example','ftp://game.example/','data:text/plain,hello','javascript:alert(1)']){
  assert.equal(discovery.supportedSignaling(signaling,app),false);
  const signed=await signIdentity(host,app,'cs1618/matches/1',{...proof.envelope.body.payload.payload,signaling},now);
  assert.equal(await records.accept(encode(signed),now),false);
 }
});
