import { BOXES } from './map';
type Exports=Record<string,(...args:number[])=>number>;
export class VerdantEngine {
 constructor(private ex:Exports) {ex.cs_clear();for(const b of BOXES)ex.cs_box(b.x,b.y,b.z,b.w,b.h,b.d);ex.cs_build();}
 ray(x:number,y:number,z:number,dx:number,dy:number,dz:number,max=150){return this.ex.cs_ray(x,y,z,dx,dy,dz,max);}
 move(x:number,y:number,z:number,dx:number,dz:number,r:number,h:number){this.ex.cs_move(x,y,z,dx,dz,r,h);return {x:this.ex.cs_result(0),z:this.ex.cs_result(2)};}
 support(x:number,z:number,ceiling:number,r:number){return this.ex.cs_support(x,z,ceiling,r);}
 hitbox(x:number,y:number,z:number,dx:number,dy:number,dz:number,bx:number,by:number,bz:number,r:number,h:number){return this.ex.cs_hitbox(x,y,z,dx,dy,dz,bx,by,bz,r,h);}
 audio(sx:number,sy:number,sz:number,lx:number,ly:number,lz:number,yaw:number){this.ex.cs_audio(sx,sy,sz,lx,ly,lz,yaw);return {pan:this.ex.cs_result(0),gain:this.ex.cs_result(1),itd:this.ex.cs_result(2),occluded:this.ex.cs_result(3)>0};}
}
export async function createEngine(bytes:BufferSource){
 const {instance}=await WebAssembly.instantiate(bytes,{});
 return new VerdantEngine(instance.exports as unknown as Exports);
}
