import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {createEngine} from '../shared/engine';
import {CharacterLayer} from '../src/characters';
import {RULES} from '../shared/config';
import type {PublicPlayer} from '../shared/protocol';
const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
const player=(id:string):PublicPlayer=>({id,name:id,team:'attack',alive:true,x:0,y:0,z:0,vx:0,vy:0,vz:5,grounded:true,crouch:false,yaw:0,pitch:0,weapon:'kestrel',kills:0,deaths:0,bot:false});
test('upgraded Wasm returns actual team-distinct 22-joint Verdant meshes and rejects invalid slots',()=>{
 const a=engine.characterAsset(0),b=engine.characterAsset(1);assert.equal(a.bones.length,22);assert.equal(a.indices.length/3,1200);assert.notDeepEqual(a.colors,b.colors);
 for(const [i,bone]of a.bones.entries())assert(bone.root?i===0:bone.parent<i);
 for(const w of a.weights)assert.equal(w.reduce((n,v)=>n+v,0),1000);
 assert.equal(engine.createCharacter(10,0),false);assert.throws(()=>engine.characterPose(10,.01,0,0,0,true));
});
test('GPU skinning bridge fits standing height and animates finite nonrigid vertices',()=>{
 const layer=new CharacterLayer(engine),p=player('actor'),group=layer.create(p),rig=layer.rigs.get(p.id)!;
 group.updateMatrixWorld(true);rig.mesh.skeleton.update();rig.mesh.computeBoundingBox();
 assert(Math.abs(rig.mesh.boundingBox!.max.y-rig.mesh.boundingBox!.min.y-RULES.standingHeight/rig.mesh.scale.y)<1e-5);
 const worldBox=rig.mesh.boundingBox!.clone().applyMatrix4(rig.mesh.matrixWorld);assert(Math.abs(worldBox.max.y-RULES.standingHeight)<1e-5);assert(Math.abs(worldBox.min.y)<1e-5);
 const sample=()=>Array.from({length:rig.mesh.geometry.attributes.position.count},(_,i)=>rig.mesh.getVertexPosition(i,new T.Vector3()).toArray()).flat();
 const before=sample();for(let i=0;i<60;i++)layer.update(p,1/60,i/60);group.updateMatrixWorld(true);rig.mesh.skeleton.update();const after=sample();
 assert(after.every(Number.isFinite));assert(after.some((v,i)=>Math.abs(v-before[i])>.02));assert(layer.poseUpdates>=25);assert.equal(rig.mesh.skeleton.bones.length,22);layer.clear();assert.equal(layer.rigs.size,0);
});
test('ten-player character roster releases Wasm slots and GPU skeletons for reuse',()=>{
 const layer=new CharacterLayer(engine);for(let i=0;i<10;i++)layer.create(player(String(i)));assert.throws(()=>layer.create(player('overflow')));
 layer.remove('3');layer.create(player('replacement'));assert.equal(layer.rigs.get('replacement')!.slot,3);layer.clear();assert.equal(layer.rigs.size,0);assert.throws(()=>engine.characterPose(3,.01,0,0,0,true));
});

test('steep bot aim stays within the animation ABI without interrupting rendering',()=>{
 const layer=new CharacterLayer(engine),p=player('bot');layer.create(p);
 for(const pitch of [-Math.PI/2,Math.PI/2]){p.pitch=pitch;assert.doesNotThrow(()=>layer.update(p,1/30,1));}
 assert.equal(layer.poseUpdates,2);layer.clear();
});
