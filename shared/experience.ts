import type {Weapon} from './config';
export interface Experience {recoveryMs:number;voices:number;downMs:number;upMs:number;}
export const DEFAULT_EXPERIENCE:Experience={recoveryMs:420,voices:32,downMs:2400,upMs:10000};
export function validateExperience(value:Experience){
 if(!value||Object.keys(value).sort().join(',')!=='downMs,recoveryMs,upMs,voices')throw Error('Invalid experience program');
 const domains={recoveryMs:[280,320,420],voices:[16,24,32],downMs:[1200,1800,2400],upMs:[8000,10000]};
 for(const key of Object.keys(domains) as (keyof Experience)[])if(!domains[key].includes(value[key]))throw Error('Unmodeled experience parameter: '+key);
}
// Original learnable spray patterns. The host alone applies spread and damage.
const LATERAL=[0,0,.05,.12,.2,.35,.65,.9,.7,.35,0,-.35,-.7,-1,-.8,-.4,.1,.5,.9,.6] as const;
export function sprayOffset(weapon:Weapon,shot:number){
 const i=Math.max(0,Math.min(29,Math.floor(Number.isFinite(shot)?shot:0)));
 if(i===0)return {yaw:0,pitch:0};
 const side=LATERAL[Math.min(i,LATERAL.length-1)]*(weapon.id==='m4'?-.7:weapon.id==='smg'?.6:1);
 return {yaw:side*weapon.recoil*2,pitch:Math.min(.18,weapon.recoil*Math.min(i,8)*.75)};
}
export function shotSpread(weapon:Weapon,speed:number,grounded:boolean,crouch:boolean,scope:boolean){
 return weapon.spread*(scope&&weapon.id==='scout'?.1:1)*(crouch?.7:1)+(grounded?0:.05)+Math.max(0,speed-.6)*.005;
}
export interface QualityState {scale:number;slow:number;fast:number;}
export function qualityStep(state:QualityState,dt:number,policy:Experience):QualityState{
 if(!Number.isFinite(dt)||dt<=0||dt>.12)return {...state,slow:0,fast:0};
 let {scale,slow,fast}=state;
 slow=dt>1/45?slow+dt:Math.max(0,slow-dt*2);fast=dt<1/55?fast+dt:0;
 if(slow*1000>=policy.downMs){scale=Math.max(.7,Math.round((scale-.1)*10)/10);slow=fast=0;}
 if(fast*1000>=policy.upMs){scale=Math.min(1,Math.round((scale+.1)*10)/10);slow=fast=0;}
 return {scale,slow,fast};
}
export function audioProfile(type:string,weapon:string|undefined,occluded:boolean){
 const signatures:Record<string,[number,number,number]>={sidearm:[1900,170,.12],kestrel:[2800,90,.19],m4:[3400,125,.16],smg:[4200,200,.1],scout:[1500,65,.35]};
 // [tone, duration, level, second note / first note, pulse count]. Original cues.
 const cues:Record<string,[number,number,number,number,number]>={
  'reload-start':[230,.23,.13,.55,2],'reload-complete':[410,.14,.16,1.4,2],'reload-cancel':[160,.09,.09,.7,1],
  'plant-progress':[270,.13,.075,1.45,2],'defuse-progress':[960,.09,.065,.72,2],
  'interaction-start':[520,.28,.12,1.25,2],'interaction-cancel':[340,.18,.10,.6,2],
  'bomb-pickup':[620,.22,.12,1.5,2],'bomb-drop':[145,.17,.16,.6,1],
  plant:[740,.46,.14,1.25,3],defuse:[880,.65,.16,.75,3],round:[330,.25,.12,1.25,2],'round-result':[392,.8,.18,1.5,3],
  'bomb-warning':[1250,.095,.16,1,1],'bomb-critical':[1800,.11,.20,1.2,2],
  equip:[290,.12,.11,1.7,2],hit:[800,.12,.10,.75,1],
 };
 const special=cues[type];
 const [cutoff,tone,duration]=type==='shot'?signatures[weapon??'sidearm']??signatures.sidearm:type==='step'?[330,70,.065]:type==='explode'?[900,40,.48]:[1800,special?.[0]??660,special?.[1]??.2];
 return {cutoff:occluded?Math.min(450,cutoff):cutoff,tone,duration,level:type==='step'?.12:type==='explode'?.5:type==='shot'?.28:special?.[2]??.1,ratio:special?.[3]??.45,pulses:special?.[4]??1};
}
export function compileExperience(config:Experience){
 validateExperience(config);
 return '// Generated from model/evolution/state.json. Do not edit.\n'+
  "import {qualityStep,type QualityState} from './experience';\n"+
  `export const experiencePolicy=${JSON.stringify(config)} as const;\n`+
  'export const recoveredBurst=(idleSeconds:number)=>idleSeconds*1000>=experiencePolicy.recoveryMs;\n'+
  'export const adaptQuality=(state:QualityState,dt:number)=>qualityStep(state,dt,experiencePolicy);\n'+
  'export const admitVoice=(active:number)=>Number.isInteger(active)&&active>=0&&active<experiencePolicy.voices;\n';
}
