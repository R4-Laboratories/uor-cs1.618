import type {VerdantEngine} from '../shared/engine';
import type {GameEvent,Snapshot} from '../shared/protocol';
import {audioProfile} from '../shared/experience';
import {admitVoice} from '../shared/generated-experience';
export type AudioEvent=Omit<GameEvent,'type'>&{type:GameEvent['type']|'bomb-warning'|'bomb-critical'|'equip'};
export function noiseBuffer(ctx:BaseAudioContext){
 const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.5),ctx.sampleRate),data=buffer.getChannelData(0);let seed=1618;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
 return buffer;
}
export function audioBus(ctx:BaseAudioContext,volume:number){
 const master=ctx.createGain(),limiter=ctx.createDynamicsCompressor();
 master.gain.value=volume;limiter.threshold.value=-12;limiter.knee.value=6;limiter.ratio.value=16;limiter.attack.value=.002;limiter.release.value=.15;master.connect(limiter);limiter.connect(ctx.destination);return master;
}
// Bounded event voice: every node disconnects after its longest source ends.
export function playCue(ctx:BaseAudioContext,master:GainNode,noise:AudioBuffer,event:AudioEvent,cue:{pan:number;gain:number;occluded:boolean},ended:()=>void){
 const t=ctx.currentTime,p=audioProfile(event.type==='round'&&event.team?'round-result':event.type,event.weapon,cue.occluded),pan=ctx.createStereoPanner(),envelope=ctx.createGain();
 pan.pan.value=Math.max(-1,Math.min(1,cue.pan));pan.connect(master);envelope.connect(pan);
 const gain=Math.max(0,Math.min(1,cue.gain));envelope.gain.setValueAtTime(Math.max(.00001,p.level*gain),t);envelope.gain.exponentialRampToValueAtTime(.00001,t+p.duration);
 const sources:AudioScheduledSourceNode[]=[],nodes:AudioNode[]=[envelope,pan];
 if(['shot','step','explode'].includes(event.type)){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=noise;filter.type='lowpass';filter.frequency.value=p.cutoff;source.connect(filter);filter.connect(envelope);sources.push(source);nodes.push(filter);
 }
 for(let i=0;i<p.pulses;i++){
  const onset=t+i*p.duration/p.pulses,span=p.duration/p.pulses;
  const tone=ctx.createOscillator(),body=ctx.createGain();tone.type=event.type.startsWith('reload')||event.type==='equip'?'triangle':'sine';
  const frequency=p.tone*Math.pow(p.ratio,i);tone.frequency.setValueAtTime(frequency,onset);tone.frequency.exponentialRampToValueAtTime(Math.max(35,frequency*(p.pulses>1?.93:p.ratio)),onset+span);
  body.gain.setValueAtTime(.00001,t);body.gain.setValueAtTime(.00001,onset);body.gain.linearRampToValueAtTime(event.type==='shot'?.32:.4,onset+.003);body.gain.exponentialRampToValueAtTime(.00001,onset+span*.88);tone.connect(body);body.connect(envelope);sources.push(tone);nodes.push(body);
 }
 let remaining=sources.length,cleaned=false;
 const clean=()=>{if(cleaned)return;cleaned=true;for(const node of [...sources,...nodes])node.disconnect();ended();};
 for(const source of sources){source.onended=()=>{if(--remaining===0)clean();};source.start(t);source.stop(t+p.duration);}
 return ()=>{for(const source of sources){source.onended=null;try{source.stop();}catch{}}clean();};
}
export class GameAudio{
 ctx:AudioContext|null=null;master:GainNode|null=null;volume=.45;noise:AudioBuffer|null=null;
 private bombElapsed=0;private bombRound=-1;
 private voices=new Map<()=>void,boolean>();
 get activeVoices(){return this.voices.size;}
 constructor(private engine:VerdantEngine){}
 async start(){if(!this.ctx){this.ctx=new AudioContext();this.master=audioBus(this.ctx,this.volume);this.noise=noiseBuffer(this.ctx);}await this.ctx.resume();}
 setVolume(v:number){this.volume=Number.isFinite(v)?Math.max(0,Math.min(1,v)):.45;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.02);}
 event(e:AudioEvent,listener:{x:number;y:number;z:number;yaw:number},self:string){
  if(['kill','interaction-complete'].includes(e.type))return;
  if(!this.ctx||!this.master||!this.noise||this.ctx.state!=='running'||this.volume===0)return;
  if(!admitVoice(this.voices.size)){
   if(e.type==='step')return;
   // Prefer retiring an old footstep; preserve space for objectives and gunfire.
   const old=[...this.voices].find(([,step])=>step)?.[0]??this.voices.keys().next().value;old?.();
  }
  const spatial=e.x!==undefined&&e.actor!==self;
  const cue=spatial?this.engine.audio(e.x!,e.y??0,e.z!,listener.x,listener.y+1.6,listener.z,listener.yaw):{pan:0,gain:1,occluded:false};
  const stop=playCue(this.ctx,this.master,this.noise,e,{...cue,gain:spatial?Math.min(1,cue.gain*6):1},()=>this.voices.delete(stop));this.voices.set(stop,e.type==='step');
 }
 stop(){for(const stop of [...this.voices.keys()])stop();this.bombElapsed=0;this.bombRound=-1;}
 update(dt:number,snapshot:Snapshot|null,listener:{x:number;y:number;z:number;yaw:number}){
  const b=snapshot?.bomb;
  if(!snapshot||snapshot.phase!=='live'||!b||b.state!=='planted'||b.terminal){this.bombElapsed=0;this.bombRound=-1;return;}
  if(this.bombRound!==snapshot.round){this.bombElapsed=0;this.bombRound=snapshot.round;}
  const critical=b.remaining<10,interval=critical?.35:1;this.bombElapsed+=Math.min(.25,Math.max(0,dt));
  if(this.bombElapsed+1e-9>=interval){this.bombElapsed=0;this.event({id:0,type:critical?'bomb-critical':'bomb-warning',x:b.x,y:b.y,z:b.z},listener,snapshot.self.id);}
 }
 beep(fast=false){this.event({id:0,type:fast?'bomb-critical':'bomb-warning'},{x:0,y:0,z:0,yaw:0},'');}
}
