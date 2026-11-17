// Generic frontend/source binding only. Numeric producer/SDK admission is separate.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
const [sourceArg,buildArg,manifestArg]=process.argv.slice(2);
const source=resolve(sourceArg),build=resolve(buildArg);
const pins=JSON.parse(readFileSync(new URL('./reader-source.json',import.meta.url)));
const sha=b=>createHash('sha256').update(b).digest('hex');
function regular(path){
 const resolved=resolve(path);
 for(let p=resolved;;){assert(!lstatSync(p).isSymbolicLink(),'symlink in reader input');const i=p.lastIndexOf(sep);if(i<=0)break;p=p.slice(0,i);}
 const st=lstatSync(resolved);assert(st.isFile()&&st.nlink===1&&st.size<=64*1024*1024,'bounded singly linked regular reader input');return readFileSync(resolved);
}
function closure(){for(const [path,digest] of Object.entries(pins.files))assert.equal(sha(regular(join(source,path))),digest,'reviewed frontend reader closure: '+path);}
closure();
const {validateFrontend,bindFrontendSources,frontendSourcePlan}=await import(pathToFileURL(join(source,'scripts/library-frontend-reader.mjs')));
const manifest=JSON.parse(regular(manifestArg));
const lexBytes=regular(join(build,'lexlean/build/manifest.json')),lex=JSON.parse(lexBytes);
const planBytes=regular(join(build,'library/frontend.json')),plan=JSON.parse(planBytes);
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(key=>[key,v[key]])):v);
assert.equal(planBytes.toString(),canonical(plan),'canonical stable frontend plan bytes');
const phases=[];
for(const phase of manifest.exporter_owner.phases){
 const count=validateFrontend(phase.frontend,phase.processes);
 bindFrontendSources(phase.frontend,lex,path=>regular(join(build,'lexlean/build',path)));
 assert.deepEqual(frontendSourcePlan(phase.frontend),plan,'phase stable source-plan binding');
 assert.equal(phase.lexlean_manifest_sha256,sha(lexBytes),'original LexLean source manifest binding');
 phases.push({phase:phase.phase,frontend_processes:count,modules:phase.frontend.modules.map(m=>m.name)});
}
closure();
console.log(JSON.stringify({scope:'source-owned-frontend-reader-only',reader:pins,phases}));
