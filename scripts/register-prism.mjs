import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadArchive} from 'prism-code';
export const REGISTRY='https://registry.uor.foundation';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function registrationPayload(meta,bytes,repository){
 if(meta.repository.toLowerCase()!==`https://github.com/${repository}`.toLowerCase())throw Error('Repository identity mismatch');
 const [owner,name]=repository.split('/'),live=new URL(meta.live);
 if(live.protocol!=='https:'||live.host.toLowerCase()!==`${owner.toLowerCase()}.github.io`||live.pathname!==`/${name}/`)throw Error('Unowned Pages URL');
 const app=await loadArchive(bytes),acceptance=await app.acceptance();if(!acceptance.total||acceptance.failed.length||app.kind!=='holo')throw Error('Holo acceptance failed');
 return {fingerprint:app.identities.archiveFingerprint.replace(/^blake3:/,''),live:live.href,name:meta.name};
}
export async function readIndex(fetcher=fetch){
 const response=await fetcher(`${REGISTRY}/index/current.json`,{cache:'no-cache',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Registry index unavailable');const pointer=await response.json();if(!/^[a-f0-9]{64}$/.test(pointer.sha256))throw Error('Invalid index pointer');
 const snapshot=await fetcher(`${REGISTRY}/index/${pointer.sha256}.json`,{signal:AbortSignal.timeout(20000)});if(!snapshot.ok)throw Error('Registry snapshot unavailable');const bytes=new Uint8Array(await snapshot.arrayBuffer());if(sha(bytes)!==pointer.sha256)throw Error('Registry snapshot integrity mismatch');return JSON.parse(new TextDecoder().decode(bytes));
}
export async function register(){
 const report={schema:'cs1618/registry-registration/1',started:new Date().toISOString(),status:'failed',registry:REGISTRY,commit:process.env.GITHUB_SHA};mkdirSync('artifacts/registry',{recursive:true});
 try{
  const meta=JSON.parse(readFileSync('public/app.json')),bytes=readFileSync('public/app.holo');const payload=await registrationPayload(meta,bytes,process.env.GITHUB_REPOSITORY??'');
  const live=await fetch(new URL('app.holo',meta.live),{cache:'no-cache',signal:AbortSignal.timeout(20000)});if(!live.ok||sha(new Uint8Array(await live.arrayBuffer()))!==sha(bytes))throw Error('Published Holo does not match this checkout');
  const url=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);url.searchParams.set('audience','prism-registry');const oidc=await fetch(url,{headers:{authorization:`bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`},signal:AbortSignal.timeout(20000)});if(!oidc.ok)throw Error(`OIDC request failed (${oidc.status})`);const token=(await oidc.json()).value;if(typeof token!=='string'||!token)throw Error('OIDC token missing');
  const response=await fetch(`${REGISTRY}/prism/register`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Registry refused registration (${response.status})`);
  const entry=await response.json();report.status='registered';report.entry=entry;report.payload=payload;
  // The index is independently verified. Registration acceptance alone is not a listing.
  const index=await readIndex();report.listed=index.apps?.some(app=>app.live===payload.live&&app.fingerprint===payload.fingerprint)??false;report.status=report.listed?'listed':'registered-awaiting-index';
  console.log(JSON.stringify(report,null,2));
 }catch(error){report.error=error.message;throw error;}finally{report.completed=new Date().toISOString();writeFileSync('artifacts/registry/registration.json',JSON.stringify(report,null,2)+'\n');if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,`Prism registration: ${report.status}. ${report.error??'Address-bar visibility requires the registry indexer to accept the published Holo.'}\n`);}
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await register();
