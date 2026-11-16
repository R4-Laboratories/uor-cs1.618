import {WorldView} from '../world';
import {applyStaticBatching,sceneryInventory,type BatchPolicy} from './render-batching';
import {renderPolicy} from '../generated/render-policy';
const canvas=document.querySelector('canvas')!;
const world=new WorldView(canvas,{evolution:false,preserveDrawingBuffer:true});
world.renderer.setPixelRatio(1);world.renderer.setSize(640,400,false);world.camera.aspect=640/400;world.camera.updateProjectionMatrix();
const cameras=[{at:[0,1.62,24],to:[0,2,0]},{at:[-19,1.62,13],to:[-15,2,-15]},{at:[19,1.62,-15],to:[15,2,15]},{at:[0,7,-23],to:[0,1,6]}];
let undo:()=>void=()=>{};
function measure(policy:BatchPolicy){
 undo();undo=applyStaticBatching(world.scene,policy);world.renderer.shadowMap.needsUpdate=true;
 const frames=[];
 for(const view of cameras){
  world.camera.position.set(view.at[0],view.at[1],view.at[2]);world.camera.lookAt(view.to[0],view.to[1],view.to[2]);
  world.renderer.render(world.scene,world.camera);
  const times=[];for(let n=0;n<3;n++){world.renderer.info.reset();const start=performance.now();world.renderer.render(world.scene,world.camera);world.renderer.getContext().finish();times.push(performance.now()-start);}
  frames.push({calls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles,frameMs:times.sort((a,b)=>a-b)[1],png:canvas.toDataURL('image/png').split(',')[1]});
 }
 return {frames,inventory:sceneryInventory(world.scene)};
}
Object.assign(window,{evolutionLab:{ready:true,generated:renderPolicy,measure}});
