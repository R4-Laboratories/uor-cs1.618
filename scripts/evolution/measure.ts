import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {runInNewContext} from 'node:vm';
import {chromium} from 'playwright';
import {preview} from 'vite';
import {PNG} from 'pngjs';
import {createEngine} from '../../shared/engine';
import {BotNavigator} from '../../server/navigation';
import {generateNavigation,type Configuration} from './generate';
import type {Candidate,Evidence} from './policy';
export const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function navigation(config:Configuration['navigation']){
 const source=generateNavigation(config),exports:Record<string,any>={};
 runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports,Map});
 return exports.neighborPairs as (nodes:readonly {x:number;z:number}[])=>Generator<[number,number]>;
}
// Coordinates preserve the 24-by-20 original relay-yard regression corpus when
// extending the search grid changes the indices of its nodes.
const relayOrigins=[[-25,-25],[13,-25],[23,-23],[-19,-19],[19,-19],[15,-17],[15,-15],[-25,-11],[-25,-9],[-25,-7],[17,-7],[-25,-3],[-19,-1],[-1,1],[15,3],[5,5],[25,7],[-3,11],[19,13],[5,17],[-13,21],[25,21],[11,23],[-3,25]] as const;
const relayDestinations=[[-25,-25],[21,-25],[-1,-21],[5,-19],[9,-17],[21,-15],[-13,-11],[-1,-9],[5,-7],[23,-5],[-15,-1],[21,1],[-13,5],[-3,7],[-5,11],[25,13],[-1,19],[9,21],[3,23],[-3,25]] as const;
export async function measureNavigation(candidate:Candidate,incumbent:Configuration):Promise<Evidence>{
 const bytes=await readFile('public/wasm/cs_verdant.wasm');
 async function run(config:Configuration['navigation']){
  let pairs=0;const generated=config.cell===0?function*(nodes:readonly {x:number;z:number}[]):Generator<[number,number]>{for(let a=0;a<nodes.length;a++)for(let b=0;b<nodes.length;b++)if(b>a)yield [a,b];}:navigation(config);
  function* count(nodes:readonly {x:number;z:number}[]):Generator<[number,number]>{for(const pair of generated(nodes)){pairs++;yield pair;}}
  const engine=await createEngine(bytes),start=performance.now(),nav=new BotNavigator(engine,count),elapsed=performance.now()-start;
  const routes=[];
  for(const [x,z] of relayOrigins)for(const [gx,gz] of relayDestinations)routes.push(nav.path(x,z,gx,gz));
  const legacySamples=routes.length;
  const starts=nav.nodes.filter((_,i)=>i%19===0),ends=nav.nodes.filter((_,i)=>i%23===0);
  for(const from of starts)for(const to of ends)routes.push(nav.path(from.x,from.z,to.x,to.z));
  const samples=routes.length,expandedSamples=samples-legacySamples;
  return {pairs,elapsed,nodes:nav.nodes.length,graph:hash(nav.nodes),routes:hash(routes),samples,legacySamples,expandedSamples};
 }
 const reference=await run({cell:0}),before=await run(incumbent.navigation),after=await run(candidate.config.navigation);
 return {family:candidate.family,candidate:candidate.id,configHash:hash(candidate.config),baselineWork:before.pairs,candidateWork:after.pairs,fidelity:reference.graph===after.graph&&reference.routes===after.routes,samples:after.samples,legacySamples:after.legacySamples,expandedSamples:after.expandedSamples,checks:false,bounds:after.nodes===reference.nodes,reference,before,after};
}
export function pixelDifference(a:Buffer,b:Buffer){
 const x=PNG.sync.read(a),y=PNG.sync.read(b);if(x.width!==y.width||x.height!==y.height)throw Error('Image dimensions changed');
 let sum=0,changed=0;for(let i=0;i<x.data.length;i+=4){let max=0;for(let c=0;c<3;c++){const diff=Math.abs(x.data[i+c]-y.data[i+c]);sum+=diff;max=Math.max(max,diff);}if(max>12)changed++;}
 return {mean:sum/(x.width*x.height*3*255),changed:changed/(x.width*x.height)};
}
export async function measureRendering(candidate:Candidate,incumbent:Configuration,policy:any):Promise<Evidence>{
 const server=await preview({preview:{port:0,host:'127.0.0.1'}});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:640,height:400},deviceScaleFactor:1});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${(server.httpServer.address() as {port:number}).port}/evolution-lab.html`,{waitUntil:'load'});
  await page.waitForFunction(()=>(window as any).evolutionLab?.ready);
  const generated=await page.evaluate(()=>(window as any).evolutionLab.generated);if(hash(generated)!==hash(candidate.config.render))throw Error('Built render candidate is stale');
  type Frame={calls:number;triangles:number;frameMs:number;png:string};
  const measure=(config:Configuration['render'])=>page.evaluate(c=>(window as any).evolutionLab.measure(c),config) as Promise<{frames:Frame[];inventory:string[]}>;
  const referenceScene=await measure({cell:0,minimum:2}),beforeScene=await measure(incumbent.render),afterScene=await measure(candidate.config.render);
  const reference=referenceScene.frames,before=beforeScene.frames,after=afterScene.frames;
  const inventoryEqual=hash(referenceScene.inventory)===hash(afterScene.inventory);
  if(reference.length!==6||before.length!==6||after.length!==6)throw Error('Incomplete rendering camera corpus');
  const comparisons=after.map((frame,i)=>pixelDifference(Buffer.from(reference[i].png,'base64'),Buffer.from(frame.png,'base64')));
  const work=(frames:typeof after)=>frames.reduce((n,f)=>n+f.calls*100+f.triangles,0);
  const strip=(frames:typeof after)=>frames.map(({png,...metrics})=>metrics);
  return {family:candidate.family,candidate:candidate.id,configHash:hash(candidate.config),baselineWork:work(before),candidateWork:work(after),fidelity:inventoryEqual&&errors.length===0&&comparisons.every(c=>c.mean<=policy.maximumPixelMeanError&&c.changed<=policy.maximumChangedPixelFraction),samples:after.length,checks:false,bounds:after.every((f,i)=>f.triangles<=reference[i].triangles*policy.maximumTriangleRatio),inventoryEqual,inventoryCount:afterScene.inventory.length,comparisons,reference:strip(reference),before:strip(before),after:strip(after),errors};
 }finally{await browser.close();await new Promise<void>(r=>server.httpServer.close(()=>r()));}
}
