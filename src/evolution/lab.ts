import {WorldView} from '../world';
import {applyStaticBatching,sceneryInventory,type BatchPolicy} from './render-batching';
import {renderPolicy} from '../generated/render-policy';
const canvas=document.querySelector('canvas')!;
const world=new WorldView(canvas,{evolution:false,preserveDrawingBuffer:true});
world.renderer.setPixelRatio(1);world.renderer.setSize(640,400,false);world.camera.aspect=640/400;world.camera.updateProjectionMatrix();
const cameras=[{at:[0,1.62,24],to:[0,2,0]},{at:[-19,1.62,13],to:[-15,2,-15]},{at:[19,1.62,-15],to:[15,2,15]},{at:[0,7,-23],to:[0,1,6]}];
let undo:()=>void=()=>{};
function measure(policy:BatchPolicy,views=cameras){
 undo();undo=applyStaticBatching(world.scene,policy);world.renderer.shadowMap.needsUpdate=true;
 const frames=[];
 for(const view of views){
  world.camera.position.set(view.at[0],view.at[1],view.at[2]);world.camera.lookAt(view.to[0],view.to[1],view.to[2]);
  world.renderer.render(world.scene,world.camera);
  const times=[];for(let n=0;n<3;n++){world.renderer.info.reset();const start=performance.now();world.renderer.render(world.scene,world.camera);world.renderer.getContext().finish();times.push(performance.now()-start);}
  frames.push({calls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles,frameMs:times.sort((a,b)=>a-b)[1],png:canvas.toDataURL('image/png').split(',')[1]});
 }
 return {frames,inventory:sceneryInventory(world.scene)};
}
const evolutionLab={ready:false, generated:renderPolicy, measure};
Object.assign(window,{evolutionLab});
void world.meridian.ready.then(() => {
 if(world.meridian.status.failed.length)throw new Error('Meridian surface assets failed to load');
 evolutionLab.ready=true;
});
// Creative evaluation keeps protected scene identity while permitting the declared art surfaces to change.
import {artProgram} from '../../shared/generated-artwork';
import {paintArtwork} from '../creative/artwork';
import type {ArtProgram} from '../../shared/creative-program';
function artMetrics(program:ArtProgram){
 return (['A','B'] as const).map(site=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d')!;paintArtwork(ctx,site,program);const pixels=ctx.getImageData(0,0,512,256).data;
  const light=(r:number,g:number,b:number)=>[r,g,b].map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const bg=[pixels[0],pixels[1],pixels[2]];let peak=0,covered=0,count=0;
  for(let y=30;y<220;y++)for(let x=32;x<490;x++){const i=(y*512+x)*4;if(x<220)peak=Math.max(peak,light(pixels[i],pixels[i+1],pixels[i+2]));else if(x>256){count++;if(Math.max(...bg.map((c,k)=>Math.abs(c-pixels[i+k])))>24)covered++;}}
  const background=light(bg[0],bg[1],bg[2]);return {site,contrast:(peak+.05)/(background+.05),coverage:covered/count,png:canvas.toDataURL('image/png').split(',')[1]};
 });
}
function measureArt(program:ArtProgram){
 if(!world.artwork.apply(program))throw Error('Artwork rejected');world.artwork.setEnabled(true);
 const views=[{at:[-12,1.62,24],to:[-12,1.8,19]},{at:[12,1.62,24],to:[12,1.8,19]},{at:[-16,1.62,-16],to:[-16,2.1,-20.42]},{at:[16,1.62,-16],to:[16,2.1,-20.42]}];
 return {scene:measure(renderPolicy,views),textures:artMetrics(program)};
}
Object.assign((window as any).evolutionLab,{artProgram,measureArt,world});
import '../experience-lab';
