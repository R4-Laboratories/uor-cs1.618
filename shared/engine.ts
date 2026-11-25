import { packRgbaPages, type PackedTexture, type TextureStagingStats } from './texture-pages';
import { BOXES } from './map';
export interface CharacterAsset {positions:number[][];normals:number[][];colors:number[][];indices:number[];morphs:number[][][];bones:{parent:number;root:boolean;translation:number[];rotation:number[]}[];joints:number[][];weights:number[][];}
export interface HdAsset {name:string;positions:number[][];normals:number[][];uvs:number[][];colors:number[][];indices:number[];}
type Exports=Record<string,(...args:number[])=>number>;
export class VerdantEngine {
 constructor(private ex:Exports,private memory:WebAssembly.Memory) {ex.cs_clear();for(const b of BOXES)ex.cs_box(b.x,b.y,b.z,b.w,b.h,b.d);ex.cs_build();}
 /** Cumulative material staging measurements across successful uploads. */
 readonly textureStaging: TextureStagingStats = {textures:0,logicalBytes:0,storedBytes:0,fillPages:0,sparsePages:0,palettePages:0,literalPages:0};
 packTexture(width:number,height:number,rgba:Uint8Array):PackedTexture {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > 1024 || height > 1024) {
   throw new RangeError('Material dimensions exceed texture staging bounds');
  }
  const span = this.ex.cs_texture_span(width,height);
  if (span <= 0 || rgba.byteLength !== span) throw new RangeError('RGBA8 data differs from the vTensor byte span');
  return packRgbaPages(rgba,this.ex.cs_texture_page_plan,this.textureStaging);
 }
 stageTexture(width:number,height:number,rgba:Uint8Array):Uint8Array<ArrayBuffer> {
  return this.packTexture(width,height,rgba).unpack();
 }
 hdAsset(kind:number,lod:number):HdAsset{
  if(!Number.isInteger(kind)||!Number.isInteger(lod)||kind<0||kind>2||lod<0||lod>4||!this.ex.cs_hd_asset(kind,lod))throw new RangeError('Invalid Verdant HD asset');
  return JSON.parse(new TextDecoder().decode(new Uint8Array(this.memory.buffer,this.ex.cs_hd_ptr(),this.ex.cs_hd_len())));
 }
 recommendLod(lod:number,micros:number,pinned:boolean){
  if(!Number.isInteger(lod)||lod<0||lod>4||!Number.isFinite(micros)||micros<0||micros>1_000_000)throw new RangeError('Invalid Verdant frame sample');
  const next=this.ex.cs_lod(lod,micros,pinned?1:0);if(next<0)throw new RangeError('Verdant governor refused');return next;
 }
 cameraFrame(x:number,y:number,z:number,yaw:number,pitch:number,fov:number,aspect:number){
  if(!this.ex.cs_camera(x,y,z,yaw,pitch,fov,aspect))throw new RangeError('Verdant camera guard refused');
  const r=this.ex.cs_camera_result;
  return {x:r(0),y:r(1),z:r(2),guard:r(3),clearance:r(4),guarded:r(5)===1,obstructed:r(6)===1};
 }
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
