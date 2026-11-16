import {execFileSync} from 'node:child_process';
import {appendFileSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {chooseCandidates} from './policy';
import {validateState} from './generate';
import {contextDigest} from './state';
export interface ChainObservation {enabled:boolean;repo:string;head:string;checkout:string;live:string|null;hasCandidates:boolean;runs:{head_sha:string;status:string}[];trigger:any;}
export function continuationDecision(s:ChainObservation):string{
 if(!s.enabled)return 'disabled';
 const t=s.trigger;
 if(t?.name!=='Verify and publish cs1.618'||t.status!=='completed'||t.conclusion!=='success'||t.head_branch!=='main'||!['push','workflow_dispatch'].includes(t.event)||t.head_repository?.full_name?.toLowerCase()!==s.repo.toLowerCase())return 'ignored';
 if(!/^[a-f0-9]{40}$/.test(s.head)||s.head!==s.checkout||s.head!==t.head_sha)return 'superseded';
 if(!s.hasCandidates)return 'settled';
 // A repeated Pages delivery/retry must not retry a failed tick or dispatch a duplicate.
 if(s.runs.some(r=>r.head_sha===s.head))return 'already-run';
 if(s.live!==s.head)return 'wait-publication';
 return 'dispatch';
}
export async function continueEvolution(observe:()=>Promise<ChainObservation>,dispatch:(s:ChainObservation)=>Promise<void>,wait:()=>Promise<void>,attempts=12):Promise<{decision:string;observation:ChainObservation}>{
 for(let i=0;i<attempts;i++){
  const observation=await observe(),decision=continuationDecision(observation);
  if(decision==='dispatch'){await dispatch(observation);return {decision:'dispatched',observation};}
  if(decision!=='wait-publication')return {decision,observation};
  if(i+1<attempts)await wait();
 }
 throw Error('Verified Pages publication did not become visible; no next tick dispatched.');
}
export async function runContinuation(){
 const repo=process.env.GITHUB_REPOSITORY;if(!repo||!/^[\w.-]+\/[\w.-]+$/.test(repo)||process.env.GITHUB_EVENT_NAME!=='workflow_run')throw Error('Continuation requires a repository workflow completion');
 const trigger=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!,'utf8')).workflow_run;
 const api=(path:string)=>JSON.parse(execFileSync('gh',['api',`repos/${repo}/${path}`],{encoding:'utf8',timeout:30000}));
 const checkout=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const state=JSON.parse(readFileSync('model/evolution/state.json','utf8')),policy=JSON.parse(readFileSync('model/evolution/policy.json','utf8'));validateState(state,policy);
 const hasCandidates=chooseCandidates(state,policy,contextDigest()).length>0;
 const liveUrl=new URL('build.json',JSON.parse(readFileSync('public/app.json','utf8')).live);
 const report:any={schema:'cs1618/evolution-continuation/1',started:new Date().toISOString(),pagesRun:trigger?.id,sourceEvent:process.env.GITHUB_EVENT_NAME};
 mkdirSync('artifacts/evolution-chain',{recursive:true});
 try{
  Object.assign(report,await continueEvolution(async()=>{
   const head=api('commits/main').sha;
   const runs=api(`actions/workflows/evolution.yml/runs?branch=main&head_sha=${head}&per_page=100`).workflow_runs;
   if(!Array.isArray(runs))throw Error('Invalid evolution run history');
   let live:string|null=null;
   try{const response=await fetch(liveUrl,{cache:'no-cache',signal:AbortSignal.timeout(15000)});if(response.ok)live=(await response.json()).commit??null;}catch{}
   return {enabled:process.env.CS_EVOLUTION!=='off',repo,head,checkout,live,hasCandidates,runs,trigger};
  },async()=>{
   execFileSync('gh',['workflow','run','evolution.yml','--repo',repo,'--ref','main','-f','family=auto','-f',`continuation_from=${trigger.id}`],{stdio:'inherit',timeout:30000});
  },()=>new Promise(resolve=>setTimeout(resolve,10000))));
 }catch(error){report.decision='failed';report.error=(error as Error).message;throw error;}
 finally{
  report.completed=new Date().toISOString();writeFileSync('artifacts/evolution-chain/continuation.json',JSON.stringify(report,null,2)+'\n');
  const summary=`Evolution continuation: **${report.decision}** after [Pages run ${trigger?.id}](https://github.com/${repo}/actions/runs/${trigger?.id}). ${report.error??''}\n\n[Watch evolution ticks](https://github.com/${repo}/actions/workflows/evolution.yml). A settled frontier needs new tested recipes or source changes; a failed gate stops the chain.\n`;
  console.log(summary);if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runContinuation();
