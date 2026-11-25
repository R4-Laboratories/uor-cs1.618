import type {VerdantEngine} from '../shared/engine';
import type {GameEvent,Snapshot} from '../shared/protocol';
import {foleyBuffer, isFoley, type ContactSurface, type FoleyKind} from './audio-foley';
import {enclosureAt, footSurface} from './audio-space';
import {RULES} from '../shared/config';
import {audioProfile} from '../shared/experience';
import {admitVoice} from '../shared/generated-experience';
export type AudioEvent=Omit<GameEvent,'type'>&{type:GameEvent['type']|'bomb-warning'|'bomb-critical'|'equip'|'plant-progress'|'defuse-progress'|'dry-trigger'|'hurt';surface?:ContactSurface};
export function noiseBuffer(ctx:BaseAudioContext){
 const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.5),ctx.sampleRate),data=buffer.getChannelData(0);let seed=1618;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
 return buffer;
}
export function audioBus(ctx:BaseAudioContext,volume:number){
 const master=ctx.createGain(),limiter=ctx.createDynamicsCompressor();
 master.gain.value=volume;limiter.threshold.value=-12;limiter.knee.value=6;limiter.ratio.value=16;limiter.attack.value=.002;limiter.release.value=.15;master.connect(limiter);limiter.connect(ctx.destination);return master;
}
interface Mix {pan:number;gain:number;occluded:boolean;distance?:number;enclosure?:number;remote?:boolean}
interface Listener {x:number;y:number;z:number;yaw:number;crouch?:boolean}

function playFoley(ctx:BaseAudioContext, master:GainNode, noise:AudioBuffer, kind:FoleyKind,
                   event:AudioEvent, mix:Mix, ended:()=>void) {
  const sample=foleyBuffer(ctx,noise,kind,event.weapon,event.surface??'asphalt',event.id);
  const panner=ctx.createStereoPanner(), filter=ctx.createBiquadFilter(), level=ctx.createGain();
  const distance=Math.min(1,(mix.distance??0)/42);
  const amount=kind==='shot'?.57:kind==='landing'?.54:kind==='step'?.28:.40;
  const direct=kind==='step'&&!mix.remote?.72:1;
  panner.pan.value=Math.max(-1,Math.min(1,mix.pan));
  filter.type='lowpass';filter.Q.value=.67;
  filter.frequency.value=mix.occluded?480:Math.min(ctx.sampleRate*.46,11000/(1+distance*3));
  level.gain.value=amount*direct*Math.max(0,Math.min(1,mix.gain))*(mix.occluded?.62:1);
  filter.connect(level);level.connect(panner);panner.connect(master);
  const sources:AudioBufferSourceNode[]=[],nodes:AudioNode[]=[filter,level,panner];
  const t=ctx.currentTime;
  function voice(output:AudioNode,when:number){
    const source=ctx.createBufferSource();source.buffer=sample;
    source.connect(output);sources.push(source);source.start(when);
  }
  voice(filter,t);
  const enclosure=mix.enclosure??0;
  if(kind==='shot' && enclosure>.15){
    const bounce=ctx.createGain(), wall=ctx.createBiquadFilter();
    bounce.gain.value=.10+enclosure*.23;wall.type='lowpass';wall.frequency.value=1000+enclosure*650;
    bounce.connect(wall);wall.connect(filter);nodes.push(bounce,wall);
    voice(bounce,t+.073-.044*enclosure);
  }
  let count=sources.length,done=false;
  const clean=()=>{if(done)return;done=true;for(const node of [...sources,...nodes])node.disconnect();ended();};
  for(const source of sources)source.onended=()=>{if(--count===0)clean();};
  return ()=>{for(const source of sources){source.onended=null;source.stop();}clean();};
}

// Each logical voice owns and retires its scheduled sources, including its first reflection.
export function playCue(ctx:BaseAudioContext,master:GainNode,noise:AudioBuffer,event:AudioEvent,cue:Mix,ended:()=>void){
 if(isFoley(event.type))return playFoley(ctx,master,noise,event.type,event,cue,ended);
 let sound:string=event.type;
 if(event.type==='round'&&event.team)sound='round-result';
 if((event.armorDamage??0)>0 && (event.type==='hit'||event.type==='hurt'))sound='armor-'+event.type;
 const t=ctx.currentTime,p=audioProfile(sound,event.weapon,cue.occluded),pan=ctx.createStereoPanner(),envelope=ctx.createGain();
 pan.pan.value=Math.max(-1,Math.min(1,cue.pan));pan.connect(master);envelope.connect(pan);
 const gain=Math.max(0,Math.min(1,cue.gain));envelope.gain.setValueAtTime(Math.max(.00001,p.level*gain),t);envelope.gain.exponentialRampToValueAtTime(.00001,t+p.duration);
 const sources:AudioScheduledSourceNode[]=[],nodes:AudioNode[]=[envelope,pan];
 if(event.type==='explode'||event.type==='hurt'){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=noise;filter.type='lowpass';filter.frequency.value=p.cutoff;source.connect(filter);filter.connect(envelope);sources.push(source);nodes.push(filter);
 }
 for(let i=0;i<p.pulses;i++){
  const onset=t+i*p.duration/p.pulses,span=p.duration/p.pulses;
  const tone=ctx.createOscillator(),body=ctx.createGain();tone.type='sine';
  const frequency=p.tone*Math.pow(p.ratio,i);tone.frequency.setValueAtTime(frequency,onset);tone.frequency.exponentialRampToValueAtTime(Math.max(35,frequency*(p.pulses>1?.93:p.ratio)),onset+span);
  body.gain.setValueAtTime(.00001,t);body.gain.setValueAtTime(.00001,onset);body.gain.linearRampToValueAtTime(.4,onset+.003);body.gain.exponentialRampToValueAtTime(.00001,onset+span*.88);tone.connect(body);body.connect(envelope);sources.push(tone);nodes.push(body);
 }
 let remaining=sources.length,cleaned=false;
 const clean=()=>{if(cleaned)return;cleaned=true;for(const node of [...sources,...nodes])node.disconnect();ended();};
 for(const source of sources){source.onended=()=>{if(--remaining===0)clean();};source.start(t);source.stop(t+p.duration);}
 return ()=>{for(const source of sources){source.onended=null;try{source.stop();}catch{}}clean();};
}
export class GameAudio{
 ctx:AudioContext|null=null;master:GainNode|null=null;volume=.45;noise:AudioBuffer|null=null;
 private bombElapsed=0;private bombRound=-1;
 private interactionKey='';private interactionElapsed=0;private interactionStop:(()=>void)|undefined;
 private cancelInteraction(){this.interactionStop?.();this.interactionStop=undefined;this.interactionKey='';this.interactionElapsed=0;}
 private voices=new Map<()=>void,number>();
 get activeVoices(){return this.voices.size;}
 constructor(private engine:VerdantEngine){}
 async start(){if(!this.ctx){this.ctx=new AudioContext();this.master=audioBus(this.ctx,this.volume);this.noise=noiseBuffer(this.ctx);}await this.ctx.resume();}
 setVolume(v:number){this.volume=Number.isFinite(v)?Math.max(0,Math.min(1,v)):.45;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.02);}
 event(e:AudioEvent,listener:Listener,self:string){
  if(e.type==='kill'||e.type==='interaction-complete')return;
  if(!this.ctx||!this.master||!this.noise||this.ctx.state!=='running'||this.volume===0)return;
  const priority=e.type==='step'?0:isFoley(e.type)?1:2;
  if(!admitVoice(this.voices.size)){
   if(priority===0)return;
   let victim:(()=>void)|undefined, lowest=Infinity;
   for(const [stop,rank] of this.voices){
    if(rank<lowest && rank<=priority){lowest=rank;victim=stop;if(rank===0)break;}
   }
   if(!victim)return;
   victim();
  }
  const positioned=Number.isFinite(e.x)&&Number.isFinite(e.y)&&Number.isFinite(e.z);
  const remote=positioned && e.actor!==self;
  const sourceY=(e.y??0)+(e.type==='step'||e.type==='landing'?.12:0);
  const eyeY=listener.y+(listener.crouch?RULES.crouchEye:RULES.eyeHeight);
  const spatial=remote?this.engine.audio(e.x!,sourceY,e.z!,listener.x,eyeY,listener.z,listener.yaw):{pan:0,gain:1,occluded:false};
  const mix={...spatial,remote,gain:remote?Math.min(1,spatial.gain*6):1,
   distance:remote?Math.hypot(e.x!-listener.x,sourceY-eyeY,e.z!-listener.z):0,
   enclosure:positioned && e.type==='shot'?enclosureAt(e.x!,sourceY,e.z!):0};
  const material=positioned && (e.type==='step'||e.type==='landing')?{...e,surface:footSurface(e.x!,e.y!,e.z!)}:e;
  const stop=playCue(this.ctx,this.master,this.noise,material,mix,()=>this.voices.delete(stop));this.voices.set(stop,priority);return stop;
 }
 stop(){this.cancelInteraction();for(const stop of [...this.voices.keys()])stop();this.bombElapsed=0;this.bombRound=-1;}
 update(dt:number,snapshot:Snapshot|null,listener:Listener){
  const b=snapshot?.bomb,p=snapshot?.self;
  const live=snapshot?.phase==='live'&&p?.alive&&p.progress>0&&p.progress<1&&!b?.terminal;
  const type=live&&p.action==='PLANTING'&&b?.state==='carried'&&b.carrier===p.id?'plant-progress':live&&p.action==='DEFUSING'&&b?.state==='planted'&&b.remaining>0&&b.defuser===p.id?'defuse-progress':null;
  const key=type?`${snapshot!.round}:${type}`:'';
  if(key!==this.interactionKey){this.cancelInteraction();this.interactionKey=key;this.interactionElapsed=type?(type==='plant-progress'?.48:.32):0;}
  if(type){
   const interval=type==='plant-progress'?.48:.32;
   this.interactionElapsed+=Number.isFinite(dt)?Math.min(.25,Math.max(0,dt)):0;
   if(this.interactionElapsed+1e-9>=interval){this.interactionElapsed=0;this.interactionStop?.();this.interactionStop=this.event({id:0,type,actor:p!.id},listener,p!.id);}
  }
  if(!snapshot||snapshot.phase!=='live'||!b||b.state!=='planted'||b.terminal){this.bombElapsed=0;this.bombRound=-1;return;}
  if(this.bombRound!==snapshot.round){this.bombElapsed=0;this.bombRound=snapshot.round;}
  const critical=b.remaining<10,interval=critical?.35:1;this.bombElapsed+=Math.min(.25,Math.max(0,dt));
  if(this.bombElapsed+1e-9>=interval){this.bombElapsed=0;this.event({id:0,type:critical?'bomb-critical':'bomb-warning',x:b.x,y:b.y,z:b.z},listener,snapshot.self.id);}
 }
 beep(fast=false){this.event({id:0,type:fast?'bomb-critical':'bomb-warning'},{x:0,y:0,z:0,yaw:0},'');}
}
