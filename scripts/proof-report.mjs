import {spawnSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync,rmSync,copyFileSync} from 'node:fs';
import {sha256} from './prism-verifier-backport.mjs';
import {proofProjects,bindVerifiedKernel} from './proof-result.mjs';
const project=process.env.PRISM_PROJECT??'round';
if(!Object.hasOwn(proofProjects,project))throw Error('Unknown proof project');
mkdirSync('artifacts/proofs',{recursive:true});
// A failed current run must never inherit an old success or compiler receipt.
for(const name of [`${project}-verification.json`,'verifier.json'])rmSync(`artifacts/proofs/${name}`,{force:true});
rmSync(`artifacts/proofs/${project}-evidence`,{recursive:true,force:true});
const started=new Date().toISOString();
const result=spawnSync('bash',['scripts/verify-prism.sh'],{encoding:'utf8',timeout:30*60*1000,maxBuffer:16*1024*1024});
const log=(result.stdout??'')+(result.stderr??'');
console.log(log.slice(-12000));
writeFileSync(`artifacts/proofs/${project}.log`,log);
let binding={},verifier=null,error=result.error?.message??null;
try {verifier=JSON.parse(readFileSync('artifacts/proofs/verifier.json','utf8'));}catch{}
if(result.status===0){
  try {
    if(!verifier?.binarySha256)throw Error('Missing verifier build provenance');
    binding=bindVerifiedKernel(project,JSON.parse(readFileSync(`artifacts/proofs/${project}-verification.json`,'utf8')));
    const evidenceDirectory=`artifacts/proofs/${project}-evidence`;
    mkdirSync(evidenceDirectory,{recursive:true});
    for(const file of ['lexlean-attestation.json','manifest.json','application-acceptance.json'])copyFileSync(`${proofProjects[project]}/.prism/verified/${binding.attestationId}/${file}`,`${evidenceDirectory}/${file}`);
    binding.evidenceDirectory=evidenceDirectory;
  }catch(cause){error=cause.message;}
}
const kernel=`public/wasm/cs_${project}.wasm`;
let kernelSha256=null;
try{kernelSha256=sha256(readFileSync(kernel));}catch(cause){error??=cause.message;}
const workspaceDirty=Boolean(spawnSync('git',['status','--porcelain'],{encoding:'utf8'}).stdout?.trim());
const report={schema:'cs1618/formal-verification/2',project,workspaceDirty,base:process.env.GITHUB_SHA??spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout?.trim(),sdk:JSON.parse(readFileSync('prism/prismpm.lock','utf8')).sdk_image,verifier,kernelSha256,...binding,started,completed:new Date().toISOString(),status:result.status===0&&!error?'verified':'failed',exit:result.status,signal:result.signal,error,errorCodes:[...new Set(log.match(/(?:PP\d{4}|LL[A-Z]?\d{4})/g)??[])],scope:'Pinned SDK with the recorded upstream verifier backport: check, build, full application verification and exact published Holo/core-WASM bindings; not a whole-game proof.'};
writeFileSync(`artifacts/proofs/${project}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.status!=='verified')process.exitCode=1;
