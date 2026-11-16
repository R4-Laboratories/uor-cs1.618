import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {applyStaticBatching,sceneryInventory} from '../src/evolution/render-batching';
import {generateNavigation,generateRender,validateState} from '../scripts/evolution/generate';
import {evaluateEvidence,chooseCandidates} from '../scripts/evolution/policy';
import policy from '../model/evolution/policy.json';
const state={schema:'cs1618/evolution-state/1',generation:0,seed:1618,config:{render:{cell:0,minimum:2},navigation:{cell:0}},weights:{render:8,navigation:8},context:'',tried:[] as string[],history:[] as any[]};
test('evolution batching preserves original transforms, excludes actors and rolls back',()=>{
 const scene=new T.Scene(),geometry=new T.BoxGeometry(),material=new T.MeshStandardMaterial();
 const meshes=[];for(let n=0;n<4;n++){const mesh=new T.Mesh(geometry,material);mesh.position.set(n,1,0);mesh.scale.set(2,3,1);mesh.userData.staticScenery=true;scene.add(mesh);meshes.push(mesh);}
 const actor=new T.Mesh(geometry,material);scene.add(actor);
 const baseline=sceneryInventory(scene);const undo=applyStaticBatching(scene,{cell:16,minimum:2});assert.deepEqual(sceneryInventory(scene),baseline);
 assert.equal(scene.children.filter(x=>x instanceof T.InstancedMesh).length,1);assert.ok(meshes.every(m=>!m.visible));assert.ok(actor.visible);
 const batch=scene.children.find(x=>x instanceof T.InstancedMesh) as T.InstancedMesh;
 const matrix=new T.Matrix4();for(let n=0;n<4;n++){batch.getMatrixAt(n,matrix);assert.deepEqual(matrix.elements,meshes[n].matrixWorld.elements);}
 batch.count--;assert.notDeepEqual(sceneryInventory(scene),baseline,'A missing instance must fail fidelity even if screenshots miss it');batch.count++;
 undo();undo();assert.ok(meshes.every(m=>m.visible));assert.equal(scene.children.length,5);
});
test('invalid batching refuses before mutating the scene',()=>{
 const scene=new T.Scene(),mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());mesh.userData.staticScenery=true;scene.add(mesh);
 assert.throws(()=>applyStaticBatching(scene,{cell:NaN,minimum:2}));assert.ok(mesh.visible);assert.equal(scene.children.length,1);
});
test('evolution admission rejects missing, nonfinite, wrong-identity and regressing evidence',()=>{
 const evidence={family:'navigation',candidate:'navigation-3',configHash:'abc',baselineWork:1000,candidateWork:100,fidelity:true,samples:10,checks:true,bounds:true};
 assert.ok(evaluateEvidence(evidence,'abc',policy).admit);
 for(const patch of [{candidateWork:NaN},{candidateWork:-1},{baselineWork:0},{samples:0},{fidelity:false},{checks:false},{candidateWork:1001}])assert.equal(evaluateEvidence({...evidence,...patch},'abc',policy).admit,false);
 assert.equal(evaluateEvidence(evidence,'different',policy).admit,false);
});
test('candidate frontier settles and source projections are deterministic and bounded',()=>{
 validateState(state,policy);const candidates=chooseCandidates(state,policy,'context');assert.equal(candidates.length,2);
 const settled={...state,context:'context',tried:['navigation-3','navigation-6',...policy.renderCells.flatMap(cell=>policy.renderMinimums.map(n=>`render-${cell}-${n}`))]};
 assert.equal(chooseCandidates(settled,policy,'context').length,0);
 assert.equal(generateNavigation(state.config.navigation),generateNavigation(state.config.navigation));assert.match(generateRender(state.config.render),/applyStaticBatching/);
 assert.throws(()=>validateState({...state,config:{...state.config,render:{cell:999,minimum:2}}},policy));
});
import {AdmissionKernel} from '../scripts/evolution/admission';
test('real Prism admission Wasm rejects all fifteen incomplete evidence combinations',()=>{
 const kernel=new AdmissionKernel();for(let bits=0;bits<16;bits++)assert.equal(kernel.decide({fidelity:!!(bits&1),benefit:!!(bits&2),bounds:!!(bits&4),checks:!!(bits&8)}),bits===15?'admit':'reject');
 assert.throws(()=>kernel.decide({fidelity:true,benefit:true,bounds:true,checks:1} as any));
});
import {validatePublication} from '../scripts/evolution/publish';
import {ownedPaths,digest} from '../scripts/evolution/state';
import {deploymentDecision} from '../scripts/evolution/deploy-watch';
import {measureNavigation} from '../scripts/evolution/measure';
test('publication rejects races, stale artifacts, missing custody and edits outside the generated surface',()=>{
 const hashes=Object.fromEntries(ownedPaths.map(p=>[p,'a'.repeat(64)]));const report={schema:'cs1618/evolution-tick/1',apply:true,changed:true,checks:true,outcome:'admitted',base:'base',completed:new Date().toISOString(),outputs:hashes};
 validatePublication(report,'base','base',[ownedPaths[0]],hashes);
 assert.throws(()=>validatePublication(report,'base','newer',[ownedPaths[0]],hashes));
 assert.throws(()=>validatePublication(report,'base','base',['server/match.ts'],hashes));
 assert.throws(()=>validatePublication({...report,checks:false},'base','base',[ownedPaths[0]],hashes));
 assert.throws(()=>validatePublication({...report,outputs:{}},'base','base',[ownedPaths[0]],hashes));
 assert.throws(()=>validatePublication(report,'base','base',[ownedPaths[0]],{...hashes,[ownedPaths[0]]:'b'.repeat(64)}));
 assert.throws(()=>validatePublication({...report,completed:'2020-01-01'},'base','base',[ownedPaths[0]],hashes));
});
test('deployment watcher repairs missing publication without retrying failed validation',()=>{
 const base={head:'a',liveSha:'old',ageSeconds:900,runs:[] as any[]};
 assert.equal(deploymentDecision({...base,liveSha:'a'}),'current');assert.equal(deploymentDecision(base),'dispatch');assert.equal(deploymentDecision({...base,ageSeconds:30}),'wait');
 const run={id:1,head_sha:'a',event:'workflow_dispatch',status:'completed',conclusion:'failure',run_attempt:1};
 assert.equal(deploymentDecision({...base,runs:[run],failedJobs:['build']}),'blocked');
 assert.equal(deploymentDecision({...base,runs:[run],failedJobs:['deploy']}),'retry-deploy');
 assert.equal(deploymentDecision({...base,runs:[{...run,run_attempt:2}],failedJobs:['deploy']}),'blocked');
 assert.equal(deploymentDecision({...base,runs:[{...run,status:'in_progress'}]}),'wait');
 assert.equal(deploymentDecision({...base,runs:[{...run,conclusion:'success'},{...run,id:2,conclusion:'success'}]}),'blocked');
});
test('generated navigation alternatives preserve the independent full graph and all 480 route samples',async()=>{
 for(const cell of policy.navigationCells){const config={...state.config,navigation:{cell}};const result=await measureNavigation({id:`navigation-${cell}`,family:'navigation',config},state.config);assert.equal(result.fidelity,true);assert.equal(result.bounds,true);assert.equal(result.samples,480);assert.ok(result.candidateWork<result.baselineWork);}
});

test('history custody rejects tampered records and broken links',()=>{
 const row={generation:1,previous:'genesis',result:'admitted'};const first={...row,hash:digest(row)};
 const next={generation:2,previous:first.hash,result:'admitted'};const second={...next,hash:digest(next)};
 validateState({...state,history:[first,second]},policy);
 assert.throws(()=>validateState({...state,history:[{...first,result:'changed'}]},policy));
 const broken={...next,previous:'wrong'};assert.throws(()=>validateState({...state,history:[first,{...broken,hash:digest(broken)}]},policy));
});
