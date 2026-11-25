import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {careerTotals,mergeRow,backupCareer,verifyBackup,type CareerRow} from '../shared/career';
import {createIdentity,sealCareer,verifyCareerSeal} from '../shared/hologram-identity';
import {CareerRecorder} from '../src/career-recorder';
import {Match} from '../server/match';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';

const row:CareerRow={seat:'0'.repeat(32),mode:'multiplayer',kills:3,deaths:2};
const app='https://r4-laboratories.github.io';
const settle=()=>new Promise(resolve=>setTimeout(resolve,5));

test('career merges repeated, older and skipped receipts per seat and separates practice',()=>{
  assert.deepEqual(mergeRow(row,{...row,kills:2}),row);
  assert.deepEqual(mergeRow(row,{...row,kills:5,deaths:1}),{...row,kills:5});
  assert.throws(()=>mergeRow(row,{...row,mode:'practice'}));
  assert.throws(()=>mergeRow(undefined,{...row,kills:-1}));
  const rows=[row,{...row,seat:'f'.repeat(32),mode:'practice' as const,kills:9,deaths:0}];
  assert.deepEqual(careerTotals(rows,'multiplayer'),{kills:3,deaths:2,ratio:'1.50'});
  assert.equal(careerTotals(rows,'practice').ratio,'∞');assert.equal(careerTotals([],'practice').ratio,'—');
});
test('career retries after storage failure and coalesces delayed key checks',async t=>{
  const start=Date.now();t.mock.method(Date,'now',()=>start);
  let ready!:(key:string)=>void,attempts=0;
  const writes:CareerRow[]=[];
  const recorder=new CareerRecorder('practice',new Promise(resolve=>ready=resolve),async(owner,rows)=>{
    assert.equal(owner,'signed-owner');if(++attempts===1)throw Error('quota');writes.push(...rows);
  },()=>{});
  recorder.observe(row);recorder.observe({...row,kills:4});ready('signed-owner');await settle();
  recorder.observe(row);assert.equal(attempts,1);
  t.mock.method(Date,'now',()=>start+2100);
  recorder.observe({...row,kills:8});await settle();recorder.observe(row);await settle();
  assert.deepEqual(writes,[{...row,mode:'practice',kills:8}]);
});
test('backup signature binds the owning Prism, every counter, purpose and origin',async()=>{
  const session=await createIdentity(),key={owner:session.prism,session};
  const other=await createIdentity(),otherKey={owner:other.prism,session:other};
  const signed=await backupCareer(key,app,[row]);
  assert.deepEqual(await verifyBackup(signed,key,app),[row]);
  await assert.rejects(verifyBackup(signed,otherKey,app));
  await assert.rejects(verifyBackup({...signed,owner:otherKey.owner},otherKey,app));
  await assert.rejects(verifyBackup(signed,key,'https://other.example'));
  await assert.rejects(verifyBackup({...signed,rows:[{...row,kills:5}]},key,app));
  await assert.rejects(verifyBackup({...signed,rows:[row,row]},key,app));
  const at=Date.now(),seal=await sealCareer(key,app,'session','challenge',at);
  await assert.rejects(verifyCareerSeal(seal,key.owner,app,'backup','challenge',at));
  await assert.rejects(verifyCareerSeal(seal,key.owner,app,'session','challenge',at+61000));
});
test('host receipt spans scoreboard reset and assigns a fresh seat after reconnect',async()=>{
  const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
  const kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
  const m=new Match('CAREER',engine,kernel),p=m.join('p','Pilot','attack')!;m.join('other','Other','defend');
  p.kills=3;p.deaths=2;
  const receipt=m.snapshot('p').self.career!;
  assert(!(m.snapshot('other').players[0] as any).career);
  m.phase='matchEnd';m.phaseLeft=0;m.step(1/60);
  assert.equal(p.kills,0);assert.deepEqual(m.snapshot('p').self.career,receipt);
  m.leave('p');m.join('p','Pilot','attack');
  const next=m.snapshot('p').self.career!;assert.notEqual(next.seat,receipt.seat);
  assert.deepEqual([next.kills,next.deaths],[0,0]);
});
