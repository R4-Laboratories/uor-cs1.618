import {sprayOffset,shotSpread} from '../shared/experience';
import {recoveredBurst} from '../shared/generated-experience';
import {decideTactic} from '../shared/generated-tactics';
import type {TacticDecider,BotFacts} from '../shared/creative-program';
import {RULES as R,WEAPONS,type Team,type Phase} from '../shared/config';
import {MAP} from '../shared/map';
import {neutralInput,type Input,type Motion,type Gun,type Bomb,type GameEvent,type Snapshot,type PublicPlayer,type SelfState} from '../shared/protocol';
import {movePlayer} from '../shared/movement';
import type {VerdantEngine} from '../shared/engine';
import type {RoundKernel} from '../shared/round-kernel';
import {BotNavigator} from './navigation';
export interface Player extends Motion {
 id:string;name:string;team:Team;bot:boolean;alive:boolean;health:number;armor:number;money:number;kit:boolean;kills:number;deaths:number;
 inventory:Gun[];slot:0|1;yaw:number;pitch:number;input:Input;queue:Input[];acceptedSeq:number;processedSeq:number;inputAge:number;
 cooldown:number;reloadLeft:number;recoil:number;burst:number;shotIdle:number;previousFire:boolean;previousJump:boolean;progress:number;action:string;stepTimer:number;
 botPath:number[];botPlan:number;botGoal:number;botShoot:number;botTarget:string|null;botReaction:number;botBurst:number;
}
export type BuyError='unknown'|'dead'|'phase'|'zone'|'team'|'funds'|'owned'|null;
const gun=(id:string):Gun=>({id,ammo:WEAPONS[id].mag,reserve:WEAPONS[id].reserve});
export class Match {
 players=new Map<string,Player>();phase:Phase='waiting';phaseLeft:number=R.freezeSeconds;time=0;tick=0;round=0;
 score={attack:0,defend:0};bomb:Bomb|null=null;winner:Team|null=null;reason='Waiting for both teams';events:GameEvent[]=[];
 private eventId=0;private randomState=1618;nav:BotNavigator;botsEnabled=false;
 constructor(public room:string,public engine:VerdantEngine,private roundKernel:RoundKernel,private tacticDecider:TacticDecider=decideTactic){this.nav=new BotNavigator(engine);}
 random(){let x=this.randomState;x^=x<<13;x^=x>>>17;x^=x<<5;this.randomState=x;return (x>>>0)/4294967296;}
 emit(e:Omit<GameEvent,'id'>){this.events.push({id:++this.eventId,at:this.time,...e});if(this.events.length>80)this.events.shift();}
 join(id:string,name:string,wanted:Team|'auto',bot=false){
  if(this.players.size>=R.maxPlayers)return null;
  const counts={attack:0,defend:0};for(const p of this.players.values())counts[p.team]++;
  let team:Team=wanted==='auto'?(counts.attack<=counts.defend?'attack':'defend'):wanted;
  if(counts[team]>=5)team=team==='attack'?'defend':'attack';
  const p:Player={id,name:name.replace(/[\x00-\x1f<>]/g,'').trim().slice(0,18)||'Operator',team,bot,alive:false,health:100,armor:0,money:R.startMoney,kit:false,kills:0,deaths:0,inventory:[gun('sidearm'),gun('sidearm')],slot:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,grounded:true,crouch:false,yaw:0,pitch:0,input:neutralInput(),queue:[],acceptedSeq:0,processedSeq:0,inputAge:0,cooldown:0,reloadLeft:0,recoil:0,burst:0,shotIdle:10,previousFire:false,previousJump:false,progress:0,action:'',stepTimer:0,botPath:[],botPlan:0,botGoal:-1,botShoot:0,botTarget:null,botReaction:0,botBurst:0};
  this.players.set(id,p);
  if(this.phase==='waiting'||this.phase==='freeze')this.spawn(p,counts[team]);
  if(this.phase==='waiting'&&this.hasBothTeams())this.beginRound();
  return p;
 }
 enableBots(){this.botsEnabled=true;this.fillBots();}
 fillBots(){
  for(const team of ['attack','defend'] as Team[])while([...this.players.values()].filter(p=>p.team===team).length<5){
   const id=`bot-${team}-${Math.floor(this.random()*1e8)}`;const names=team==='attack'?['ASH','FLINT','ROOK','CINDER','FOX']:['REEF','DELTA','SLATE','ECHO','WAVE'];
   const used=[...this.players.values()].filter(p=>p.team===team).length;this.join(id,names[used%5],team,true);
  }
 }
 evictBot(team:Team|'auto'){const p=[...this.players.values()].find(p=>p.bot&&(team==='auto'||p.team===team))??[...this.players.values()].find(p=>p.bot);if(p)this.leave(p.id);}
 hasBothTeams(){return [...this.players.values()].some(p=>p.team==='attack')&&[...this.players.values()].some(p=>p.team==='defend');}
 leave(id:string){const p=this.players.get(id);if(!p)return;this.cancelInteraction(p);this.dropBomb(p);this.players.delete(id);if(!this.hasBothTeams()){this.phase='waiting';this.reason='Waiting for both teams';this.bomb=null;}}
 spawn(p:Player,index:number){
  const pos=MAP.spawns[p.team][index%5];p.x=pos[0];p.y=0;p.z=pos[1];p.vx=p.vy=p.vz=0;p.grounded=true;p.crouch=false;
  if(!p.alive){p.inventory=[gun('sidearm'),gun('sidearm')];p.armor=0;p.kit=false;}
  for(const g of p.inventory){g.ammo=WEAPONS[g.id].mag;}
  p.alive=true;p.health=100;p.yaw=p.team==='attack'?0:Math.PI;p.pitch=0;p.input={...neutralInput(),yaw:p.yaw,seq:p.acceptedSeq};p.queue=[];p.processedSeq=p.acceptedSeq;p.inputAge=0;p.slot=p.inventory[0].id==='sidearm'?1:0;p.input.slot=p.slot;p.cooldown=p.reloadLeft=p.progress=p.recoil=0;p.burst=0;p.shotIdle=10;p.action='';p.previousFire=false;p.previousJump=false;p.botPath=[];p.botPlan=0;p.botTarget=null;p.botReaction=0;p.botBurst=0;p.botShoot=0;
 }
 beginRound(){
  this.round++;this.phase='freeze';this.phaseLeft=R.freezeSeconds;this.winner=null;this.reason='Buy equipment. Prepare to deploy.';
  const counts={attack:0,defend:0};for(const p of this.players.values())this.spawn(p,counts[p.team]++);
  const attackers=[...this.players.values()].filter(p=>p.team==='attack');const carrier=attackers.find(p=>!p.bot)??attackers[(this.round-1)%attackers.length];
  this.bomb=carrier?{state:'carried',carrier:carrier.id,x:carrier.x,y:0,z:carrier.z,site:null,remaining:R.bombSeconds}:null;
  for(const p of this.players.values())if(p.bot){if(p.money>=3100)this.buy(p.id,p.team==='attack'?'kestrel':'m4');else if(p.money>=1500)this.buy(p.id,'smg');if(p.money>=1000)this.buy(p.id,'armor');if(p.team==='defend'&&p.money>=400)this.buy(p.id,'kit');}
  this.emit({type:'round',text:`Round ${this.round} · buy phase`});
 }
 input(id:string,value:unknown):boolean {
  const p=this.players.get(id);if(!p||typeof value!=='object'||value===null)return false;
  const i=value as Input;
  if(!Number.isSafeInteger(i.seq)||i.seq<=p.acceptedSeq||i.seq>p.acceptedSeq+10000)return false;
  if(![i.forward,i.strafe,i.yaw,i.pitch].every(Number.isFinite)||Math.abs(i.forward)>1||Math.abs(i.strafe)>1||Math.abs(i.yaw)>Math.PI*2+0.01||Math.abs(i.pitch)>1.5)return false;
  if(!['jump','crouch','walk','fire','reload','use','scope'].every(k=>typeof i[k as keyof Input]==='boolean')||(i.slot!==0&&i.slot!==1))return false;
  p.acceptedSeq=i.seq;p.queue.push({...i});if(p.queue.length>12)p.queue.shift();p.inputAge=0;return true;
 }
 buy(id:string,item:string):BuyError {
  const p=this.players.get(id);if(!p||!p.alive)return 'dead';
  if(this.phase!=='freeze'&&!(this.phase==='live'&&R.roundSeconds-this.phaseLeft<R.buySeconds))return 'phase';
  if(p.z*(p.team==='attack'?1:-1)<18)return 'zone';
  const w=WEAPONS[item];const price=w?.price??({armor:1000,kit:400,ammo:100} as Record<string,number>)[item];
  if(price===undefined||item==='sidearm')return 'unknown';
  if((w?.team&&w.team!==p.team)||(item==='kit'&&p.team!=='defend'))return 'team';
  if((item==='kit'&&p.kit)||(item==='armor'&&p.armor===100)||(w&&p.inventory[0].id===item))return 'owned';
  if(p.money<price)return 'funds';
  p.money-=price;
  if(w){p.inventory[0]=gun(item);p.slot=0;p.input.slot=0;p.reloadLeft=0;p.burst=0;p.shotIdle=10;p.recoil=0;}
  else if(item==='armor')p.armor=100;else if(item==='kit')p.kit=true;else for(const g of p.inventory)g.reserve=WEAPONS[g.id].reserve;
  return null;
 }
 step(dt:number){
  // Callers advance only one fixed server tick. Network packets never supply dt.
  this.tick++;this.time+=dt;
  if(this.phase==='waiting')return;
  this.phaseLeft-=dt;
  if(this.phase==='freeze'&&this.phaseLeft<=0){this.phase='live';this.phaseLeft=R.roundSeconds;this.reason='Ember: plant the device. Tidal: defend the relay.';this.emit({type:'round',text:'Round live'});}
  if((this.phase==='ended'||this.phase==='matchEnd')&&this.phaseLeft<=0){
   if(this.phase==='matchEnd'){this.score={attack:0,defend:0};this.round=0;for(const p of this.players.values()){p.money=R.startMoney;p.alive=false;p.kills=p.deaths=0;}}
   if(this.hasBothTeams())this.beginRound();else this.phase='waiting';return;
  }
  if(this.phase==='ended'||this.phase==='matchEnd')return;
  if(this.phase==='live'&&this.phaseLeft<=1e-9&&this.bomb?.state!=='planted'){
   const decision=this.roundKernel.decide({bomb:'absent',attackers:this.aliveCount('attack'),defenders:this.aliveCount('defend'),clock:0});
   if(decision!=='continue'){this.endRound(decision,'Time expired');return;}
  }
  // Expiry wins a fixed-tick tie with completion; resolve it before interactions,
  // independent of player iteration order. A newly planted device gets a full timer.
  if(this.phase==='live'&&this.bomb?.state==='planted'&&!this.bomb.terminal){
   this.bomb.remaining=Math.max(0,this.bomb.remaining-dt);
   if(this.bomb.remaining<=1e-9){this.detonate();return;}
   const defuser=this.players.get(this.bomb.defuser??'');
   if(defuser&&!defuser.alive)this.cancelInteraction(defuser);
  }
  for(const p of this.players.values()){
   if((this.phase as Phase)==='ended'||(this.phase as Phase)==='matchEnd')break;
   if(!p.alive)continue;
   if(p.bot)this.botInput(p,dt);else{p.inputAge+=dt;const next=p.queue.shift();if(next){p.input=next;p.processedSeq=next.seq;}else if(p.inputAge>0.25)p.input={...neutralInput(),seq:p.processedSeq,yaw:p.yaw,pitch:p.pitch,slot:p.slot};}
   const i=p.input;p.yaw=i.yaw;p.pitch=i.pitch;
   const requestedSlot=i.slot===0&&p.inventory[0].id==='sidearm'?1:i.slot;
   if(p.slot!==requestedSlot){this.cancelReload(p);p.slot=requestedSlot;p.burst=0;p.shotIdle=10;p.recoil=0;p.reloadLeft=0;p.cooldown=Math.max(p.cooldown,0.2);}
   p.cooldown=Math.max(0,p.cooldown-dt);p.shotIdle+=dt;if(recoveredBurst(p.shotIdle)){p.burst=0;p.recoil=0;}else p.recoil=Math.max(0,p.recoil-dt*.18);
   if(p.reloadLeft>0){p.reloadLeft=Math.max(0,p.reloadLeft-dt);if(p.reloadLeft===0){const g=p.inventory[p.slot];const amount=Math.min(WEAPONS[g.id].mag-g.ammo,g.reserve);g.ammo+=amount;g.reserve-=amount;this.emit({type:'reload-complete',actor:p.id,weapon:g.id,x:p.x,y:p.y,z:p.z});}}
   const previous={x:p.x,z:p.z};const jump=i.jump&&!p.previousJump;p.previousJump=i.jump;
   movePlayer(p,{...i,jump},dt,this.engine,this.phase==='live');
   if(i.reload&&p.reloadLeft===0){const g=p.inventory[p.slot];if(g.ammo<WEAPONS[g.id].mag&&g.reserve>0){p.reloadLeft=WEAPONS[g.id].reload;this.emit({type:'reload-start',actor:p.id,weapon:g.id,x:p.x,y:p.y,z:p.z});}}
   if(this.phase==='live'){
    p.stepTimer-=dt;if(p.grounded&&!i.walk&&!p.crouch&&Math.hypot(p.x-previous.x,p.z-previous.z)>dt*2&&p.stepTimer<=0){this.emit({type:'step',actor:p.id,x:p.x,y:p.y,z:p.z});p.stepTimer=0.34;}
    const w=WEAPONS[p.inventory[p.slot].id];
    if(i.fire&&(w.automatic||!p.previousFire)&&!i.use)this.fire(p);
    this.objective(p,dt);
   }
   p.previousFire=i.fire;
  }
  if(this.phase==='live'){
   let bombState:'absent'|'planted'|'exploded'='absent';
   if(this.bomb?.state==='planted'&&!this.bomb.terminal)bombState='planted';
   const decision=this.roundKernel.decide({bomb:bombState,attackers:this.aliveCount('attack'),defenders:this.aliveCount('defend'),clock:this.phaseLeft>0?1:0});
   if(decision!=='continue'){
    this.endRound(decision,this.phaseLeft<=0&&bombState==='absent'?'Time expired':'Opposition eliminated');
   }
  }
 }
 aliveCount(team:Team){return [...this.players.values()].filter(p=>p.team===team&&p.alive).length;}
 fire(p:Player){
  const g=p.inventory[p.slot],w=WEAPONS[g.id];if(p.cooldown>0||p.reloadLeft>0||g.ammo<=0)return;
  g.ammo--;p.cooldown=w.interval;
  const spread=shotSpread(w,Math.hypot(p.vx,p.vz),p.grounded,p.crouch,p.input.scope),spray=sprayOffset(w,p.burst);
  const yaw=p.yaw+spray.yaw+(this.random()-.5)*spread*2,pitch=p.pitch+spray.pitch+(this.random()-.5)*spread*2;
  p.burst=Math.min(29,p.burst+1);p.shotIdle=0;
  const dx=-Math.sin(yaw)*Math.cos(pitch),dy=Math.sin(pitch),dz=-Math.cos(yaw)*Math.cos(pitch);
  const eye=p.y+(p.crouch?R.crouchEye:R.eyeHeight);
  let distance=this.engine.ray(p.x,eye,p.z,dx,dy,dz,w.range);let target:Player|undefined;let head=false;
  for(const other of this.players.values()){
   if(!other.alive||other.id===p.id)continue;
   const height=other.crouch?R.crouchHeight:R.standingHeight;
   const d=this.engine.hitbox(p.x,eye,p.z,dx,dy,dz,other.x,other.y,other.z,0.31,height);
   if(d>=0&&d<distance){distance=d;target=other;head=eye+dy*d>other.y+height-0.3;}
  }
  this.emit({type:'shot',actor:p.id,weapon:g.id,x:p.x,y:eye,z:p.z,ex:p.x+dx*distance,ey:eye+dy*distance,ez:p.z+dz*distance});
  p.recoil=Math.min(0.18,p.recoil+w.recoil);
  if(target&&target.team!==p.team){
   let damage=Math.round(w.damage*(head?w.head:1)*(1-Math.min(distance,100)*0.002));
   if(target.armor>0){const absorbed=Math.min(target.armor,Math.ceil(damage*0.4));target.armor-=absorbed;damage-=absorbed;}
   target.health=Math.max(0,target.health-damage);this.emit({type:'hit',actor:p.id,target:target.id,head});
   if(target.health===0){target.alive=false;target.deaths++;this.cancelInteraction(target);this.cancelReload(target);p.kills++;p.money=Math.min(R.maxMoney,p.money+R.killReward);this.dropBomb(target);this.emit({type:'kill',actor:p.id,target:target.id,head,weapon:g.id});}
  }
 }
 cancelReload(p:Player){if(p.reloadLeft>0)this.emit({type:'reload-cancel',actor:p.id,weapon:p.inventory[p.slot].id,x:p.x,y:p.y,z:p.z});p.reloadLeft=0;}
 cancelInteraction(p:Player){
  if(p.action)this.emit({type:'interaction-cancel',actor:p.id,action:p.action==='PLANTING'?'plant':'defuse',x:p.x,y:p.y,z:p.z});
  p.progress=0;p.action='';if(this.bomb?.defuser===p.id)this.bomb.defuser=null;
 }
 dropBomb(p:Player){if(this.bomb?.carrier===p.id){this.cancelInteraction(p);this.bomb={...this.bomb,state:'dropped',carrier:null,x:p.x,y:p.y,z:p.z};this.emit({type:'bomb-drop',actor:p.id,x:p.x,y:p.y,z:p.z});}}
 detonate(){
  const b=this.bomb;if(!b||b.terminal)return;b.terminal='exploded';b.remaining=0;b.defuser=null;
  // Original radial blast: 140 at the device, linear to zero at 16m; no wall
  // attenuation or armor reduction. Maximum ten players, one authoritative pass.
  for(const p of this.players.values())if(p.alive){const damage=Math.max(0,Math.round(140*(1-Math.hypot(p.x-b.x,p.y-b.y,p.z-b.z)/16)));p.health=Math.max(0,p.health-damage);if(p.health===0){p.alive=false;p.deaths++;this.cancelInteraction(p);this.emit({type:'kill',target:p.id,text:'Device blast'});}}
  this.emit({type:'explode',x:b.x,y:b.y,z:b.z});
  const decision=this.roundKernel.decide({bomb:'exploded',attackers:this.aliveCount('attack'),defenders:this.aliveCount('defend'),clock:this.phaseLeft>0?1:0});
  if(decision!=='continue')this.endRound(decision,'Device detonated');
 }
 objective(p:Player,dt:number){
  const b=this.bomb;if(!b||b.terminal||this.phase!=='live'||!p.alive){this.cancelInteraction(p);return;}
  if(b.state==='dropped'&&p.team==='attack'&&Math.hypot(p.x-b.x,p.z-b.z,p.y-b.y)<1.5){b.state='carried';b.carrier=p.id;this.emit({type:'bomb-pickup',actor:p.id,x:p.x,y:p.y,z:p.z});}
  if(b.carrier===p.id){b.x=p.x;b.y=p.y;b.z=p.z;}
  let action='',duration=0,site='';
  if(p.input.use&&p.grounded&&Math.hypot(p.vx,p.vz)<0.25){
   if(b.state==='carried'&&b.carrier===p.id){const s=MAP.sites.find(s=>Math.hypot(p.x-s.x,p.z-s.z)<s.radius);if(s){action='PLANTING';duration=R.plantSeconds;site=s.id;}}
   if(b.state==='planted'&&p.team==='defend'&&(!b.defuser||b.defuser===p.id)&&this.canReachDevice(p,b)){
    action='DEFUSING';duration=p.kit?R.kitDefuseSeconds:R.defuseSeconds;
   }
  }
  if(action!==p.action){this.cancelInteraction(p);p.action=action;if(action)this.emit({type:'interaction-start',actor:p.id,action:action==='PLANTING'?'plant':'defuse',x:p.x,y:p.y,z:p.z});}
  if(!action)return;if(action==='DEFUSING')b.defuser=p.id;
  p.progress+=dt/duration;
  if(p.progress>=1-1e-9){
   this.emit({type:'interaction-complete',actor:p.id,action:action==='PLANTING'?'plant':'defuse',x:p.x,y:p.y,z:p.z});
   p.progress=0;p.action='';
   if(action==='PLANTING'){b.state='planted';b.carrier=null;b.site=site;b.remaining=R.bombSeconds;p.money=Math.min(R.maxMoney,p.money+300);this.emit({type:'plant',actor:p.id,text:`Device planted at ${site}`,x:p.x,y:p.y,z:p.z});}
   else{b.terminal='defused';b.defuser=null;this.emit({type:'defuse',actor:p.id,text:'Device defused',x:b.x,y:b.y,z:b.z});const decision=this.roundKernel.decide({bomb:'defused',attackers:this.aliveCount('attack'),defenders:this.aliveCount('defend'),clock:1});if(decision!=='continue')this.endRound(decision,'Device defused');}
  }
 }
 private canReachDevice(p:{x:number;y:number;z:number},b:Bomb){
  if(Math.hypot(p.x-b.x,p.y-b.y,p.z-b.z)>=2.3)return false;
  const dx=b.x-p.x,dy=b.y+0.2-(p.y+0.5),dz=b.z-p.z,len=Math.hypot(dx,dy,dz);
  return len<0.05||this.engine.ray(p.x,p.y+0.5,p.z,dx/len,dy/len,dz/len,len)>=len-0.05;
 }
 private defusePath(p:Player,b:Bomb){
  const start=this.nav.nearest(p.x,p.z);
  const candidates=this.nav.nodes.map((n,id)=>({n,id})).filter(({n})=>Math.hypot(n.x-b.x,n.z-b.z)<2.3&&this.canReachDevice({x:n.x,y:this.engine.support(n.x,n.z,0,R.radius*.8),z:n.z},b));
  candidates.sort((a,c)=>Math.hypot(a.n.x-p.x,a.n.z-p.z)-Math.hypot(c.n.x-p.x,c.n.z-p.z));
  for(const {n,id} of candidates){
   const path=this.nav.path(p.x,p.z,n.x,n.z);
   // A same-node route still needs its endpoint: snapping does not imply reach.
   if(id===start)return [id];
   if(path.length)return path;
  }
  return [];
 }
 endRound(team:Team,reason:string){
  if(this.phase!=='live')return;
  this.winner=team;this.reason=reason;this.score[team]++;this.phase=this.score[team]>=R.matchWin?'matchEnd':'ended';this.phaseLeft=this.phase==='matchEnd'?14:R.endSeconds;
  for(const p of this.players.values()){this.cancelInteraction(p);this.cancelReload(p);p.money=Math.min(R.maxMoney,p.money+(p.team===team?R.winReward:R.lossReward));}
  this.emit({type:'round',team,text:reason});
 }
 botDefuser(){
  const b=this.bomb;if(!b||b.state!=='planted'||b.terminal)return null;
  const active=this.players.get(b.defuser??'');if(active?.alive)return active.id;
  return [...this.players.values()].filter(p=>p.alive&&p.team==='defend'&&p.bot).sort((a,c)=>{
   const cost=(p:Player)=>Math.hypot(p.x-b.x,p.z-b.z)/R.runSpeed+(p.kit?R.kitDefuseSeconds:R.defuseSeconds);
   return cost(a)-cost(c)||a.id.localeCompare(c.id);
  })[0]?.id??null;
 }
 botInput(p:Player,dt:number){
  p.botPlan-=dt;p.botShoot-=dt;
  const i={...neutralInput(),yaw:p.yaw,slot:p.slot,seq:++p.processedSeq};
  if(this.phase!=='live'){p.input=i;return;}
  const enemies=[...this.players.values()].filter(e=>e.alive&&e.team!==p.team).map(e=>({e,d:Math.hypot(e.x-p.x,e.z-p.z)})).sort((a,b)=>a.d-b.d);
  const enemy=enemies.find(({e,d})=>d<45&&this.engine.ray(p.x,p.y+1.4,p.z,(e.x-p.x)/d,0,(e.z-p.z)/d,d)>=d-0.4)?.e;
  if(p.botTarget!==(enemy?.id??null)){p.botTarget=enemy?.id??null;p.botReaction=.22;p.botBurst=0;}else p.botReaction=Math.max(0,p.botReaction-dt);
  const b=this.bomb,assigned=this.botDefuser(),cover=b?.state==='planted'&&p.team==='defend'&&assigned!==p.id;
  let goal:{x:number;z:number}={x:MAP.sites[(this.round+(p.team==='defend'?1:0))%2].x,z:-11};
  if(b?.state==='planted'){
   goal={x:b.x,z:b.z};
   if(cover||p.team==='attack'){
    const candidates=this.nav.nodes.filter(n=>{const d=Math.hypot(n.x-b.x,n.z-b.z);return d>=4&&d<=8;});
    if(candidates.length)goal=candidates[(Array.from(p.id).reduce((sum,c)=>sum+c.charCodeAt(0),0))%candidates.length];
   }
  }
  else if(b?.state==='dropped'&&p.team==='attack')goal=b;
  else if(p.team==='defend')goal={x:p.id.charCodeAt(p.id.length-1)%2?-17:17,z:-11};
  const facts:BotFacts={enemy:!!enemy,empty:p.inventory[p.slot].ammo===0,lowAmmo:p.inventory[p.slot].ammo<8,
   canPlant:b?.carrier===p.id&&MAP.sites.some(s=>Math.hypot(p.x-s.x,p.z-s.z)<s.radius-0.5),
   canDefuse:b?.state==='planted'&&p.team==='defend'&&assigned===p.id&&this.canReachDevice(p,b),
   urgent:b?.state==='planted'&&b.remaining<=(p.kit?R.kitDefuseSeconds:R.defuseSeconds)+1.5,
   carrier:b?.carrier===p.id,attacker:p.team==='attack',planted:b?.state==='planted',dropped:b?.state==='dropped'};
  const tactic=this.tacticDecider(facts);
  if(tactic==='interact'&&(facts.canPlant||facts.canDefuse)){i.use=true;p.input=i;return;}
  if(tactic==='reload'&&p.inventory[p.slot].ammo<WEAPONS[p.inventory[p.slot].id].mag&&p.inventory[p.slot].reserve>0){i.reload=true;p.input=i;return;}
  if(tactic==='escort'&&p.team==='attack'&&b?.state==='carried'&&b.carrier!==p.id){const carrier=this.players.get(b.carrier!);if(carrier){goal={x:carrier.x,z:carrier.z};if(Math.hypot(goal.x-p.x,goal.z-p.z)<3&&!enemy){p.input=i;return;}}}
  if(enemy&&(tactic===null||tactic==='engage')){
   const dx=enemy.x-p.x,dz=enemy.z-p.z,dy=enemy.y+(enemy.crouch?0.75:1.2)-(p.y+R.eyeHeight);const d=Math.hypot(dx,dz);
   const aim=Math.atan2(-dx,-dz);let delta=Math.atan2(Math.sin(aim-p.yaw),Math.cos(aim-p.yaw));i.yaw=p.yaw+Math.max(-dt*4,Math.min(dt*4,delta));i.yaw=Math.atan2(Math.sin(i.yaw),Math.cos(i.yaw));i.pitch=Math.atan2(dy,d);
   if(Math.abs(delta)<0.1&&p.botReaction<=0&&p.botShoot<=0&&p.cooldown<=dt){
    const friendly=[...this.players.values()].some(f=>f.alive&&f.team===p.team&&f!==p&&this.engine.hitbox(p.x,p.y+R.eyeHeight,p.z,dx/Math.hypot(dx,dy,dz),dy/Math.hypot(dx,dy,dz),dz/Math.hypot(dx,dy,dz),f.x,f.y,f.z,.36,R.standingHeight)>=0&&Math.hypot(f.x-p.x,f.z-p.z)<d);
    if(!friendly){i.fire=true;const w=WEAPONS[p.inventory[p.slot].id];p.botBurst++;p.botShoot=w.automatic?(p.botBurst%3===0?.36:w.interval):.35;}
   }
   if(d>25)goal={x:enemy.x,z:enemy.z};else {p.input=i;if(p.inventory[p.slot].ammo===0)i.reload=true;return;}
  }
  if(b?.state==='carried'&&b.carrier===p.id){const site=MAP.sites[this.round%2];const candidates=this.nav.nodes.filter(n=>Math.hypot(n.x-site.x,n.z-site.z)<site.radius-1);candidates.sort((a,c)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(c.x-p.x,c.z-p.z));if(candidates[0])goal=candidates[0];}
  const dist=Math.hypot(goal.x-p.x,goal.z-p.z);
  const canPlant=b?.carrier===p.id&&MAP.sites.some(s=>Math.hypot(p.x-s.x,p.z-s.z)<s.radius-0.5);
  const canDefuse=facts.canDefuse;
  if(canPlant||canDefuse){i.use=true;p.input=i;return;}
  const approachingDevice=b?.state==='planted'&&p.team==='defend'&&assigned===p.id;
  if(dist>1.2||approachingDevice){
   if(p.botPlan<=0){p.botPath=approachingDevice?this.defusePath(p,b):this.nav.path(p.x,p.z,goal.x,goal.z);p.botPlan=1+this.random();}
   // Keep the final defuse waypoint until interaction geometry becomes valid.
   let next=this.nav.point(p.botPath[0]);if(next&&Math.hypot(next.x-p.x,next.z-p.z)<0.7&&(!approachingDevice||p.botPath.length>1)){p.botPath.shift();next=this.nav.point(p.botPath[0]);}
   if(next){i.yaw=Math.atan2(-(next.x-p.x),-(next.z-p.z));i.forward=1;}
  }
  if(p.inventory[p.slot].ammo===0||(p.inventory[p.slot].ammo<8&&!enemy))i.reload=true;
  p.input=i;
 }
 publicPlayer(p:Player):PublicPlayer{return {id:p.id,name:p.name,team:p.team,alive:p.alive,x:p.x,y:p.y,z:p.z,vx:p.vx,vy:p.vy,vz:p.vz,grounded:p.grounded,crouch:p.crouch,yaw:p.yaw,pitch:p.pitch,weapon:p.inventory[p.slot].id,kills:p.kills,deaths:p.deaths,bot:p.bot};}
 snapshot(id:string):Snapshot {
  const p=this.players.get(id)!;
  const self:SelfState={...this.publicPlayer(p),health:p.health,armor:p.armor,money:p.money,kit:p.kit,inventory:p.inventory.map(g=>({...g})),slot:p.slot,reloadLeft:p.reloadLeft,progress:p.progress,action:p.action,seq:p.processedSeq,recoil:p.recoil};
  return {type:'snapshot',room:this.room,time:this.time,tick:this.tick,phase:this.phase,round:this.round,remaining:Math.max(0,this.phaseLeft),score:{...this.score},players:[...this.players.values()].map(p=>this.publicPlayer(p)),self,bomb:this.bomb?{...this.bomb}:null,events:this.events.map(e=>({...e})),winner:this.winner,reason:this.reason};
 }
}
