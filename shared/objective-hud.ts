import {MAP} from './map';
import {RULES as R} from './config';
import type {Snapshot,Motion} from './protocol';
/** Presentation only: direction and straight-line distance never decide interactions. */
export function objectiveHint(s:Snapshot,pos:Motion):string{
 const p=s.self,b=s.bomb;
 const bearing=(x:number,z:number)=>{const dx=x-pos.x,dz=z-pos.z;const compass=['N','NE','E','SE','S','SW','W','NW'];const angle=Math.atan2(dx,-dz);return `${compass[(Math.round(angle/(Math.PI/4))+8)%8]} · ${Math.round(Math.hypot(dx,dz))}m`;};
 const sites=MAP.sites.map(site=>`${site.id} ${bearing(site.x,site.z)}`).join(' / ');
 if(s.phase==='waiting')return 'Waiting for the opposing team to join this room.';
 if(s.phase==='ended'||s.phase==='matchEnd')return s.reason;
 if(s.phase==='freeze')return `${p.team==='attack'?'PLANT':'DEFEND'} · ${sites} · Press B to buy`;
 if(b?.terminal)return s.reason;
 if(p.action&&p.alive&&(p.action!=='DEFUSING'||b?.defuser===p.id))return `${p.action} · HOLD E · stand still`;
 if(b?.state==='planted'){
  if(p.team==='attack')return `PROTECT BOMB ${b.site} · ${bearing(b.x,b.z)} · ${Math.ceil(b.remaining)}s`;
  const near=Math.hypot(pos.x-b.x,pos.z-b.z,pos.y-b.y)<2.3;
  const teammate=b.defuser&&b.defuser!==p.id?' · TEAMMATE DEFUSING — COVER THEM':'';
  return `${near&&!teammate?'HOLD E TO DEFUSE':'DEFUSE'} ${b.site} · ${bearing(b.x,b.z)} · ${p.kit?R.kitDefuseSeconds:R.defuseSeconds}s${teammate}`;
 }
 if(p.team==='defend')return `DEFEND · ${sites} · Stop the plant`;
 if(b?.state==='dropped')return `RECOVER BOMB · ${bearing(b.x,b.z)} · Walk over to pick up`;
 if(b?.carrier===p.id){
  if(MAP.sites.some(site=>Math.hypot(pos.x-site.x,pos.z-site.z)<site.radius))return 'HOLD E TO PLANT · stand still';
  return `PLANT BOMB · ${sites}`;
 }
 const carrier=s.players.find(player=>player.id===b?.carrier);
 return `ESCORT CARRIER${carrier?` · ${bearing(carrier.x,carrier.z)}`:''} · ${sites}`;
}

export interface PlantedObjective {
 site:string;remaining:number;fuseFraction:number;
 mode:'protect'|'defend'|'defusing'|'cover'|'spectating';
 requiredSeconds:number|null;defuseLeft:number|null;margin:number|null;
}
/** Local timing estimate only; travel, cover and interaction eligibility are deliberately excluded. */
export function plantedObjective(s:Snapshot):PlantedObjective|null{
 const b=s.bomb,p=s.self;
 if(s.phase!=='live'||!b||b.state!=='planted'||b.terminal||!Number.isFinite(b.remaining)||b.remaining<=0)return null;
 const mode:PlantedObjective['mode']=!p.alive?'spectating':p.team==='attack'?'protect':b.defuser&&b.defuser!==p.id?'cover':b.defuser===p.id&&p.action==='DEFUSING'?'defusing':'defend';
 const local=mode==='defend'||mode==='defusing',requiredSeconds=local?(p.kit?R.kitDefuseSeconds:R.defuseSeconds):null;
 const progress=mode==='defusing'&&Number.isFinite(p.progress)?Math.max(0,Math.min(1,p.progress)):0;
 const defuseLeft=requiredSeconds===null?null:requiredSeconds*(1-progress);
 return {site:b.site??'?',remaining:b.remaining,fuseFraction:Math.min(1,b.remaining/R.bombSeconds),mode,requiredSeconds,defuseLeft,margin:defuseLeft===null?null:b.remaining-defuseLeft};
}
