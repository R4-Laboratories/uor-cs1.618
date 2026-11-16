import {audioBus,noiseBuffer,playCue,GameAudio} from './audio';
import {WEAPONS} from '../shared/config';
import {experiencePolicy} from '../shared/generated-experience';
export async function measureAudio(){
 const rows=[];
 for(const weapon of Object.keys(WEAPONS))for(const occluded of [false,true]){
  const ctx=new OfflineAudioContext(2,24000,24000),master=audioBus(ctx,.45),noise=noiseBuffer(ctx);let ended=0;
  playCue(ctx,master,noise,{id:1,type:'shot',weapon},{pan:.8,gain:1,occluded},()=>ended++);
  const buffer=await ctx.startRendering(),left=buffer.getChannelData(0),right=buffer.getChannelData(1);
  const energy=(v:Float32Array)=>v.reduce((n,x)=>n+x*x,0)/v.length;
  const peak=Math.max(...left.map(Math.abs),...right.map(Math.abs));
  rows.push({weapon,occluded,peak,left:energy(left),right:energy(right),tail:energy(right.slice(-1000)),ended});
 }
 const ctx=new OfflineAudioContext(2,24000,24000),master=audioBus(ctx,.45),noise=noiseBuffer(ctx);let ended=0;
 for(let i=0;i<experiencePolicy.voices;i++)playCue(ctx,master,noise,{id:i,type:'shot',weapon:'kestrel'},{pan:0,gain:1,occluded:false},()=>ended++);
 const buffer=await ctx.startRendering(),peak=Math.max(...buffer.getChannelData(0).map(Math.abs));
 return {rows,stress:{voices:experiencePolicy.voices,peak,ended}};
}
export async function stressVoices(){
 const audio=new GameAudio({audio:()=>({pan:0,gain:1,occluded:false})} as any);await audio.start();
 for(let i=0;i<200;i++)audio.event({id:i,type:i%3?'shot':'step',weapon:'m4'}, {x:0,y:0,z:0,yaw:0},'self');
 const high=audio.activeVoices;await new Promise(resolve=>setTimeout(resolve,600));const after=audio.activeVoices;await audio.ctx!.close();return {high,after,limit:experiencePolicy.voices};
}
Object.assign(window,{experienceLab:{measureAudio,stressVoices}});
