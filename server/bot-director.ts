import {MAP, MAP_DEFEND_HOLDS, MAP_LANES} from '../shared/map';
import type {Bomb, Input} from '../shared/protocol';
import type {TacticAction} from '../shared/creative-program';
import type {Player} from './match';
import type {BotNavigator} from './navigation';

type Point = {x:number; z:number};
const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.z-b.z);

/** Each slot has a distinct destination. Only same-team positions and public
 * objective information enter this planner. Sight and reactions stay local. */
export class BotDirector {
 private ringKey='';
 private ring = new Map<string,Point>();
 constructor(private nav:BotNavigator){}

 private perimeter(b:Bomb,slot:number,team:Player['team']){
  const key=b.x+','+b.z;
  if(this.ringKey!==key){this.ringKey=key;this.ring.clear();}
  const role=team+slot;
  let point=this.ring.get(role);
  if(!point){
   const angle=slot*Math.PI*2/5+(team==='attack'?.65:0);
   const target={x:b.x+6*Math.sin(angle),z:b.z+6*Math.cos(angle)};
   let best=Infinity;
   for(const node of this.nav.nodes){
    const radius=distance(node,b);
    if(radius<4||radius>9||!node.links.length)continue;
    const error=distance(node,target);
    if(error<best){best=error;point=node;}
   }
   point??=b;
   this.ring.set(role,point);
  }
  return point;
 }

 goal(p:Player,team:Player[],b:Bomb|null,round:number,assignedDefuser:string|null,tactic:TacticAction|null):Point {
  const slot=p.botSlot;
  if(b?.state==='planted'){
   if(assignedDefuser===p.id)return b;
   return this.perimeter(b,slot,p.team);
  }
  if(b?.state==='dropped'&&p.team==='attack'){
   // Keep the rest of the team out of the pickup radius.
   let runner:Player|undefined;
   for(const member of team){
    if(!member.alive||!member.bot)continue;
    if(!runner||distance(member,b)<distance(runner,b))runner=member;
   }
   return runner===p?b:this.perimeter(b,slot,p.team);
  }
  if(p.team==='defend'){
   const station=(slot+round-1)%5;
   if(station===4)return MAP_LANES.find(l=>l.site==='mid')!.contact;
   const site=station%2?'B':'A';
   const outside=1+(Math.floor((round-1)/2)+station%2)%2;
   return MAP_DEFEND_HOLDS[site][station<2?0:outside];
  }

  const carrier=team.find(member=>member.id===b?.carrier);
  const carrierIndex=carrier?team.indexOf(carrier):0;
  const rank=(team.indexOf(p)-carrierIndex+team.length)%team.length;
  const site=MAP.sites[round%2];
  const other=MAP.sites[(round+1)%2];
  const mainLanes=MAP_LANES.filter(l=>l.site===site.id);
  const otherLanes=MAP_LANES.filter(l=>l.site===other.id);
  const primary=Math.floor((round-1)/2)%mainLanes.length;
  // One companion follows a human or bot carrier, with lateral clearance.
  if(rank===1&&carrier&&(tactic==='escort'||tactic==='engage'||tactic==='reload')){
   const side=(slot%2?1:-1)*3;
   const goal={x:carrier.x+side,z:carrier.z+1.8};
   const station=this.nav.point(this.nav.nearest(goal.x,goal.z));
   return station??goal;
  }
  const lane=rank===3?MAP_LANES.find(l=>l.site==='mid')!
   :rank===4?otherLanes[primary%otherLanes.length]
   :mainLanes[(primary+(rank===2?1:0))%mainLanes.length];
  if(p.botLane!==lane.id){p.botLane=lane.id;p.botLeg=0;}
  const legs=[lane.entry,lane.contact];
  while(p.botLeg<legs.length&&distance(p,legs[p.botLeg])<2.5)p.botLeg++;
  if(p.botLeg<legs.length)return legs[p.botLeg];
  if(p.id===carrier?.id){
   return this.nav.point(this.nav.nearest(site.x,site.z))??site;
  }
  // Separated runners join the active objective after showing their alternate
  // route. A human carrier choosing the other site takes precedence.
  let active=site;
  if(carrier&&distance(carrier,other)<other.radius*2.4)active=other;
  const holds=MAP_DEFEND_HOLDS[active.id];
  return holds[rank===2?0:rank===3?1:2];
 }
}

/** Project a world-space walk direction into the same input axes as a human.
 * This lets a bot keep navigating while looking at its visible opponent. */
export function steerBot(p:Player,next:Point|undefined,team:Player[],input:Input,looking:boolean){
 let dx=next?next.x-p.x:0,dz=next?next.z-p.z:0;
 const length=Math.hypot(dx,dz);
 if(length){dx/=length;dz/=length;}
 for(const mate of team){
  if(mate===p||!mate.alive)continue;
  let ax=p.x-mate.x,az=p.z-mate.z;
  const d=Math.hypot(ax,az);
  if(d>=1.8)continue;
  if(d<.001){ax=p.botSlot>mate.botSlot?1:-1;az=0;}
  else{ax/=d;az/=d;}
  const strength=(1-d/1.8)*1.35;
  dx+=ax*strength;dz+=az*strength;
 }
 const speed=Math.hypot(dx,dz);
 if(speed<.04)return;
 if(!looking)input.yaw=Math.atan2(-dx,-dz);
 dx/=Math.max(1,speed);dz/=Math.max(1,speed);
 input.forward=Math.max(-1,Math.min(1,-dx*Math.sin(input.yaw)-dz*Math.cos(input.yaw)));
 input.strafe=Math.max(-1,Math.min(1,dx*Math.cos(input.yaw)-dz*Math.sin(input.yaw)));
}
