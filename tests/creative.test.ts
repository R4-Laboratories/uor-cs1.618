import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {runInNewContext} from 'node:vm';
import {validateArt,validateTactics,synthesizeArt,synthesizeTactics,compileTactics,decideProgram,type BotFacts} from '../shared/creative-program';
import {requestModelProposal} from '../scripts/evolution/creative-author';
test('creative programs reject injected code, unknown facts and excessive computation',()=>{
 const art=synthesizeArt(1618);validateArt(art);assert.throws(()=>validateArt({...art,ink:'url(https://bad)'}));assert.throws(()=>validateArt({...art,shapes:Array(49).fill(art.shapes[0])}));assert.throws(()=>validateArt({...art,shapes:[{...art.shapes[0],x:NaN}]}));
 const p=synthesizeTactics(1618);validateTactics(p);assert.throws(()=>validateTactics({...p,rules:[{when:{fact:'hiddenEnemyPosition'},action:'engage'}]}));assert.throws(()=>validateTactics({...p,rules:Array(13).fill(p.rules[0])}));let deep:any={fact:'enemy'};for(let i=0;i<8;i++)deep={not:deep};assert.throws(()=>validateTactics({...p,rules:[{when:deep,action:'engage'}]}));
});
test('seeded authors generate reproducible novel artwork and compilable tactical behavior',()=>{
 assert.deepEqual(synthesizeArt(1618),synthesizeArt(1618));assert.notDeepEqual(synthesizeArt(1618),synthesizeArt(1619));
 const program=synthesizeTactics(1618),exports:any={};runInNewContext(ts.transpileModule(compileTactics(program),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
 for(let bits=0;bits<1024;bits++){const names=['enemy','empty','lowAmmo','canPlant','canDefuse','urgent','carrier','attacker','planted','dropped'];const facts=Object.fromEntries(names.map((name,i)=>[name,!!(bits&(1<<i))])) as BotFacts;assert.equal(exports.decideTactic(facts),decideProgram(program,facts));}
});
test('model author validates responses and records provider failure without executing text',async()=>{
 const good=await requestModelProposal('token','brief',async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({art:synthesizeArt(42),tactics:synthesizeTactics(42)})}}]}),{status:200}));assert.equal(good.status,'authored');
 for(const response of [new Response('',{status:403}),new Response('{"choices":[{"message":{"content":"process.exit()"}}]}',{status:200})]){const result=await requestModelProposal('token','brief',async()=>response);assert.equal(result.status,'unavailable');assert.equal(result.proposal,null);}
 const unavailable=await requestModelProposal('token','brief',async()=>{throw new Error('network');});assert.equal(unavailable.status,'unavailable');
});
import {readFile} from 'node:fs/promises';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';
import {Match} from '../server/match';
test('generated tactics complete a real emergency defuse while a visible enemy distracts the baseline',async()=>{
 const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm')),kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
 const run=(creative:boolean)=>{const m=new Match('TACTIC',engine,kernel,creative?(facts:BotFacts)=>decideProgram(synthesizeTactics(42),facts):()=>null);m.join('a','Enemy','attack');const bot=m.join('d','Defuser','defend',true)!;m.phase='live';m.phaseLeft=80;Object.assign(bot,{x:0,z:18,kit:true});Object.assign(m.players.get('a')!,{x:0,z:22});m.bomb={state:'planted',carrier:null,x:0,y:0,z:18,site:'A',remaining:6.2};for(let i=0;i<320;i++)m.step(1/60);return m;};
 assert.equal(run(true).reason,'Device defused');assert.notEqual(run(false).reason,'Device defused');
});
test('tactics receive local visible facts, never hidden enemy coordinates',async()=>{
 const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm')),kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));let seen:BotFacts|undefined;
 const m=new Match('FACTS',engine,kernel,f=>{seen=f;return null;});const a=m.join('a','Scout','attack',true)!;const d=m.join('d','Hidden','defend')!;m.phase='live';Object.assign(a,{x:-12,z:22});Object.assign(d,{x:-12,z:0});m.botInput(a,1/60);
 assert.equal(seen!.enemy,false);assert.ok(Object.values(seen!).every(v=>typeof v==='boolean'));assert.equal(Object.keys(seen!).length,10);
});
import {measureTactics} from '../scripts/evolution/measure-creative';
import {baselineArt,baselineTactics} from '../shared/creative-program';
test('tactical promotion improves held-out decisions and real emergency outcomes, rejecting no-op policy',async()=>{
 const before={render:{cell:16,minimum:2},navigation:{cell:3},art:baselineArt,tactics:baselineTactics};
 const good={...before,tactics:synthesizeTactics(42)};const evidence=await measureTactics({id:'tactics-test',family:'tactics',config:good},before);
 assert.equal(evidence.fidelity,true);assert.equal(evidence.bounds,true);assert.ok(evidence.candidateWork<evidence.baselineWork);assert.ok((evidence.after as any).holdoutErrors<(evidence.before as any).holdoutErrors);assert.ok((evidence.after as any).completed>(evidence.before as any).completed);
 const bad=await measureTactics({id:'bad',family:'tactics',config:{...before,tactics:{version:1,rules:[{when:{fact:'enemy'},action:'guard'}],fallback:'guard'}}},good);assert.equal(bad.fidelity,false);
});
import {compileArt} from '../shared/creative-program';
import {drawProgramMotif} from '../src/creative/artwork';
test('compiled artwork executes the same bounded vector operations as its recipe',()=>{
 const p=synthesizeArt(6210),exports:any={};runInNewContext(ts.transpileModule(compileArt(p),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
 const log=()=>{const events:any[]=[];const ctx=new Proxy({},{get:(_,key)=>(...args:any[])=>events.push([key,...args]),set:(_,key,v)=>{events.push([key,v]);return true;}});return {events,ctx};};
 const a=log(),b=log();exports.drawMotif(a.ctx);drawProgramMotif(b.ctx as CanvasRenderingContext2D,p);assert.deepEqual(a.events,b.events);assert.ok(a.events.length<=48*6);
});
