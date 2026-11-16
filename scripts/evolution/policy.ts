import {synthesizeArt,synthesizeTactics} from '../../shared/creative-program';
import type {Configuration,EvolutionState,Family} from './generate';
export interface Candidate {id:string;family:Family;config:Configuration;author?:string;}
export interface Evidence {family:string;candidate:string;configHash:string;baselineWork:number;candidateWork:number;fidelity:boolean;samples:number;checks:boolean;bounds:boolean;[key:string]:unknown;}
export function evaluateEvidence(e:Evidence,expectedHash:string,policy:any){
 const finite=[e.baselineWork,e.candidateWork,e.samples].every(Number.isFinite);
 const bounds=finite&&e.baselineWork>0&&e.candidateWork>=0&&Number.isSafeInteger(e.samples)&&e.samples>0&&e.configHash===expectedHash&&e.bounds===true;
 const benefit=bounds&&e.candidateWork<e.baselineWork*(1-policy.minimumWorkGain);
 const fidelity=e.fidelity===true,checks=e.checks===true;
 return {admit:bounds&&benefit&&fidelity&&checks,bounds,benefit,fidelity,checks};
}
export function chooseCandidates(state:EvolutionState,policy:any,context:string,family?:Family,proposal?:{art:Configuration['art'];tactics:Configuration['tactics']}):Candidate[]{
 const all:Candidate[]=[];
 for(const cell of policy.navigationCells)all.push({id:`navigation-${cell}`,family:'navigation',config:{...state.config,navigation:{cell}}});
 for(const cell of policy.renderCells)for(const minimum of policy.renderMinimums)all.push({id:`render-${cell}-${minimum}`,family:'render',config:{...state.config,render:{cell,minimum}}});
 for(const kind of ['art','tactics'] as const){
  if(proposal)all.push({id:kind+'-model',family:kind,author:'github-models',config:{...state.config,[kind]:proposal[kind]}});
  for(let i=0;i<policy.creativeAttempts;i++){const seed=(state.seed+i+1)>>>0;all.push({id:kind+'-synth-'+i,family:kind,author:'seeded-synthesis',config:{...state.config,[kind]:kind==='art'?synthesizeArt(seed):synthesizeTactics(seed)}});}
 }
 const tried=new Set(state.context===context?state.tried:[]);
 return all.filter(c=>(!family||c.family===family)&&!tried.has(c.id)&&JSON.stringify(c.config)!==JSON.stringify(state.config))
  .sort((a,b)=>state.weights[b.family]-state.weights[a.family]||a.id.localeCompare(b.id)).slice(0,policy.maxCandidatesPerTick);
}
