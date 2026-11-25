import * as T from 'three';
import {BOXES, type Box} from '../shared/map';

interface Contact { position:T.Vector3; normal:T.Vector3; material:Box['material']|'paving'; clearance:number }
const tolerance=.035;
const tones:Record<Contact['material'],number>={stone:0xa49a89,plaster:0xc1b09b,teal:0xaabcaf,crate:0xaa8d62,metal:0x84979b,paving:0x878c82};

/** Accept only a face coincident with the game authority's reported endpoint. */
export function impactSurface(x:number,y:number,z:number,boxes:readonly Box[]=BOXES):Contact|null {
 if(![x,y,z].every(Number.isFinite))return null;
 let nearest:Contact|null=null, distance=tolerance;
 for(const box of boxes){
  const dx=x-box.x,dy=y-(box.y+box.h/2),dz=z-box.z;
  const gap=[box.w/2-Math.abs(dx),box.h/2-Math.abs(dy),box.d/2-Math.abs(dz)];
  if(gap.some(value=>value < -tolerance))continue;
  const axis=gap.reduce((best,_,i)=>Math.abs(gap[i])<Math.abs(gap[best])?i:best,0);
  if(Math.abs(gap[axis])>=distance)continue;
  const normal=new T.Vector3();
  normal.setComponent(axis,Math.sign([dx,dy,dz][axis])||1);
  nearest={position:new T.Vector3(x,y,z).addScaledVector(normal,gap[axis]),normal,
   material:box.material,clearance:Math.min(gap[(axis+1)%3],gap[(axis+2)%3])};
  distance=Math.abs(gap[axis]);
 }
 if(nearest)return nearest;
 return Math.abs(y)<tolerance?{position:new T.Vector3(x,0,z),normal:new T.Vector3(0,1,0),material:'paving',clearance:1}:null;
}
function makeScuff(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d')!;
 // Angular chipped edges, with a shaded center and a small exposed lighter rim.
 ctx.beginPath();
 for(let i=0;i<18;i++){
  const angle=i*Math.PI/9,r=20+6*Math.sin(i*8.3)+3*Math.cos(i*4.1);
  const x=32+Math.cos(angle)*r,y=32+Math.sin(angle)*r;
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 ctx.closePath();
 const chip=ctx.createRadialGradient(30,31,1,32,32,29);
 chip.addColorStop(0,'rgba(29,27,26,.95)');chip.addColorStop(.4,'rgba(60,56,49,.85)');
 chip.addColorStop(.73,'rgba(184,175,151,.74)');chip.addColorStop(1,'rgba(194,184,162,0)');
 ctx.fillStyle=chip;ctx.fill();
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}
const forward=new T.Vector3(0,0,1);
export class ImpactMarks {
 private readonly mesh:T.InstancedMesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 private readonly transform=new T.Object3D();
 private cursor=0;
 constructor(scene:T.Scene,private readonly capacity=48){
  const mat=new T.MeshBasicMaterial({map:makeScuff(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  this.mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),mat,capacity);
  this.mesh.name='Scenery impact marks';this.mesh.count=0;this.mesh.frustumCulled=false;
  this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(this.mesh);
 }
 stamp(x:number,y:number,z:number,seed:number){
  const hit=impactSurface(x,y,z);
  if(!hit||hit.clearance<.028)return;
  const width=Math.min(.12+(Math.abs(seed)%7)*.009,hit.clearance*1.8);
  this.transform.scale.set(width,width*.84,1);
  this.transform.position.copy(hit.position).addScaledVector(hit.normal,.006);
  this.transform.quaternion.setFromUnitVectors(forward,hit.normal);
  this.transform.rotateZ(seed*2.39996);this.transform.updateMatrix();
  this.mesh.setMatrixAt(this.cursor,this.transform.matrix);
  this.mesh.setColorAt(this.cursor,new T.Color(tones[hit.material]));
  this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor!.needsUpdate=true;
  this.mesh.count=Math.min(this.mesh.count+1,this.capacity);
  this.cursor=(this.cursor+1)%this.capacity;
 }
 clear(){this.cursor=0;this.mesh.count=0;}
}
