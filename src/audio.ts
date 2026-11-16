import type {VerdantEngine} from '../shared/engine';
import type {GameEvent} from '../shared/protocol';
export class GameAudio{
 ctx:AudioContext|null=null;master:GainNode|null=null;volume=.45;noise:AudioBuffer|null=null;
 constructor(private engine:VerdantEngine){}
 async start(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=this.volume;this.master.connect(this.ctx.destination);this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.5,this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}await this.ctx.resume();}
 setVolume(v:number){this.volume=v;if(this.master)this.master.gain.value=v;}
 event(e:GameEvent,listener:{x:number;y:number;z:number;yaw:number},self:string){
  if(!this.ctx||!this.master)return;const c=this.ctx,t=c.currentTime;const spatial=e.x!==undefined&&e.actor!==self;
  const cue=spatial?this.engine.audio(e.x!,e.y??0,e.z!,listener.x,listener.y+1.6,listener.z,listener.yaw):{pan:0,gain:1,occluded:false};
  const pan=c.createStereoPanner();pan.pan.value=cue.pan;pan.connect(this.master);
  const envelope=c.createGain();envelope.connect(pan);const gain=spatial?Math.min(1,cue.gain*6):1;
  const type=e.type;
  if(type==='shot'||type==='step'||type==='explode'){
   const noise=c.createBufferSource();noise.buffer=this.noise;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=cue.occluded?450:type==='step'?300:2300;
   noise.connect(filter);filter.connect(envelope);const duration=type==='explode'?.48:type==='step'?.065:.13;const level=(type==='step'?.13:type==='explode'?.8:.32)*gain;
   envelope.gain.setValueAtTime(level,t);envelope.gain.exponentialRampToValueAtTime(.001,t+duration);noise.start(t);noise.stop(t+duration);noise.onended=()=>{noise.disconnect();filter.disconnect();envelope.disconnect();pan.disconnect();};
  }else{
   const osc=c.createOscillator();osc.type=type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(type==='hit'?800:type==='plant'?660:type==='defuse'?880:440,t);osc.frequency.exponentialRampToValueAtTime(type==='hit'?300:660,t+.12);osc.connect(envelope);envelope.gain.setValueAtTime(.12,t);envelope.gain.exponentialRampToValueAtTime(.001,t+.2);osc.start();osc.stop(t+.2);osc.onended=()=>{osc.disconnect();envelope.disconnect();pan.disconnect();};
  }
 }
 beep(fast=false){if(!this.ctx)return;this.event({id:0,type:fast?'hit':'plant'},{x:0,y:0,z:0,yaw:0},'');}
}
