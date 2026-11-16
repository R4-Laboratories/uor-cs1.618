import {updateBanditWeight} from '../../shared/r4-synthesis.generated';
import {measureExperience} from './measure-experience';
import {measureArt,measureTactics} from './measure-creative';
import {existsSync} from 'node:fs';
import {validateArt,validateTactics} from '../../shared/creative-program';
import type {Family} from './generate';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {AdmissionKernel} from './admission';
import {validateState,generatedFiles,type EvolutionState} from './generate';
import {chooseCandidates,evaluateEvidence,type Evidence} from './policy';
import {measureNavigation,measureRendering,hash} from './measure';
import {contextDigest,digest,outputHashes,ownedPaths,preserveOwned,writeState} from './state';
const apply=process.argv.includes('--apply');
const status=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
if(status)throw Error('Evolution requires a clean checkout. Commit or stash human edits first.');
const base=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const original=preserveOwned();
const state:EvolutionState=JSON.parse(readFileSync('model/evolution/state.json','utf8')),policy=JSON.parse(readFileSync('model/evolution/policy.json','utf8'));
validateState(state,policy);const context=contextDigest();
const requested=process.env.CS_EVOLUTION_FAMILY||process.argv.find(a=>a.startsWith('--family='))?.slice(9);
if(requested&&!['auto','art','tactics','render','navigation','experience'].includes(requested))throw Error('Unknown family');
let author:any=null,proposal:undefined|{art:typeof state.config.art;tactics:typeof state.config.tactics};
if(existsSync('artifacts/evolution/author.json')){author=JSON.parse(readFileSync('artifacts/evolution/author.json','utf8'));if(author.base===base&&author.seed===state.seed&&Date.now()-Date.parse(author.created)<3600000&&author.status==='authored'){validateArt(author.proposal.art);validateTactics(author.proposal.tactics);proposal=author.proposal;}}
const candidates=chooseCandidates(state,policy,context,requested==='auto'?undefined:requested as Family|undefined,proposal),kernel=new AdmissionKernel();
mkdirSync('artifacts/evolution',{recursive:true});
const report:any={schema:'cs1618/evolution-tick/1',base,context,started:new Date().toISOString(),apply,author:author?{status:author.status,reason:author.reason}:null,proposals:[],changed:false,accepted:false,checks:false};
const save=()=>writeFileSync('artifacts/evolution/tick.json',JSON.stringify(report,null,2)+'\n');
function restore(){for(const [path,bytes]of original){if(bytes===null)rmSync(path,{force:true});else writeFileSync(path,bytes);}}
function run(command:string,args:string[]){console.log(`Gate: ${command} ${args.join(' ')}`);execFileSync(command,args,{stdio:'inherit',timeout:15*60*1000});}
try{
 if(!candidates.length){report.outcome='settled';save();console.log('Frontier settled: no untried candidate for this source context.');}
 else{
  if(state.context!==context){state.context=context;state.tried=[];}
  let selected:Evidence|null=null;
  for(const choice of candidates){
   const candidate={...choice,config:{...state.config,[choice.family]:choice.config[choice.family]}};
   console.log(`Evaluating ${candidate.id}`);
   for(const [path,source]of Object.entries(generatedFiles({...state,config:candidate.config})))writeFileSync(path,source);
   // Build the exact candidate before the independent browser measurements.
   if(candidate.family==='render'||candidate.family==='art')run('npm',['run','build']);
   const evidence=candidate.family==='experience'?await measureExperience(candidate,state.config):candidate.family==='navigation'?await measureNavigation(candidate,state.config):candidate.family==='render'?await measureRendering(candidate,state.config,policy):candidate.family==='art'?await measureArt(candidate,state.config,policy):await measureTactics(candidate,state.config);
   const obligations=evaluateEvidence(evidence,hash(candidate.config),policy);
   const eligible=obligations.fidelity&&obligations.benefit&&obligations.bounds;
   report.proposals.push({candidate, evidence,eligible});state.tried.push(candidate.id);
   if(eligible){state.config=candidate.config;selected=evidence;break;}
   state.weights[candidate.family]=updateBanditWeight(state.weights[candidate.family],false);
   for(const [path,source]of Object.entries(generatedFiles(state)))writeFileSync(path,source);
  }
  // Stage the selected projection and state for the complete game gates.
  writeState(state);
  run('npm',['run','verify']);run('npm',['run','test:browser']);run('npm',['run','test:peer-browser']);run('npm',['run','test:creative-browser']);run('npm',['run','test:experience-browser']);
  report.checks=true;
  if(selected){
   selected.checks=true;const obligations=evaluateEvidence(selected,hash(state.config),policy);
   if(kernel.decide(obligations)!=='admit')throw Error('Prism rejected the generation after validation');
   state.generation++;state.weights[selected.family as Family]=updateBanditWeight(state.weights[selected.family as Family],true);report.accepted=true;
  }
  const previous=state.history.at(-1)?.hash??'genesis';
  const row={generation:state.generation,author:report.author,at:new Date().toISOString(),base,context,previous,result:selected?'admitted':'no-improvement',proposals:report.proposals.map((p:any)=>({candidate:p.candidate.id,family:p.candidate.family,author:p.candidate.author??'optimizer',metric:p.evidence.metric??'work count',configHash:p.evidence.configHash,baselineWork:p.evidence.baselineWork,candidateWork:p.evidence.candidateWork,fidelity:p.evidence.fidelity,bounds:p.evidence.bounds,samples:p.evidence.samples,comparisons:p.evidence.comparisons??null,reference:p.evidence.reference,before:p.evidence.before,after:p.evidence.after})),checks:'complete-game-gates-passed'};
  state.history.push({...row,hash:digest(row)});state.history=state.history.slice(-policy.historyLimit);
  state.seed=((state.seed<<1)^(state.seed|(state.seed>>>1)))>>>0;
  writeState(state);validateState(state,policy);run('npm',['run','evolution:check']);
  report.outcome=selected?'admitted':'no-improvement';report.generation=state.generation;report.changed=true;report.outputs=outputHashes();report.completed=new Date().toISOString();
  if(!apply){restore();report.changed=false;report.previewOnly=true;}
  save();console.log(`Evolution ${report.outcome}; generation ${state.generation}; ${apply?'outputs ready for publication':'preview restored source'}.`);
 }
}catch(error){restore();report.outcome='failed';report.error=(error as Error).message;report.changed=false;save();throw error;}
