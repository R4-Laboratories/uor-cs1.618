import {audioProfile} from '../shared/experience';

export type ContactSurface = 'asphalt'|'stone'|'metal'|'wood';
export type FoleyKind = 'shot'|'step'|'landing'|'dry-trigger'|'equip'|'reload-start'|'reload-complete'|'reload-cancel';
type Handling = Exclude<FoleyKind,'shot'|'step'|'landing'>;
const caches = new WeakMap<BaseAudioContext,Map<string,AudioBuffer>>();
const tau = 2*Math.PI;

// These are original percussion voices. One rendered sample is reused across actors.
const foot = {
  asphalt: {pitch:83, grain:.37, ring:134, resonance:.030, length:.135},
  stone:   {pitch:111,grain:.27, ring:275, resonance:.052, length:.115},
  metal:   {pitch:97, grain:.16, ring:473, resonance:.18,  length:.205},
  wood:    {pitch:126,grain:.19, ring:186, resonance:.12,  length:.165},
};
const handling:Record<Handling,[number,number,number]> = {
  'dry-trigger':[.065,.012,.65], equip:[.18,.036,.6], 'reload-start':[.24,.093,.85],
  'reload-complete':[.145,.043,1], 'reload-cancel':[.10,.026,.4],
};
const mechanical:Record<string,number> = {
  sidearm:1350, kestrel:880, m4:1100, smg:1580, scout:690,
  rivet:760, breaker:530, tern:1210,
};

function transient(time:number,attack:number,decay:number) {
  return time<=0 ? 0 : (1-Math.exp(-time/attack))*Math.exp(-time/decay);
}

export function isFoley(kind:string):kind is FoleyKind {
  return kind==='shot'||kind==='step'||kind==='landing'||Object.hasOwn(handling,kind);
}

/** Short deterministic mono samples. The finite keys cap per-context storage,
 * even if a peer sends an unknown equipment name or a match runs for hours. */
export function foleyBuffer(ctx:BaseAudioContext, noise:AudioBuffer, kind:FoleyKind,
                           weapon:string|undefined, surface:ContactSurface, id:number) {
  const gun=weapon && Object.hasOwn(mechanical,weapon)?weapon:'sidearm';
  const contact=kind==='step'||kind==='landing';
  const variation=Math.abs(id%3)|0;
  const key=kind+'/'+(contact?surface:gun)+'/'+variation;
  let cache=caches.get(ctx);
  if(!cache){cache=new Map();caches.set(ctx,cache);}
  let buffer=cache.get(key);
  if(buffer)return buffer;
  const rate=Math.min(24000,ctx.sampleRate);
  const shot=audioProfile('shot',gun,false), sole=foot[surface];
  const duration=kind==='shot'?shot.duration:contact?sole.length+(kind==='landing'?.075:0):handling[kind as Handling][0];
  buffer=ctx.createBuffer(1,Math.ceil(duration*rate),rate);
  const samples=buffer.getChannelData(0), grains=noise.getChannelData(0);
  const tune=[.97,1.018,1.045][variation], offset=variation*3041+gun.length*137;
  const roughness=kind==='shot'?shot.cutoff:contact?3100:mechanical[gun]*1.9;
  const smoothing=1-Math.exp(-tau*roughness/rate);
  const click=mechanical[gun]*tune;
  let filtered=0, bass=0, phase=0;
  for(let i=0;i<samples.length;i++){
    const t=i/rate;
    const grit=grains[(offset+i)%grains.length];
    filtered+=(grit-filtered)*smoothing;
    bass+=(filtered-bass)*.045;
    let value:number;
    if(kind==='shot'){
      const thump=transient(t,.0014,shot.duration*.16);
      const decay=transient(t,.0005,shot.duration*.13);
      phase+=tau*shot.tone*tune*(.56+1.9*Math.exp(-t/.013))/rate;
      const snap=transient(t-.013,.0007,.009);
      value=1.25*decay*filtered+.64*thump*Math.sin(phase)
        +.38*transient(t-.012,.008,shot.duration*.22)*bass
        +snap*(.24*grit+.13*Math.sin(tau*click*t));
    }else if(contact){
      const landing=kind==='landing', toe=landing?.047:.026;
      const heel=transient(t,.002,landing?.041:.026), scuff=transient(t-toe,.006,sole.length*.17);
      phase+=tau*sole.pitch*tune*(.68+1.2*Math.exp(-t/.013))/rate;
      const resonant=transient(t-.002,.0018,sole.length*.2)*Math.sin(tau*sole.ring*tune*t);
      value=heel*(.46*Math.sin(phase)+.36*bass)+sole.grain*(heel*.45+scuff)*filtered
        +sole.resonance*resonant;
    }else{
      const [,second,weight]=handling[kind as Handling];
      const cloth=transient(t,.010,.035), tap=transient(t-.008,.0006,.012);
      const latch=transient(t-second*tune,.0008,.016);
      value=.33*cloth*bass+.31*tap*(filtered+.40*Math.sin(tau*click*.4*t))
        +weight*latch*(.53*grit+.24*Math.sin(tau*click*t));
    }
    samples[i]=value*Math.min(1,(samples.length-i-1)/(.008*rate));
  }
  cache.set(key,buffer);
  return buffer;
}
