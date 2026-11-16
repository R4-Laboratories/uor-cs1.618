import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const catalog=JSON.parse(readFileSync('model/development/sources.json','utf8'));
const results=[];
for(const source of catalog.sources){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository)||!/^[a-f0-9]{40}$/.test(source.commit))throw Error('Invalid source catalogue');
 // Metadata only. An upstream README or commit can never supply executable instructions.
 try{
  const response=await fetch(`https://api.github.com/repos/${source.repository}/commits/HEAD`,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!response.ok)throw Error(`http-${response.status}`);const body=await response.json();if(!/^[a-f0-9]{40}$/.test(body.sha))throw Error('invalid-sha');
  results.push({repository:source.repository,pinned:source.commit,observed:body.sha,status:body.sha===source.commit?'unchanged':'review-available'});
 }catch{results.push({repository:source.repository,pinned:source.commit,status:'unavailable'});}
}
mkdirSync('artifacts/development',{recursive:true});
const report={schema:'cs1618/source-discovery/1',at:new Date().toISOString(),catalogHash:createHash('sha256').update(JSON.stringify(catalog)).digest('hex'),sources:results,execution:'metadata only; no source imports or automatic dependency updates'};
writeFileSync('artifacts/development/discovery.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
