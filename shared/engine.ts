import { BOXES } from './map';
export interface CharacterAsset {positions:number[][];normals:number[][];colors:number[][];indices:number[];morphs:number[][][];bones:{parent:number;root:boolean;translation:number[];rotation:number[]}[];joints:number[][];weights:number[][];}
type Exports=Record<string,(...args:number[])=>number>;
export class VerdantEngine {
 constructor(private ex:Exports,private memory:WebAssembly.Memory) {ex.cs_clear();for(const b of BOXES)ex.cs_box(b.x,b.y,b.z,b.w,b.h,b.d);ex.cs_build();}
 characterAsset(team:0|1):CharacterAsset{
  if(!this.ex.cs_character_asset(team))throw Error('Verdant character asset refused');
  const bytes=new Uint8Array(this.memory.buffer,this.ex.cs_character_asset_ptr(),this.ex.cs_character_asset_len());
  return JSON.parse(new TextDecoder().decode(bytes));
 }
 createCharacter(slot:number,team:0|1){return this.ex.cs_character_create(slot,team)===1;}
 releaseCharacter(slot:number){this.ex.cs_character_release(slot);}
 characterPose(slot:number,dt:number,time:number,speed:number,pitch:number,grounded:boolean){
  if(!this.ex.cs_character_step(slot,dt,time,speed,pitch,grounded?1:0))throw Error('Verdant character pose refused');
  return new Float32Array(this.memory.buffer,this.ex.cs_character_pose_ptr(),this.ex.cs_character_pose_len()).slice();
 }
 ray(x:number,y:number,z:number,dx:number,dy:number,dz:number,max=150){return this.ex.cs_ray(x,y,z,dx,dy,dz,max);}
 move(x:number,y:number,z:number,dx:number,dz:number,r:number,h:number){this.ex.cs_move(x,y,z,dx,dz,r,h);return {x:this.ex.cs_result(0),z:this.ex.cs_result(2)};}
 support(x:number,z:number,ceiling:number,r:number){return this.ex.cs_support(x,z,ceiling,r);}
 hitbox(x:number,y:number,z:number,dx:number,dy:number,dz:number,bx:number,by:number,bz:number,r:number,h:number){return this.ex.cs_hitbox(x,y,z,dx,dy,dz,bx,by,bz,r,h);}
 audio(sx:number,sy:number,sz:number,lx:number,ly:number,lz:number,yaw:number){this.ex.cs_audio(sx,sy,sz,lx,ly,lz,yaw);return {pan:this.ex.cs_result(0),gain:this.ex.cs_result(1),itd:this.ex.cs_result(2),occluded:this.ex.cs_result(3)>0};}
}
export async function createEngine(bytes:BufferSource){
 const {instance}=await WebAssembly.instantiate(bytes,{});
 return new VerdantEngine(instance.exports as unknown as Exports,instance.exports.memory as WebAssembly.Memory);
}
