import * as T from 'three';
import {RULES} from '../shared/config';
import type {VerdantEngine,CharacterAsset} from '../shared/engine';
import type {PublicPlayer} from '../shared/protocol';
interface Rig {slot:number;group:T.Group;mesh:T.SkinnedMesh;bones:T.Bone[];elapsed:number;}
/** Actual Verdant bind meshes/weights and IK poses, rendered by Three.js GPU skinning. */
export class CharacterLayer{
 readonly rigs=new Map<string,Rig>();
 poseUpdates=0;
 private assets:CharacterAsset[];
 private geometry:T.BufferGeometry[];
 private materials:T.MeshStandardMaterial[];
 constructor(private engine:VerdantEngine){
  this.assets=[engine.characterAsset(0),engine.characterAsset(1)];
  this.geometry=this.assets.map(a=>{
   if(a.bones.length!==22||a.positions.length!==a.weights.length||a.indices.length>36000)throw Error('Invalid Verdant character topology');
   const geometry=new T.BufferGeometry();
   geometry.setAttribute('position',new T.Float32BufferAttribute(a.positions.flat(),3));geometry.setAttribute('normal',new T.Float32BufferAttribute(a.normals.flat(),3));
   geometry.setAttribute('color',new T.Float32BufferAttribute(a.colors.flatMap(c=>c.slice(0,3)),3));geometry.setIndex(a.indices);
   geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(a.joints.flat(),4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(a.weights.flat().map(v=>v/1000),4));
   geometry.morphAttributes.position=a.morphs.map(m=>new T.Float32BufferAttribute(m.flat(),3));geometry.morphTargetsRelative=true;geometry.computeBoundingSphere();return geometry;
  });
  this.materials=[0,1].map(()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.66,metalness:.18}));
 }
 create(p:PublicPlayer){
  if(this.rigs.has(p.id))return this.rigs.get(p.id)!.group;
  const used=new Set([...this.rigs.values()].map(r=>r.slot)),slot=Array.from({length:10},(_,i)=>i).find(i=>!used.has(i));
  if(slot===undefined)throw Error('Character roster exceeds ten players');const team=p.team==='attack'?0:1,asset=this.assets[team];
  if(!this.engine.createCharacter(slot,team))throw Error('Verdant character allocation refused');
  const group=new T.Group(),mesh=new T.SkinnedMesh(this.geometry[team],this.materials[team]);
  const bones=asset.bones.map(j=>{const b=new T.Bone();b.position.fromArray(j.translation);b.quaternion.fromArray(j.rotation);return b;});
  asset.bones.forEach((j,i)=>{if(j.root)mesh.add(bones[i]);else bones[j.parent].add(bones[i]);});
  mesh.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));mesh.rotation.y=Math.PI;
  const minY=Math.min(...asset.positions.map(v=>v[1])),maxY=Math.max(...asset.positions.map(v=>v[1])),scale=RULES.standingHeight/(maxY-minY);mesh.scale.setScalar(scale);mesh.position.y=-minY*scale;mesh.castShadow=true;mesh.receiveShadow=true;
  // A small bounded roster avoids a stale bind-pose frustum bound clipping animated limbs.
  mesh.frustumCulled=false;mesh.name='verdant-22-joint-operator';group.name='verdant-operator';group.add(mesh);
  this.rigs.set(p.id,{slot,group,mesh,bones,elapsed:0});return group;
 }
 update(p:PublicPlayer,dt:number,time:number){
  const rig=this.rigs.get(p.id);if(!rig)return;rig.elapsed+=dt;
  if(rig.elapsed<1/30)return;const step=Math.min(.1,rig.elapsed);rig.elapsed=0;
  const pitch=T.MathUtils.clamp(p.pitch,-1.5,1.5);
  this.poseUpdates++;const pose=this.engine.characterPose(rig.slot,step,time,Math.min(10,Math.hypot(p.vx,p.vz)),pitch,p.grounded);
  for(let i=0;i<22;i++){rig.bones[i].position.fromArray(pose,i*7);rig.bones[i].quaternion.fromArray(pose,i*7+3);}
  // Tactical weapon stance over the upstream locomotion/head/foot-IK pose.
  for(const i of [7,11])rig.bones[i].quaternion.setFromAxisAngle(new T.Vector3(1,0,0),-1.12-pitch*.3);
  for(const i of [8,12])rig.bones[i].quaternion.setFromAxisAngle(new T.Vector3(1,0,0),-.45);
  if(rig.mesh.morphTargetInfluences)for(let i=0;i<3;i++)rig.mesh.morphTargetInfluences[i]=pose[154+i];
 }
 remove(id:string){const rig=this.rigs.get(id);if(!rig)return;this.engine.releaseCharacter(rig.slot);rig.mesh.skeleton.dispose();rig.group.removeFromParent();this.rigs.delete(id);}
 clear(){for(const id of [...this.rigs.keys()])this.remove(id);}
 get diagnostics(){return {source:'Verdant Engine',joints:22,poseUpdates:this.poseUpdates,actors:this.rigs.size,trianglesPerActor:this.geometry[0].index!.count/3};}
}
