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
import state from '../model/evolution/state.json';
import policy from '../model/evolution/policy.json';
test('free experience synthesis emits measured candidates, detects interactions and settles',async()=>{
 const candidates=chooseCandidates(state as any,policy,'new','experience');assert(candidates.length>0);
 const evidence=await measureExperience(candidates[0],state.config as any);assert.equal(evidence.fidelity,true);assert.equal(evidence.bounds,true);assert(evidence.candidateWork<evidence.baselineWork);
 assert.equal(evaluateEvidence({...evidence,checks:true},hash(candidates[0].config),policy).admit,true);
 assert.equal(mixedDifference(10,8,7,4),-1);assert.throws(()=>mixedDifference(10,8,NaN,4));
 const tried:string[]=[];for(let i=0;i<100;i++){const batch=chooseCandidates({...state,context:'new',tried} as any,policy,'new','experience');if(!batch.length)break;tried.push(...batch.map(c=>c.id));}
 assert(tried.length>3&&tried.length<100);assert.equal(chooseCandidates({...state,context:'new',tried} as any,policy,'new','experience').length,0);
});
