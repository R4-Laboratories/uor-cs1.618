import * as T from 'three';
import {artProgram,drawMotif} from '../../shared/generated-artwork';
import {validateArt,type ArtProgram} from '../../shared/creative-program';
export function drawProgramMotif(ctx:CanvasRenderingContext2D,p:ArtProgram){
 for(const s of p.shapes){ctx.lineWidth=s.weight;ctx.beginPath();if(s.kind==='line'){ctx.moveTo(s.x,s.y);ctx.lineTo(s.a,s.b);}else if(s.kind==='ring')ctx.arc(s.x,s.y,s.a*.25,0,Math.PI*2);else ctx.rect(s.x,s.y,s.a*.3,s.b*.3);ctx.stroke();}
}
export function paintArtwork(ctx:CanvasRenderingContext2D,site:'A'|'B',p:ArtProgram){
 validateArt(p);const {width,height}=ctx.canvas;ctx.save();try{
 ctx.setTransform(width,0,0,height,0,0);ctx.fillStyle=p.background;ctx.fillRect(0,0,1,1);
 ctx.strokeStyle=site==='A'?p.siteA:p.siteB;ctx.save();ctx.beginPath();ctx.rect(.48,.06,.48,.88);ctx.clip();
 if(JSON.stringify(p)===JSON.stringify(artProgram))drawMotif(ctx);else drawProgramMotif(ctx,p);ctx.restore();
 ctx.fillStyle=site==='A'?p.siteA:p.siteB;ctx.fillRect(.04,.08,.012,.84);ctx.fillRect(.07,.86,.84,.012);
 ctx.fillStyle=p.ink;ctx.font='bold .42px monospace';ctx.textBaseline='alphabetic';ctx.fillText(site,.09,.59);
 ctx.font='bold .042px monospace';ctx.fillText('MERIDIAN / RELAY',.09,.72);ctx.font='.028px monospace';ctx.fillText('SIGNAL '+String(p.seed).padStart(8,'0'),.09,.80);
 }finally{ctx.restore();}
}
/** Only decorative planes change. All colliders, landmarks and objective labels stay owned by WorldView. */
export class ArtworkLayer{
 readonly panels:T.Mesh[]=[];private textures:T.CanvasTexture[]=[];private enabled=true;private populated=false;status='baseline';
 constructor(scene:T.Scene){
  for(const [x,y,z,w,h]of [[-16,2.1,-20.42,6,2.3],[16,2.1,-20.42,6,2.3],[-12,3.2,19.05,6,2.4],[12,3.2,19.05,6,2.4]]){const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:0xffffff,polygonOffset:true,polygonOffsetFactor:-1}));mesh.position.set(x,y,z);mesh.userData.proceduralArt=true;mesh.visible=false;scene.add(mesh);this.panels.push(mesh);}
  this.apply(artProgram);
 }
 apply(program:ArtProgram){
  const next:T.CanvasTexture[]=[];
  try{validateArt(program);for(const site of ['A','B'] as const){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;paintArtwork(canvas.getContext('2d')!,site,program);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;next.push(texture);}
   const old=this.textures;this.textures=next;this.populated=program.shapes.length>0;this.panels.forEach((mesh,i)=>{const material=mesh.material as T.MeshBasicMaterial;material.map=next[i%2];material.needsUpdate=true;mesh.visible=this.enabled&&this.populated;});old.forEach(t=>t.dispose());this.status=this.populated?'active':'baseline';
  }catch{next.forEach(t=>t.dispose());this.status='rejected';return false;}return true;
 }
 setEnabled(value:boolean){this.enabled=value;for(const p of this.panels)p.visible=value&&this.populated;}
 dispose(){for(const p of this.panels){p.removeFromParent();p.geometry.dispose();(p.material as T.Material).dispose();}this.textures.forEach(t=>t.dispose());}
}
