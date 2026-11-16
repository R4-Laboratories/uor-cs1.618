// Research only: executes pinned upstream source; never loaded by the game.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const revision = '4478ca42eca5124c46f89b78abdf042fae0d98eb';
const source = process.argv[2];
if (!source) throw new Error('Usage: npx tsx scripts/research/aqm-kernel-probe.ts /path/to/pinned/verdant-aqm');
const checkout = resolve(source);
const git = (...args: string[]) => execFileSync('git', ['-C', checkout, ...args], {encoding:'utf8'}).trim();
assert.equal(git('rev-parse', 'HEAD'), revision, 'AQM revision differs from reviewed source');
assert.equal(git('status', '--porcelain', '--untracked-files=all'), '', 'AQM checkout must be clean');
const load = (path: string) => import(pathToFileURL(resolve(checkout, path)).href);
const {runWasmSymplecticCommute,runWasmPacked4Gemv,runWasmTropicalClosure,assembleCoreWasmGuestBinary,getSyncHoloComputeKernels} = await load('src/aqm/holoGuest.ts');
const {createInitialExactMps,stepExactMpsGate,inspectExactMpsState,getMpsBondDimensions} = await load('src/aqm/mps.ts');
const {GateKind} = await load('src/aqm/types.ts');
let seed=1618;const rand=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
const u64=()=>BigInt(rand())<<32n|BigInt(rand());
const grid=new Int32Array([-8,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,8,12]);
let symplecticCases=0,gemvCases=0,closureGraphs=0,closurePairs=0;
for(let t=0;t<128;t++){
 const words=1+rand()%4;const args=Array.from({length:4},()=>BigUint64Array.from({length:words},u64));
 let parity=0;for(let w=0;w<words;w++){let v=(args[0][w]&args[3][w])^(args[1][w]&args[2][w]);while(v){parity^=1;v&=v-1n;}}
 assert.equal(runWasmSymplecticCommute(args[0],args[1],args[2],args[3]),parity===0);symplecticCases++;
}
for(let t=0;t<128;t++){
 const rows=1+rand()%5,pc=1+rand()%8;const act=Int32Array.from({length:pc*2},()=>rand()%65535-32767);const nibs=Uint8Array.from({length:rows*pc},()=>rand()%256);
 const expected=Array.from({length:rows},(_,r)=>{let a=0n;for(let p=0;p<pc;p++){const b=nibs[r*pc+p];a+=BigInt(grid[b&15])*BigInt(act[p*2])+BigInt(grid[b>>>4])*BigInt(act[p*2+1]);}return a;});
 assert.deepEqual(Array.from(runWasmPacked4Gemv(act,nibs,grid,rows,pc).out),expected);gemvCases++;
}
const inf=1_000_000;
for(let n=1;n<=16;n++)for(let t=0;t<3;t++){
 const weights=new Int32Array(n*n).fill(inf),hops=new Int32Array(n*n).fill(-1);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){if(i===j){weights[i*n+j]=0;hops[i*n+j]=i;}else if(rand()%4===0){weights[i*n+j]=1+rand()%20;hops[i*n+j]=j;}}
 const actual=runWasmTropicalClosure(weights,hops,n);
 for(let s=0;s<n;s++){
  const dist=Array(n).fill(inf);dist[s]=0;
  for(let pass=0;pass<n-1;pass++){let changed=false;for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(dist[i]<inf&&weights[i*n+j]<inf&&dist[i]+weights[i*n+j]<dist[j]){dist[j]=dist[i]+weights[i*n+j];changed=true;}if(!changed)break;}
  for(let goal=0;goal<n;goal++){
   assert.equal(actual.dist[s*n+goal],dist[goal]);closurePairs++;
   if(dist[goal]>=inf||s===goal)continue;
   let cur=s,cost=0;for(let step=0;cur!==goal;step++){assert.ok(step<n);const next=actual.nextHop[cur*n+goal];assert.ok(next>=0&&next<n&&next!==cur&&weights[cur*n+next]<inf);cost+=weights[cur*n+next];cur=next;}assert.equal(cost,dist[goal]);
  }
 }
 closureGraphs++;
}
const overflow=runWasmPacked4Gemv(new Int32Array([-2147483648,-2147483648]),new Uint8Array([0]),new Int32Array(16).fill(-2147483648),1,1).out[0];
assert.equal(overflow,-(1n<<63n));
function behavior(f:()=>unknown){try{f();return 'accepted without refusal';}catch(e){return (e as Error).name+': '+(e as Error).message;}}
const malformed={gemvShortActivations:behavior(()=>runWasmPacked4Gemv(new Int32Array([1]),new Uint8Array([0]),grid,1,1)),closureShortMatrices:behavior(()=>runWasmTropicalClosure(new Int32Array(0),new Int32Array(0),1)),symplecticUnequalBuffers:behavior(()=>runWasmSymplecticCommute(new BigUint64Array(2),new BigUint64Array(1),new BigUint64Array(1),new BigUint64Array(1)))};
let cap1=createInitialExactMps(2,1);cap1=stepExactMpsGate(cap1,{id:'h',kind:GateKind.H,targets:[0]},0.5).nextState;cap1=stepExactMpsGate(cap1,{id:'cx',kind:GateKind.CNOT,targets:[0,1]},0.5).nextState;
const inspection=inspectExactMpsState(cap1);
// These assertions preserve known counterexamples, not production acceptance.
assert.deepEqual(Object.values(malformed), Array(3).fill('accepted without refusal'));
assert.deepEqual(getMpsBondDimensions(cap1), [1]);
assert.deepEqual(inspection.blochVectors.map((v: {p1: number; purity: number}) => [v.p1,v.purity]), [[0,1],[0,1]]);
const binary=assembleCoreWasmGuestBinary();const module=new WebAssembly.Module(binary);
console.log(JSON.stringify({schema:'cs1618-aqm-research/1',revision,runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch},symplecticCases,gemvCases,closureGraphs,closurePairs,independentReferences:'bit-clear parity; BigInt dot products; repeated Bellman-Ford and route witness checks',wasmBytes:binary.byteLength,memoryBytes:getSyncHoloComputeKernels().memory.buffer.byteLength,exports:WebAssembly.Module.exports(module).map(v=>v.name),overflow:{mathematical:'9223372036854775808',actual:String(overflow),refused:false},malformed,mpsCap1Bell:{bonds:getMpsBondDimensions(cap1),bloch:inspection.blochVectors.map((v: {p1: number; purity: number})=>({p1:v.p1,purity:v.purity})),expected:'Bell state: both p1=0.5, purity=0.5, bond rank2'}},null,2));
