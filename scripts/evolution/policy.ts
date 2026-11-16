import type {Configuration,EvolutionState} from './generate';
export interface Candidate {id:string;family:'render'|'navigation';config:Configuration;}
export interface Evidence {family:string;candidate:string;configHash:string;baselineWork:number;candidateWork:number;fidelity:boolean;samples:number;checks:boolean;bounds:boolean;[key:string]:unknown;}
export function evaluateEvidence(e:Evidence,expectedHash:string,policy:any){
 const finite=[e.baselineWork,e.candidateWork,e.samples].every(Number.isFinite);
 const bounds=finite&&e.baselineWork>0&&e.candidateWork>=0&&Number.isSafeInteger(e.samples)&&e.samples>0&&e.configHash===expectedHash&&e.bounds===true;
 const benefit=bounds&&e.candidateWork<e.baselineWork*(1-policy.minimumWorkGain);
 const fidelity=e.fidelity===true,checks=e.checks===true;
 return {admit:bounds&&benefit&&fidelity&&checks,bounds,benefit,fidelity,checks};
}
export function chooseCandidates(state:EvolutionState,policy:any,context:string):Candidate[]{
 const all:Candidate[]=[];
 for(const cell of policy.navigationCells)all.push({id:`navigation-${cell}`,family:'navigation',config:{...state.config,navigation:{cell}}});
 for(const cell of policy.renderCells)for(const minimum of policy.renderMinimums)all.push({id:`render-${cell}-${minimum}`,family:'render',config:{...state.config,render:{cell,minimum}}});
 const tried=new Set(state.context===context?state.tried:[]);
 return all.filter(c=>!tried.has(c.id)&&JSON.stringify(c.config)!==JSON.stringify(state.config))
  .sort((a,b)=>state.weights[b.family]-state.weights[a.family]||a.id.localeCompare(b.id)).slice(0,policy.maxCandidatesPerTick);
}
