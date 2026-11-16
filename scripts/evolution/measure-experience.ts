import {admitParetoSynthesisTick} from '../../shared/r4-synthesis.generated';
import ts from 'typescript';
import {runInNewContext} from 'node:vm';
import {compileExperience,qualityStep,validateExperience,type Experience} from '../../shared/experience';
import type {Configuration} from './generate';
import type {Candidate,Evidence} from './policy';
import {hash} from './measure';
// Discrete mixed difference, not a claim of a differentiable game objective.
export function mixedDifference(base:number,a:number,b:number,ab:number){
 if(![base,a,b,ab].every(Number.isFinite))throw Error('Invalid interaction measurement');
 return ab-a-b+base;
}
export function scoreExperience(config:Experience,heldOut=false){
 validateExperience(config);
 // Execute the source produced by the trusted compiler, not a model-supplied body.
 const exports:any={};runInNewContext(ts.transpileModule(compileExperience(config),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:(name:string)=>{if(name!=='./experience')throw Error('Unexpected generated import');return {qualityStep};}},{timeout:1000});
 const delays=heldOut?[.29,.33,.37,.43,.48]:[.28,.32,.36,.42,.5];
 const late=delays.filter(d=>!exports.recoveredBurst(d)).length;
 const guarded=![0,.1,.2,.25].some(d=>exports.recoveredBurst(d))&&[.5,1,10].every(d=>exports.recoveredBurst(d));
 let quality={scale:1,slow:0,fast:0},pixelWork=0;const scales:number[]=[];
 // Same immutable frame trace for both candidates; excludes pauses and startup.
 const frames=heldOut?420:360;
 for(let i=0;i<frames;i++){const dt=heldOut?(i%7===0?1/42:1/29):1/30;quality=exports.adaptQuality(quality,dt);pixelWork+=quality.scale**2;scales.push(quality.scale);}
 const loadWork=pixelWork/frames;
 const lower=quality.scale;for(let i=0;i<90;i++)quality=exports.adaptQuality(quality,1/60);
 const noThrash=quality.scale===lower;
 const beforePause=quality.scale;quality=exports.adaptQuality(quality,8);
 const pauseSafe=quality.scale===beforePause&&quality.slow===0&&quality.fast===0;
 let voices=0;for(let i=0;i<100;i++)if(exports.admitVoice(voices))voices++;
 const sounds=voices>=16&&voices<=32&&!exports.admitVoice(-1)&&!exports.admitVoice(1.5);
 const fidelity=guarded&&noThrash&&pauseSafe&&sounds&&scales.every(s=>s>=.7&&s<=1);
 // Explicit engineering targets, not perceptual quality or a fun score.
 const loss=1+late/5+loadWork+voices/32;
 return {loss,lateBursts:late,loadPixelRatio:loadWork,voiceHighWater:voices,frames,fidelity};
}
export async function measureExperience(candidate:Candidate,before:Configuration):Promise<Evidence>{
 const baseline=scoreExperience(before.experience),after=scoreExperience(candidate.config.experience),holdBefore=scoreExperience(before.experience,true),holdAfter=scoreExperience(candidate.config.experience,true);
 // Keep every measured axis non-regressing, then apply the imported R4 model.
 const axes=['lateBursts','loadPixelRatio','voiceHighWater'] as const;
 const fidelity=after.fidelity&&holdAfter.fidelity&&axes.every(k=>after[k]<=baseline[k]&&holdAfter[k]<=holdBefore[k]);
 const r4Verdict=admitParetoSynthesisTick({candidateDefects:fidelity?0:1,ratchetClean:fidelity,banditWeight:8,candidateScoreMilli:Math.round(1000/after.loss),incumbentScoreMilli:Math.round(1000/baseline.loss),candidateComplexity:compileExperience(candidate.config.experience).length,incumbentComplexity:compileExperience(before.experience).length});
 // Attribute pair effects using actual evaluations of the four configurations.
 const changed=(Object.keys(before.experience) as (keyof Experience)[]).filter(k=>before.experience[k]!==candidate.config.experience[k]);
 const interactions=[];
 for(let i=0;i<changed.length;i++)for(let j=i+1;j<changed.length;j++){
  const a=changed[i],b=changed[j],one={...before.experience,[a]:candidate.config.experience[a]},two={...before.experience,[b]:candidate.config.experience[b]},both={...one,[b]:candidate.config.experience[b]};
  interactions.push({a,b,mixedLoss:mixedDifference(baseline.loss,scoreExperience(one).loss,scoreExperience(two).loss,scoreExperience(both).loss)});
 }
 return {family:'experience',r4Verdict,candidate:candidate.id,configHash:hash(candidate.config),baselineWork:baseline.loss,candidateWork:after.loss,fidelity,bounds:after.fidelity,samples:baseline.frames+holdBefore.frames,checks:false,metric:'burst recovery + synthetic overloaded-frame pixel work + bounded audio voices (lower is better)',before:baseline,after,comparisons:{r4Verdict,heldOut:{before:holdBefore,after:holdAfter},interactions},reference:'Fixed engineering contracts; frame traces are synthetic, not measured GPU speed. No claim of improved player preference.'};
}
