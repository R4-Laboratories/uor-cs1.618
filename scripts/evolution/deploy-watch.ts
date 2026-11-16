import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export interface DeploymentState {ageSeconds:number;liveSha:string|null;head:string;runs:any[];failedJobs?:string[];}
export function deploymentDecision(s:DeploymentState):'current'|'wait'|'dispatch'|'retry-deploy'|'blocked'{
 if(s.liveSha===s.head)return 'current';
 const runs=s.runs.filter(r=>r.head_sha===s.head&&['push','workflow_dispatch'].includes(r.event)).sort((a,b)=>b.id-a.id);
 const latest=runs[0];if(!latest)return s.ageSeconds<300?'wait':'dispatch';
 if(latest.status!=='completed')return 'wait';
 if(latest.conclusion==='success')return s.ageSeconds<600?'wait':runs.length<2?'dispatch':'blocked';
 if(latest.conclusion==='failure'&&latest.run_attempt===1&&s.failedJobs?.length===1&&s.failedJobs[0]==='deploy')return 'retry-deploy';
 return 'blocked';
}
export function watch(){
 const repo=process.env.GITHUB_REPOSITORY;if(!repo||!/^[\w.-]+\/[\w.-]+$/.test(repo))throw Error('Missing repository');
 const api=(path:string,...args:string[])=>JSON.parse(execFileSync('gh',['api',`repos/${repo}/${path}`,...args],{encoding:'utf8'}));
 const commit=api('commits/main'),head=commit.sha;
 const runs=api(`actions/workflows/pages.yml/runs?branch=main&head_sha=${head}&per_page=20`).workflow_runs;
 const latest=runs.filter((r:any)=>r.head_sha===head&&['push','workflow_dispatch'].includes(r.event)).sort((a:any,b:any)=>b.id-a.id)[0];let failedJobs:string[]=[];
 if(latest?.status==='completed'&&latest.conclusion==='failure')failedJobs=api(`actions/runs/${latest.id}/jobs`).jobs.filter((j:any)=>j.conclusion==='failure'||j.conclusion==='timed_out'||j.conclusion==='cancelled').map((j:any)=>j.name);
 // The served stamp, rather than a green workflow alone, establishes publication.
 const pages=api('pages');
 return fetch(`${pages.html_url}build.json?head=${head}`,{signal:AbortSignal.timeout(15000)}).then(async response=>{
  let liveSha:string|null=null;if(response.ok){try{liveSha=(await response.json()).commit??null;}catch{}}
  const decision=deploymentDecision({head,liveSha,ageSeconds:(Date.now()-Date.parse(commit.commit.committer.date))/1000,runs,failedJobs});
  const summary=`Deployment watch: ${decision}. main=${head}; served=${liveSha??'unknown'}.`;
  console.log(summary);if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
  if(decision==='dispatch')execFileSync('gh',['api','-X','POST',`repos/${repo}/actions/workflows/pages.yml/dispatches`,'-f','ref=main'],{stdio:'inherit'});
  if(decision==='retry-deploy')execFileSync('gh',['api','-X','POST',`repos/${repo}/actions/runs/${latest.id}/rerun-failed-jobs`],{stdio:'inherit'});
  if(decision==='blocked')throw Error('Deployment validation blocked; see the Pages workflow. No gate bypass or automatic code revert.');
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await watch();
