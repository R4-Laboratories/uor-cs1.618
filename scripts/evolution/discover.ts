import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
interface Source {repository:string;commit:string;}
interface Catalog {schema:string;sources:Source[];}
export function discover(catalog:Catalog,lookup:(repository:string)=>unknown){
 if(catalog.schema!=='cs1618/source-catalog/1'||!Array.isArray(catalog.sources)||!catalog.sources.length)throw Error('Invalid source catalogue');
 for(const source of catalog.sources)if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository)||!/^[a-f0-9]{40}$/.test(source.commit))throw Error('Invalid source catalogue');
 const sources=catalog.sources.map(source=>{
  try{
   const body=lookup(source.repository) as {sha?:unknown};
   if(typeof body?.sha!=='string'||!/^[a-f0-9]{40}$/.test(body.sha))return {repository:source.repository,pinned:source.commit,status:'unavailable',reason:'invalid-github-response'};
   return {repository:source.repository,pinned:source.commit,observed:body.sha,status:body.sha===source.commit?'unchanged':'review-available'};
  }catch{return {repository:source.repository,pinned:source.commit,status:'unavailable',reason:'github-api-failed'};}
 });
 const checked=sources.filter(s=>s.status!=='unavailable').length;
 return {schema:'cs1618/source-discovery/2',at:new Date().toISOString(),catalogHash:createHash('sha256').update(JSON.stringify(catalog)).digest('hex'),complete:checked===sources.length,checked,total:sources.length,sources,execution:'metadata only; no source imports or automatic dependency updates'};
}
export function runDiscovery(){
 const catalog:Catalog=JSON.parse(readFileSync('model/development/sources.json','utf8'));
 // gh uses the runner's authenticated GitHub connection. Never execute source content.
 const report=discover(catalog,repository=>JSON.parse(execFileSync('gh',['api',`repos/${repository}/commits/HEAD`],{encoding:'utf8',timeout:25000,stdio:['ignore','pipe','pipe']})));
 mkdirSync('artifacts/development',{recursive:true});
 writeFileSync('artifacts/development/discovery.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,`Source discovery: ${report.checked}/${report.total} repositories checked; ${report.sources.filter(s=>s.status==='review-available').length} updates available. ${report.complete?'Complete.':'Incomplete; see the retained discovery report.'}\n`);
 if(!report.complete)throw Error(`Source discovery incomplete: ${report.checked}/${report.total} repositories checked`);
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)runDiscovery();
