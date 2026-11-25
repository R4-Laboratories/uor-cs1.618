import * as T from 'three';
import {carriedLength,carriedModel, tailoredKit, uniformColor} from './operator-kit';
import {surfaceTexture} from './operator-geometry';
import {operatorTextile} from './operator-textile';
import {studioSurface} from './studio-render';
import {RULES,WEAPONS} from '../shared/config';
import type {VerdantEngine,CharacterAsset} from '../shared/engine';
import type {PublicPlayer} from '../shared/protocol';
interface Rig {slot:number;group:T.Group;mesh:T.SkinnedMesh;bones:T.Bone[];weapon:T.Mesh;shadow:T.Mesh;elapsed:number;}
/** Actual Verdant bind meshes/weights and IK poses, rendered by Three.js GPU skinning. */
export class CharacterLayer{
 readonly rigs=new Map<string,Rig>();
 poseUpdates=0;
 private assets:CharacterAsset[];
 private geometry:T.BufferGeometry[];
 private materials:T.MeshStandardMaterial[];
 private kitGeometry:T.BufferGeometry[];
 private carriedGeometry=new Map<string,T.BufferGeometry>();
 private kitMaterials:T.MeshStandardMaterial[];
 private carriedMaterial:T.MeshStandardMaterial;
 private readonly groundGeometry=new T.PlaneGeometry(.85,1.02);
 private readonly groundMaterial:T.MeshBasicMaterial;
 private readonly target=new T.Vector3();
 private readonly axis=new T.Vector3();
 private readonly elbow=new T.Vector3();
 private readonly pole=new T.Vector3();
 private readonly boneDown=new T.Vector3(0,-1,0);
 private readonly inverse=new T.Quaternion();
 constructor(private engine:VerdantEngine){
  this.assets=[engine.characterAsset(0),engine.characterAsset(1)];
  this.geometry=this.assets.map((a,team)=>{
   if(a.bones.length!==22||a.positions.length!==a.weights.length||a.indices.length>36000)throw Error('Invalid Verdant character topology');
   const geometry=new T.BufferGeometry();
   geometry.setAttribute('position',new T.Float32BufferAttribute(a.positions.flat(),3));geometry.setAttribute('normal',new T.Float32BufferAttribute(a.normals.flat(),3));
   const colors=a.positions.flatMap(([x,y,z],i)=>uniformColor(team,a.joints[i][0],x,y,z).toArray());
   geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
   geometry.setAttribute('uv',new T.Float32BufferAttribute(a.positions.flatMap(([x,y,z])=>[(x+z)*5,y*5]),2));geometry.setIndex(a.indices);
   geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(a.joints.flat(),4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(a.weights.flat().map(v=>v/1000),4));
   geometry.morphAttributes.position=a.morphs.map(m=>new T.Float32BufferAttribute(m.flat(),3));geometry.morphTargetsRelative=true;geometry.computeBoundingSphere();return geometry;
  });
  const twill=operatorTextile(), finish=surfaceTexture('finish',28);
  this.materials=[0,1].map(i=>new T.MeshStandardMaterial({...studioSurface(i?'navyFabric':'oliveFabric'),...twill,color:0xffffff,vertexColors:true}));
  const webbing=new T.MeshStandardMaterial({...studioSurface('webbing'),...twill,color:0xffffff,vertexColors:true});
  webbing.name='Woven carrier';
  const hardware=new T.MeshStandardMaterial({...studioSurface('tealPaint'),color:0xffffff,vertexColors:true,map:finish});
  hardware.name='Coated helmet and hardware';
  const visor=new T.MeshPhysicalMaterial({...studioSurface('glass'),color:0xffffff,vertexColors:true,
   clearcoat:1,clearcoatRoughness:.075,ior:1.5,envMapIntensity:1.4});
  visor.name='Curved visor';
  this.kitGeometry=this.assets.map(tailoredKit);
  this.kitMaterials=[webbing,hardware,visor];
  this.carriedMaterial=new T.MeshStandardMaterial({...studioSurface('gunmetal'),color:0xffffff,vertexColors:true,map:finish});
  this.carriedMaterial.name='Equipment alloy';
  const size=32,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=(y*size+x)*4,r=Math.hypot((x+.5)*2/size-1,(y+.5)*2/size-1);
   data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(112*Math.pow(Math.max(0,1-r*r),2));
  }
  const mask=new T.DataTexture(data,size,size);mask.magFilter=T.LinearFilter;mask.minFilter=T.LinearFilter;mask.needsUpdate=true;
  this.groundMaterial=new T.MeshBasicMaterial({map:mask,color:0x241e18,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
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
  const gear=new T.SkinnedMesh(this.kitGeometry[team],this.kitMaterials);
  gear.name='fitted-field-equipment';gear.castShadow=true;gear.receiveShadow=true;gear.frustumCulled=false;
  gear.bind(mesh.skeleton,mesh.bindMatrix);mesh.add(gear);
  const weapon=new T.Mesh(this.weaponGeometry(p.weapon),this.carriedMaterial);
  weapon.name=p.weapon;weapon.castShadow=true;weapon.position.set(-.095,-.035,.24);bones[3].add(weapon);
  const shadow=new T.Mesh(this.groundGeometry,this.groundMaterial);
  shadow.name='boot-contact';shadow.rotation.x=-Math.PI/2;shadow.position.y=.017;group.add(shadow);
  this.rigs.set(p.id,{slot,group,mesh,bones,weapon,shadow,elapsed:0});return group;
 }
 muzzleOf(id:string,weapon:string|undefined){
  const rig=this.rigs.get(id);
  if(!rig||!rig.group.visible||rig.weapon.name!==weapon)return null;
  return rig.weapon.localToWorld(new T.Vector3(0,.026,carriedLength(rig.weapon.name)));
 }
 private weaponGeometry(id:string){
  const key=Object.hasOwn(WEAPONS,id)?id:'sidearm';
  let geometry=this.carriedGeometry.get(key);
  if(!geometry){geometry=carriedModel(key);this.carriedGeometry.set(key,geometry);}
  return geometry;
 }
 // Solve in the upper arm parent's local coordinates. The chosen bend plane keeps elbows
 // below and outside the chest. Firing pose follows the remote weapon's pitch.
 private grip(rig:Rig,arm:number,side:number,z:number){
  const upper=rig.bones[arm],forearm=rig.bones[arm+1],hand=rig.bones[arm+2];
  const upperLength=forearm.position.length(),foreLength=hand.position.length();
  this.target.set(side*.025,-.060,z);
  rig.weapon.localToWorld(this.target);
  upper.parent!.worldToLocal(this.target);
  this.axis.copy(this.target).sub(upper.position);
  const distance=T.MathUtils.clamp(this.axis.length(),.08,upperLength+foreLength-.001);
  this.axis.normalize();
  const along=(upperLength*upperLength-foreLength*foreLength+distance*distance)/(2*distance);
  this.pole.set(side*.72,-1,-.22).addScaledVector(this.axis,-this.pole.dot(this.axis)).normalize();
  this.elbow.copy(this.axis).multiplyScalar(along).addScaledVector(this.pole,Math.sqrt(Math.max(0,upperLength*upperLength-along*along)));
  upper.quaternion.setFromUnitVectors(this.boneDown,this.target.copy(this.elbow).normalize());
  this.target.copy(this.axis).multiplyScalar(distance).sub(this.elbow).normalize();
  this.inverse.copy(upper.quaternion).invert();this.target.applyQuaternion(this.inverse);
  forearm.quaternion.setFromUnitVectors(this.boneDown,this.target);
 }
 update(p:PublicPlayer,dt:number,time:number){
  const rig=this.rigs.get(p.id);if(!rig)return;
  rig.shadow.visible=p.grounded;
  if(rig.weapon.name!==p.weapon){rig.weapon.name=p.weapon;rig.weapon.geometry=this.weaponGeometry(p.weapon);}
  rig.elapsed+=dt;
  if(rig.elapsed<1/30)return;const step=Math.min(.1,rig.elapsed);rig.elapsed=0;
  const pitch=T.MathUtils.clamp(p.pitch,-1.5,1.5);
  this.poseUpdates++;const pose=this.engine.characterPose(rig.slot,step,time,Math.min(10,Math.hypot(p.vx,p.vz)),pitch,p.grounded);
  for(let i=0;i<22;i++){rig.bones[i].position.fromArray(pose,i*7);rig.bones[i].quaternion.fromArray(pose,i*7+3);}
  rig.weapon.rotation.x=-pitch;
  this.grip(rig,7,-1,.0);
  this.grip(rig,11,1,(p.weapon==='sidearm'||p.weapon==='rivet')?.065:.18);
  if(rig.mesh.morphTargetInfluences)for(let i=0;i<3;i++)rig.mesh.morphTargetInfluences[i]=pose[154+i];
 }
 remove(id:string){const rig=this.rigs.get(id);if(!rig)return;this.engine.releaseCharacter(rig.slot);rig.mesh.skeleton.dispose();rig.group.removeFromParent();this.rigs.delete(id);}
 clear(){for(const id of [...this.rigs.keys()])this.remove(id);}
 dispose(){
  this.clear();this.geometry.forEach(g=>g.dispose());this.kitGeometry.forEach(g=>g.dispose());
  this.carriedGeometry.forEach(g=>g.dispose());this.materials[0].map?.dispose();this.materials[0].normalMap?.dispose();this.carriedMaterial.map?.dispose();
  this.materials.forEach(material=>material.dispose());this.kitMaterials.forEach(material=>material.dispose());this.carriedMaterial.dispose();
  this.groundGeometry.dispose();this.groundMaterial.map?.dispose();this.groundMaterial.dispose();
 }
 get diagnostics(){return {source:'Verdant Engine',joints:22,poseUpdates:this.poseUpdates,actors:this.rigs.size,trianglesPerActor:this.geometry[0].index!.count/3,equipmentTriangles:this.kitGeometry[0].getAttribute('position').count/3};}
}
