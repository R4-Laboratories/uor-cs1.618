import ts from 'typescript';
import {runInNewContext} from 'node:vm';
import {compileTactics} from '../../shared/creative-program';
import {readFileSync} from 'node:fs';
import {decideProgram,seeded,type BotFacts,type TacticsProgram} from '../../shared/creative-program';
import {createEngine} from '../../shared/engine';
import {createRoundKernel} from '../../shared/round-kernel';
import {Match} from '../../server/match';
import type {Candidate,Evidence} from './policy';
import type {Configuration} from './generate';
import {hash} from './measure';
// Evaluator-owned corpus, intentionally not supplied to the author prompt.
function cases(heldOut:boolean){
 const random=seeded(heldOut?984331:17039),rows:{facts:BotFacts;expected:string}[]=[];
 for(let i=0;i<96;i++){
  const facts:BotFacts={enemy:random()<.5,empty:false,lowAmmo:false,canPlant:false,canDefuse:false,urgent:false,carrier:false,attacker:random()<.5,planted:false,dropped:false};
  const scenario=i%12;
  if(scenario===0){Object.assign(facts,{attacker:false,planted:true,canDefuse:true,urgent:true,enemy:true});}
  if(scenario===1){Object.assign(facts,{empty:true,lowAmmo:true,enemy:true});}
  if(scenario===2){Object.assign(facts,{attacker:true,carrier:true,canPlant:true,enemy:false});}
  if(scenario===3){Object.assign(facts,{attacker:false,planted:true,canDefuse:true,enemy:false});}
  if(scenario===4){facts.enemy=true;}
  if(scenario===5){Object.assign(facts,{attacker:true,enemy:false});}
  if(scenario===6){Object.assign(facts,{attacker:false,enemy:false});}
  if(scenario===7){Object.assign(facts,{planted:true,enemy:false});}
  if(scenario===8){Object.assign(facts,{attacker:true,dropped:true,enemy:false});}
  if(scenario===9){Object.assign(facts,{attacker:true,carrier:true,enemy:false});}
  if(scenario===10){Object.assign(facts,{lowAmmo:true,enemy:false});}
  if(scenario===11){Object.assign(facts,{attacker:false,canDefuse:true,planted:true,urgent:false,enemy:true});}
  if(heldOut){if(scenario===0||scenario===3)Object.assign(facts,{empty:true,lowAmmo:true});if(scenario===2||scenario===11)facts.lowAmmo=true;if(scenario===10)facts.empty=true;}
  const expected=['interact','reload','interact','interact','engage','escort','guard','advance','advance','advance','reload','engage'][scenario];rows.push({facts,expected});
 }return rows;
}
function legacy(f:BotFacts){if(f.enemy)return 'engage';if(f.canPlant||f.canDefuse)return 'interact';if(f.empty||f.lowAmmo)return 'reload';return !f.attacker&&!f.planted?'guard':'advance';}
export async function measureTactics(candidate:Candidate,incumbent:Configuration):Promise<Evidence>{
 const engine=await createEngine(readFileSync('public/wasm/cs_verdant.wasm')),kernel=await createRoundKernel(readFileSync('public/wasm/cs_round.wasm'));
 function run(program:TacticsProgram){
  const exports:any={};runInNewContext(ts.transpileModule(compileTactics(program),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports},{timeout:1000});const decide=exports.decideTactic as (f:BotFacts)=>ReturnType<typeof decideProgram>;

  const errorSet=(held:boolean)=>cases(held).flatMap((c,i)=>(decide(c.facts)??legacy(c.facts))!==c.expected?[i]:[]);
  let completed=0,invalidInputs=0;const outcomes:string[]=[];
  // A separate actual simulation corpus proves that the program affects authoritative use inputs.
  for(const x of [-2,0,2])for(const kit of [true,false]){
   const m=new Match('CREATIVE',engine,kernel,f=>decide(f));m.join('a','Threat','attack');const p=m.join('d','Defuser','defend',true)!;
   m.phase='live';m.phaseLeft=80;Object.assign(p,{x,z:18,kit,yaw:0});Object.assign(m.players.get('a')!,{x,z:22});
   m.bomb={state:'planted',carrier:null,x,y:0,z:18,site:'A',remaining:kit?6.2:11.2};
   for(let n=0;n<(kit?7:12)*60&&m.phase==='live';n++){m.step(1/60);if(![p.x,p.y,p.z,p.input.yaw,p.input.pitch].every(Number.isFinite)||Math.abs(p.input.forward)>1)invalidInputs++;}
   outcomes.push(m.reason);if(m.reason==='Device defused')completed++;
  }
  return {trainingErrors:errorSet(false).length,holdoutErrors:errorSet(true).length,trainingFailed:errorSet(false),holdoutFailed:errorSet(true),completed,invalidInputs,outcomes};
 }
 const before=run(incumbent.tactics),after=run(candidate.config.tactics);
 const noRegression=after.trainingFailed.every(i=>before.trainingFailed.includes(i))&&after.holdoutFailed.every(i=>before.holdoutFailed.includes(i));
 return {family:'tactics',candidate:candidate.id,configHash:hash(candidate.config),metric:'tactical decision errors + failed emergency objective scenarios (lower is better)',baselineWork:1+before.trainingErrors+before.holdoutErrors+(6-before.completed)*16,candidateWork:1+after.trainingErrors+after.holdoutErrors+(6-after.completed)*16,fidelity:noRegression&&after.completed>=before.completed,samples:198,checks:false,bounds:after.invalidInputs===0,reference:{training:96,heldOut:96,realMatches:6,scope:'Fixed scenario corpus; not general match win rate'},before,after};
}
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {preview} from 'vite';
import {pixelDifference} from './measure';
export async function measureArt(candidate:Candidate,incumbent:Configuration,policy:any):Promise<Evidence>{
 const server=await preview({preview:{port:0,host:'127.0.0.1'}}),browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:640,height:400},deviceScaleFactor:1}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${(server.httpServer.address() as {port:number}).port}/evolution-lab.html`);await page.waitForFunction(()=>(window as any).evolutionLab?.ready);
  const actual=await page.evaluate(()=>(window as any).evolutionLab.artProgram);if(hash(actual)!==hash(candidate.config.art))throw Error('Built art identity mismatch');
  const measure=(p:Configuration['art'])=>page.evaluate(program=>(window as any).evolutionLab.measureArt(program),p);
  const before=await measure(incumbent.art),after=await measure(candidate.config.art);
  const textures=after.textures as {contrast:number;coverage:number;png:string}[];
  const rgb=(color:string)=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);const a=rgb(candidate.config.art.siteA),b=rgb(candidate.config.art.siteB),separation=Math.hypot(...a.map((v,i)=>v-b[i]));
  const loss=(result:any,p:Configuration['art'])=>p.shapes.length?result.textures.reduce((n:number,t:any)=>n+1/t.contrast+Math.abs(t.coverage-.12),0)/2+.1:1;
  const comparisons=after.scene.frames.map((frame:any,i:number)=>pixelDifference(Buffer.from(before.scene.frames[i].png,'base64'),Buffer.from(frame.png,'base64')));
  const protectedEqual=hash(before.scene.inventory)===hash(after.scene.inventory);
  const bounds=after.scene.frames.every((f:any,i:number)=>f.calls<=before.scene.frames[i].calls+8&&f.triangles<=before.scene.frames[i].triangles+16)&&textures.every(t=>t.coverage>=policy.artCoverageRange[0]&&t.coverage<=policy.artCoverageRange[1]);
  const fidelity=protectedEqual&&errors.length===0&&textures.every(t=>t.contrast>=policy.artMinimumContrast)&&separation>=policy.artMinimumSeparation&&comparisons.every((c:any)=>c.mean>.001)&&comparisons.every((c:any)=>c.mean<.35);
  mkdirSync('artifacts/evolution/art',{recursive:true});
  const prefix=candidate.id.replace(/[^a-zA-Z0-9_-]/g,'_');
  for(const [name,result]of [['before',before],['after',after]] as const){result.scene.frames.forEach((f:any,i:number)=>writeFileSync(`artifacts/evolution/art/${prefix}-${name}-view${i}.png`,Buffer.from(f.png,'base64')));result.textures.forEach((t:any,i:number)=>writeFileSync(`artifacts/evolution/art/${prefix}-${name}-site${i}.png`,Buffer.from(t.png,'base64')));}
  const summarize=(r:any)=>({textures:r.textures.map(({png,...t}:any)=>t),frames:r.scene.frames.map(({png,...f}:any)=>f)});
  return {family:'art',candidate:candidate.id,configHash:hash(candidate.config),metric:'inverse lettering contrast + motif density deviation (lower is better; not aesthetic quality)',baselineWork:loss(before,incumbent.art),candidateWork:loss(after,candidate.config.art),fidelity,samples:4,bounds,checks:false,reference:{protectedEqual,separation,evidence:`artifacts/evolution/art/${prefix}-*.png`},before:summarize(before),after:summarize(after),comparisons,errors};
 }finally{await browser.close();await new Promise<void>(r=>server.httpServer.close(()=>r()));}
}
