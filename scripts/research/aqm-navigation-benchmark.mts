import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
// Research only: imports existing source and executes shipped/assembled Wasm in scratch memory.
const [gameArg,aqmArg,outputArg]=process.argv.slice(2);
if(!gameArg||!aqmArg||!outputArg)throw Error('Usage: tsx aqm-navigation-benchmark.mts /path/to/game /path/to/clean-pinned-aqm /path/to/output.json');
const gameRoot=resolve(gameArg),aqmRoot=resolve(aqmArg),outputPath=resolve(outputArg);
const baseline='8a26b962f2363f4d08976146577f61fbd9474dc1',aqmRevision='4478ca42eca5124c46f89b78abdf042fae0d98eb';
const git=(root:string,...args:string[])=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
assert.equal(git(aqmRoot,'rev-parse','HEAD'),aqmRevision,'AQM revision differs from reviewed source');
assert.equal(git(aqmRoot,'status','--porcelain','--untracked-files=all'),'','AQM source checkout must be clean');
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const measure=<T,>(f:()=>T)=>{const t=performance.now();const value=f();return {ms:performance.now()-t,value};};
const baselinePaths=['public/wasm/cs_verdant.wasm','server/navigation.ts','shared/engine.ts','shared/map.ts','shared/generated-navigation.ts','model/evolution/state.json','scripts/evolution/generate.ts'];
const bindings=Object.fromEntries(baselinePaths.map(path=>{const current=readFileSync(resolve(gameRoot,path)),original=execFileSync('git',['-C',gameRoot,'show',`${baseline}:${path}`],{maxBuffer:16*1024*1024});assert.equal(sha(current),sha(original),`${path} differs from reviewed game baseline`);return [path,{sha256:sha(current),baselineSha256:sha(original),matchesBaseline:true}];}));
const gameInputStatus=git(gameRoot,'status','--porcelain','--untracked-files=no','--',...baselinePaths);
assert.equal(gameInputStatus,'','Bound game inputs must have no tracked modifications');
const load=(root:string,path:string)=>import(pathToFileURL(resolve(root,path)).href);
const {createEngine}=await load(gameRoot,'shared/engine.ts');
const {BotNavigator}=await load(gameRoot,'server/navigation.ts');
const engineBytes=readFileSync(gameRoot+'/public/wasm/cs_verdant.wasm');
let t=performance.now();const engine=await createEngine(engineBytes);const engineInitMs=performance.now()-t;
const constructed=measure(()=>new BotNavigator(engine));const nav=constructed.value;type NavNode={x:number;z:number;links:number[]};const full:NavNode[]=nav.nodes;
assert.ok(full.length>0);
const components:number[][]=[];const visited=new Set<number>();
for(let r=0;r<full.length;r++)if(!visited.has(r)){const q=[r];visited.add(r);for(let k=0;k<q.length;k++)for(const v of full[q[k]].links)if(!visited.has(v)){visited.add(v);q.push(v);}components.push(q);}
const root=nav.nearest(0,20);const chosen=[root],chosenSet=new Set(chosen);
for(let k=0;k<chosen.length&&chosen.length<64;k++)for(const v of full[chosen[k]].links)if(!chosenSet.has(v)){chosenSet.add(v);chosen.push(v);if(chosen.length===64)break;}
assert.equal(chosen.length,64,'The component rooted nearest (0,20) must contain 64 real nodes');
chosen.sort((a,b)=>a-b);const remap=new Map(chosen.map((v,i)=>[v,i]));
nav.nodes=chosen.map(i=>({x:full[i].x,z:full[i].z,links:full[i].links.filter(v=>chosenSet.has(v)).map(v=>remap.get(v)!)}));
const nodes:NavNode[]=nav.nodes,n=nodes.length,inf=1_000_000;
const graph={extraction:'BFS from real navigation node nearest (0,20), first64 discovered, then original-index order; all induced edges retained',originalRoot:root,fullNodeCount:full.length,fullUndirectedEdges:full.reduce((a,v)=>a+v.links.length,0)/2,componentSizes:components.map(v=>v.length).sort((a,b)=>b-a),nodes:nodes.map((v,i)=>({id:i,originalId:chosen[i],...v}))};
const graphHash=sha(JSON.stringify(graph));const fullGraphHash=sha(JSON.stringify(full));
// Recheck every retained edge against original collision semantics, independent of extraction.
let collisionEdgesRechecked=0;
for(let a=0;a<n;a++)for(const b of nodes[a].links)if(a<b){const p=nodes[a],q=nodes[b];assert.ok(full[chosen[a]].links.includes(chosen[b]));assert.ok(Math.hypot(p.x-q.x,p.z-q.z)<=2.9);for(const [p0,p1] of [[p,q],[q,p]]){const m=engine.move(p0.x,0,p0.z,p1.x-p0.x,p1.z-p0.z,.42,1.78);assert.ok(Math.hypot(m.x-p1.x,m.z-p1.z)<=.01);}collisionEdgesRechecked++;}
const matrixBuild=()=>{const weights=new Int32Array(n*n).fill(inf),next=new Int32Array(n*n).fill(-1);for(let i=0;i<n;i++){weights[i*n+i]=0;next[i*n+i]=i;for(const j of nodes[i].links){weights[i*n+j]=1;next[i*n+j]=j;}}return {weights,next};};
function bfsCache(){const dist=new Int32Array(n*n).fill(inf),next=new Int32Array(n*n).fill(-1);const queue=new Int32Array(n);for(let s=0;s<n;s++){let len=1;queue[0]=s;dist[s*n+s]=0;next[s*n+s]=s;for(let k=0;k<len;k++){const u=queue[k];for(const v of nodes[u].links)if(dist[s*n+v]===inf){dist[s*n+v]=dist[s*n+u]+1;next[s*n+v]=u===s?v:next[s*n+u];queue[len++]=v;}}}return {dist,next};}
function jsClosure(){const {weights:dist,next}=matrixBuild();for(let k=0;k<n;k++)for(let i=0;i<n;i++){const dik=dist[i*n+k];if(dik>=inf)continue;for(let j=0;j<n;j++){const dkj=dist[k*n+j];if(dkj>=inf)continue;const cand=dik+dkj;if(cand<dist[i*n+j]){dist[i*n+j]=cand;next[i*n+j]=next[i*n+k];}}}return {dist,next};}
const firstBfs=measure(bfsCache);
t=performance.now();const aqm=await load(aqmRoot,'src/aqm/holoGuest.ts');const aqmDynamicImportMs=performance.now()-t;
const assembled=measure<Uint8Array<ArrayBuffer>>(aqm.assembleCoreWasmGuestBinary);const compiled=measure(()=>new WebAssembly.Module(assembled.value));const instance=measure(()=>new WebAssembly.Instance(compiled.value,{}));
const firstMatrices=measure(matrixBuild);
const firstClosure=measure(()=>aqm.runWasmTropicalClosure(firstMatrices.value.weights,firstMatrices.value.next,n));
function aqmCache(){const {weights,next}=matrixBuild();const r=aqm.runWasmTropicalClosure(weights,next,n);return {dist:r.dist,next:r.nextHop};}
const firstAqm={dist:firstClosure.value.dist,next:firstClosure.value.nextHop};
const firstJs=measure(jsClosure);
function fromCache(next:Int32Array,x:number,z:number,gx:number,gz:number){const start=nav.nearest(x,z),goal=nav.nearest(gx,gz);if(start===goal||next[start*n+goal]<0)return [];const route:number[]=[];let cur=start;for(let steps=0;cur!==goal;steps++){if(steps>=n)throw Error('cycle in next hop');cur=next[cur*n+goal];route.push(cur);}return route;}
// Independent Bellman-Ford distances and validity of all routes; equal-distance ties may differ.
let checkedPairs=0,alternateAqmPaths=0;
for(let s=0;s<n;s++){
 const reference=Array(n).fill(inf);reference[s]=0;for(let pass=0;pass<n-1;pass++){let changed=false;for(let u=0;u<n;u++)for(const v of nodes[u].links)if(reference[u]+1<reference[v]){reference[v]=reference[u]+1;changed=true;}if(!changed)break;}
 for(let goal=0;goal<n;goal++){const p=nodes[s],q=nodes[goal],routes=[nav.path(p.x,p.z,q.x,q.z),fromCache(firstBfs.value.next,p.x,p.z,q.x,q.z),fromCache(firstAqm.next,p.x,p.z,q.x,q.z),fromCache(firstJs.value.next,p.x,p.z,q.x,q.z)];assert.equal(firstBfs.value.dist[s*n+goal],reference[goal]);assert.equal(firstAqm.dist[s*n+goal],reference[goal]);assert.equal(firstJs.value.dist[s*n+goal],reference[goal]);for(const route of routes){assert.equal(route.length,reference[goal]);let cur=s;for(const v of route){assert.ok(nodes[cur].links.includes(v));cur=v;}assert.equal(cur,goal);}if(JSON.stringify(routes[0])!==JSON.stringify(routes[2]))alternateAqmPaths++;checkedPairs++;}
}
let seed=1618;const rand=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;const uniform=()=>rand()/4294967296;
const schedule:{at:number,bot:number,source:number,target:number}[]=[];
for(let bot=0;bot<10;bot++){let at=0;while(at<600){schedule.push({at,bot,source:Math.floor(uniform()*n),target:Math.floor(uniform()*n)});at+=1+uniform();}}
schedule.sort((a,b)=>a.at-b.at||a.bot-b.bot);const queries=schedule.map(v=>[nodes[v.source].x,nodes[v.source].z,nodes[v.target].x,nodes[v.target].z] as const);
let sink=0;function runQueries(path:(...v:[number,number,number,number])=>number[]){let sum=0;for(const q of queries){const r=path(...q);sum+=r.length;sink^=r[0]??0;}sink^=sum;return sum;}
const raw:{trial:number,order:string[],algorithms:Record<string,{cacheBuildMs:number,queriesMs:number,totalMs:number,checksum:number}>}[]=[];
const algorithms=['current-bfs','repeated-bfs-cache','aqm-wasm-cache','js-minplus-cache'];
for(let warm=0;warm<4;warm++){runQueries(nav.path.bind(nav));for(const build of [bfsCache,aqmCache,jsClosure]){const c=build();runQueries((...q)=>fromCache(c.next,...q));}}
for(let trial=0;trial<20;trial++){
 const order=algorithms.map((_,j)=>algorithms[(j+trial)%algorithms.length]);const record:typeof raw[number]={trial,order,algorithms:{}};
 for(const name of order){let cacheBuildMs=0,cache:any;let query:any;if(name==='current-bfs'){query=measure(()=>runQueries(nav.path.bind(nav)));}else{const built=measure(name==='repeated-bfs-cache'?bfsCache:name==='aqm-wasm-cache'?aqmCache:jsClosure);cacheBuildMs=built.ms;cache=built.value;query=measure(()=>runQueries((...q)=>fromCache(cache.next,...q)));}record.algorithms[name]={cacheBuildMs,queriesMs:query.ms,totalMs:cacheBuildMs+query.ms,checksum:query.value};}
 assert.equal(new Set(Object.values(record.algorithms).map(v=>v.checksum)).size,1);raw.push(record);
}
// Attribute raw kernel cost and host copies using separately instantiated actual pinned bytecode.
const ex=instance.value.exports as any;const ptr=65536,bytes=n*n*4,dp=ptr,hp=ptr+bytes;const matrices=matrixBuild();const copySamples:number[]=[],computeSamples:number[]=[],outSamples:number[]=[];
for(let i=0;i<100;i++){copySamples.push(measure(()=>{new Int32Array(ex.memory.buffer,dp,n*n).set(matrices.weights);new Int32Array(ex.memory.buffer,hp,n*n).set(matrices.next);}).ms);computeSamples.push(measure(()=>ex.wasm_tropical_minplus_closure(dp,hp,n)).ms);outSamples.push(measure(()=>[new Int32Array(new Int32Array(ex.memory.buffer,dp,n*n)),new Int32Array(new Int32Array(ex.memory.buffer,hp,n*n))]).ms);}
const stats=(a:number[])=>{const s=[...a].sort((a,b)=>a-b);return {min:s[0],median:s[Math.floor(s.length/2)],p95:s[Math.min(s.length-1,Math.ceil(.95*s.length)-1)],max:s.at(-1)};};
const summary=Object.fromEntries(algorithms.map(name=>[name,{cacheBuildMs:stats(raw.map(v=>v.algorithms[name].cacheBuildMs)),queriesMs:stats(raw.map(v=>v.algorithms[name].queriesMs)),totalMs:stats(raw.map(v=>v.algorithms[name].totalMs))}]));
const result={schema:'aqm-navigation-benchmark/2',runAtUtc:new Date().toISOString(),aqmRevision,gameBaseline:baseline,provenance:{probeSha256:sha(readFileSync(fileURLToPath(import.meta.url))),guestSha256:sha(assembled.value),gameHead:git(gameRoot,'rev-parse','HEAD'),aqmHead:git(aqmRoot,'rev-parse','HEAD'),aqmStatus:git(aqmRoot,'status','--porcelain','--untracked-files=all'),gameInputStatus,allBoundInputsMatchBaseline:true,bindings,generator:'shared/generated-navigation.ts identifies scripts/evolution/generate.ts and model/evolution/state.json; all three bound to exact baseline bytes',nodeOrder:'full graph generated by original z outer/x inner loops and original neighborPairs ordering; selected original IDs sorted ascending; retained adjacency preserves original link order'},environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,sharedVirtualEnvironment:true},inputs:{engineWasmSha256:sha(engineBytes),navigationSourceSha256:sha(readFileSync(gameRoot+'/server/navigation.ts')),generatedNavigationSha256:sha(readFileSync(gameRoot+'/shared/generated-navigation.ts')),graphHash,fullGraphHash,graph},verification:{collisionEdgesRechecked,checkedPairs,alternateAqmPaths,allCostsAndWitnessesPassed:true,checkedAlgorithms:['current BotNavigator.path','repeated-BFS cache','actual AQM Wasm cache','scratch JS min-plus cache'],independentReference:'Bellman-Ford unit-edge relaxation and all route-edge witnesses'},workload:{seconds:600,bots:10,replanIntervalSeconds:[1,2],queries:queries.length,scheduleSha256:sha(JSON.stringify(schedule)),kind:'seeded synthetic source/target selections on real collision-checked subgraph; not a recorded gameplay trace',nearestScansAndPathReconstructionIncluded:true,throttlingAndWallClockWaiting:false},cold:{engineInitMs,fullGraphConstructionMs:constructed.ms,firstRepeatedBfsCacheMs:firstBfs.ms,firstJsMinplusCacheMs:firstJs.ms,aqmDynamicImportMs,aqmAssemblyMs:assembled.ms,aqmCompileMs:compiled.ms,aqmInstantiateMs:instance.ms,wasmBytes:assembled.value.byteLength,matrixInitMs:firstMatrices.ms,firstWrapperCallMs:firstClosure.ms,note:'manual first compile precedes wrapper first call; wrapper compiles same bytes again and V8 may cache compilation; dynamic import includes tsx module loading'},memory:{matricesOwnedBytes:2*n*n*4,aqmGuestBytes:ex.memory.buffer.byteLength,ownedReturnBytes:2*n*n*4,adjacencyStoredSeparately:true},summary,raw,kernelAttributionMs:{copyIn:stats(copySamples),kernel:stats(computeSamples),copyOut:stats(outSamples),copySamples,computeSamples,outSamples},sink,limits:['Node/shared virtual environment, not browser or physical-hardware game benchmark','64-node induced subgraph omits outside routes; distances are for that subgraph only','Uniform node-pair selection not actual bot goals','20 rotated-order trials with four warmups; no formal confidence intervals','No source copy or production edits; exact upstream binary assembled only in scratch memory']};
for(const [path,binding] of Object.entries(bindings))assert.equal(sha(readFileSync(resolve(gameRoot,path))),binding.sha256,'Bound game input changed during benchmark');
assert.equal(git(aqmRoot,'rev-parse','HEAD'),aqmRevision);assert.equal(git(aqmRoot,'status','--porcelain','--untracked-files=all'),'');
writeFileSync(outputPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({graph:{fullNodes:full.length,fullEdges:graph.fullUndirectedEdges,componentSizes:graph.componentSizes,selectedNodes:n,selectedEdges:collisionEdgesRechecked,graphHash},verification:result.verification,workload:result.workload,cold:result.cold,memory:result.memory,summary,kernelAttributionMs:{copyIn:stats(copySamples),kernel:stats(computeSamples),copyOut:stats(outSamples)},environment:result.environment,provenance:result.provenance,outputPath},null,2));
