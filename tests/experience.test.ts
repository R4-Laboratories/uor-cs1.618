import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sprayOffset,shotSpread,qualityStep,audioProfile,validateExperience,DEFAULT_EXPERIENCE} from '../shared/experience';
import {WEAPONS} from '../shared/config';
test('spray is repeatable, finite, weapon specific and rewards stationary crouched bursts',()=>{
 const rifle=WEAPONS.kestrel;
 assert.deepEqual(sprayOffset(rifle,0),{yaw:0,pitch:0});
 const spray=Array.from({length:30},(_,i)=>sprayOffset(rifle,i));
 assert.deepEqual(spray,Array.from({length:30},(_,i)=>sprayOffset(rifle,i)));
 assert(spray.some(p=>p.yaw<0)&&spray.some(p=>p.yaw>0));
 assert.notDeepEqual(spray,Array.from({length:30},(_,i)=>sprayOffset(WEAPONS.m4,i)));
 for(const p of spray)assert(Math.abs(p.yaw)<=.08&&p.pitch>=0&&p.pitch<=.18);
 const standing=shotSpread(rifle,0,true,false,false);
 assert(shotSpread(rifle,0,true,true,false)<standing);
 assert(shotSpread(rifle,5.8,true,false,false)>standing*3);
 assert(shotSpread(rifle,0,false,false,false)>standing*5);
 assert(shotSpread(WEAPONS.scout,0,true,false,true)<shotSpread(WEAPONS.scout,0,true,false,false));
});
test('adaptive resolution has hysteresis, finite limits and ignores background stalls',()=>{
 let state={scale:1,slow:0,fast:0};
 for(let i=0;i<180;i++)state=qualityStep(state,1/30,DEFAULT_EXPERIENCE);
 assert(state.scale<1&&state.scale>=.7);
 const low=state.scale;
 for(let i=0;i<120;i++)state=qualityStep(state,1/60,DEFAULT_EXPERIENCE);
 assert.equal(state.scale,low);
 for(let i=0;i<900;i++)state=qualityStep(state,1/60,DEFAULT_EXPERIENCE);
 assert(state.scale>low);
 const paused=qualityStep(state,5,DEFAULT_EXPERIENCE);assert.equal(paused.scale,state.scale);assert.equal(paused.fast,0);
 for(let i=0;i<5000;i++)state=qualityStep(state,.08,DEFAULT_EXPERIENCE);
 assert.equal(state.scale,.7);
});
test('sound profiles distinguish weapons, lower occluded frequencies and bound resources',()=>{
 const sounds=Object.keys(WEAPONS).map(w=>audioProfile('shot',w,false));
 assert.equal(new Set(sounds.map(s=>s.cutoff)).size,5);
 for(const w of Object.keys(WEAPONS)){const a=audioProfile('shot',w,false),b=audioProfile('shot',w,true);assert(b.cutoff<a.cutoff);assert(a.duration<=.5&&a.level<=.5);}
 validateExperience(DEFAULT_EXPERIENCE);
 for(const patch of [{voices:10000},{recoveryMs:0},{downMs:NaN},{extra:'code'}])assert.throws(()=>validateExperience({...DEFAULT_EXPERIENCE,...patch}));
});
import {measureExperience,mixedDifference} from '../scripts/evolution/measure-experience';
import {chooseCandidates,evaluateEvidence} from '../scripts/evolution/policy';
import {hash} from '../scripts/evolution/measure';
import currentState from '../model/evolution/state.json';
// The gate must remain valid after any admitted experience configuration.
const state={...currentState,config:{...currentState.config,experience:DEFAULT_EXPERIENCE}};
import policy from '../model/evolution/policy.json';
test('free experience synthesis emits measured candidates, detects interactions and settles',async()=>{
 const candidates=chooseCandidates(state as any,policy,'new','experience');assert(candidates.length>0);
 const evidence=await measureExperience(candidates[0],state.config as any);assert.equal(evidence.fidelity,true);assert.equal(evidence.bounds,true);assert(evidence.candidateWork<evidence.baselineWork);
 assert.equal(evaluateEvidence({...evidence,checks:true},hash(candidates[0].config),policy).admit,true);
 assert.equal(mixedDifference(10,8,7,4),-1);assert.throws(()=>mixedDifference(10,8,NaN,4));
 const tried:string[]=[];for(let i=0;i<100;i++){const batch=chooseCandidates({...state,context:'new',tried} as any,policy,'new','experience');if(!batch.length)break;tried.push(...batch.map(c=>c.id));}
 assert(tried.length>3&&tried.length<100);assert.equal(chooseCandidates({...state,context:'new',tried} as any,policy,'new','experience').length,0);
});
import {admitParetoSynthesisTick,updateBanditWeight} from '../shared/r4-synthesis.generated';
test('imported LexLean-R4 decision model rejects defects, regressions and invalid weights',()=>{
 for(let w=1;w<=16;w++){assert.equal(updateBanditWeight(w,true),Math.min(16,w+2));assert.equal(updateBanditWeight(w,false),Math.max(1,w-1));}
 let count=0;for(const candidateDefects of [0,1])for(const ratchetClean of [false,true])for(const banditWeight of [0,1,8,16,17])for(const score of [899,900,901])for(const complexity of [11,12,13]){
  const c={candidateDefects,ratchetClean,banditWeight,candidateScoreMilli:score,incumbentScoreMilli:900,candidateComplexity:complexity,incumbentComplexity:12};
  const expected=candidateDefects?'RefusedNonZeroDefect':!ratchetClean?'RefusedRatchetViolation':banditWeight<1||banditWeight>16?'RefusedWeightOutOfBounds':score>=900&&complexity<=12&&(score>900||complexity<12)?'CandidateAdmitted':'RefusedNotParetoImproving';
  assert.equal(admitParetoSynthesisTick(c),expected);count++;
 }assert.equal(count,180);
});
import {compileR4} from '../scripts/evolution/r4-model';
import r4Model from '../model/development/r4-decisions.json';
test('R4 compiler refuses executable escape hatches and non-natural interop values',()=>{
 assert.throws(()=>compileR4({...r4Model,declarations:r4Model.declarations.map(d=>({...d,body:{kind:'javascript',source:'process.exit()'}}))}));
 assert.throws(()=>updateBanditWeight(NaN,true));assert.throws(()=>updateBanditWeight(-1,false));
});
test('R4 experience admission refuses an aggregate win that worsens a protected axis',async()=>{
 const before={...state.config,experience:{...DEFAULT_EXPERIENCE,recoveryMs:280}};
 const config={...before,experience:{...before.experience,recoveryMs:320,voices:16}};
 const result=await measureExperience({id:'tradeoff',family:'experience',config:config as any},before as any);
 assert(result.candidateWork<result.baselineWork,'Fixture must improve the aggregate');assert.equal(result.fidelity,false);assert.equal(result.r4Verdict,'RefusedNonZeroDefect');
 assert.equal(evaluateEvidence({...result,checks:true},hash(config),policy).admit,false);
});
