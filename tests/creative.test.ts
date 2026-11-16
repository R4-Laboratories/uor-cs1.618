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
