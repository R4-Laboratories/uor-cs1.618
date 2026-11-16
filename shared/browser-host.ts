import {Match} from '../server/match';
import {RULES,WEAPONS} from './config';
interface Session {joined:boolean;opened:number;last:number;window:number;count:number;}
/** Authority boundary shared by the worker and its tests. IDs come only from transport. */
export class BrowserMatchHost {
 private sessions=new Map<string,Session>();
 private snapshotTicks=0;
 constructor(public readonly match:Match,private token:string,
  private send:(id:string,message:unknown,realtime:boolean)=>void,
  private drop:(id:string,reason:string)=>void,private now=()=>performance.now()){}
 open(id:string){
  if(this.sessions.has(id)||this.sessions.size>=RULES.maxPlayers){this.drop(id,'Room full.');return false;}
  const now=this.now();this.sessions.set(id,{joined:false,opened:now,last:now,window:now,count:0});return true;
 }
 private reject(id:string,reason:string){this.leave(id);this.drop(id,reason);}
 message(id:string,value:unknown){
  const session=this.sessions.get(id);if(!session)return;
  const now=this.now();
  if(now-session.window>=1000){session.window=now;session.count=0;}
  if(++session.count>150){this.reject(id,'Message rate exceeded.');return;}
  let size:number;try{size=JSON.stringify(value).length;}catch{this.reject(id,'Invalid message.');return;}
  if(size>4096){this.reject(id,'Message too large.');return;}
  if(!value||typeof value!=='object')return;
  const m=value as Record<string,any>;
  if(!session.joined){
   if(m.type!=='join'||m.token!==this.token||typeof m.name!=='string'||!['auto','attack','defend'].includes(m.team)){
    this.reject(id,'Invalid invitation or join request.');return;
   }
   if(this.match.players.size>=RULES.maxPlayers)this.match.evictBot(m.team);
   const player=this.match.join(id,m.name,m.team);
   if(!player){this.reject(id,'Room full.');return;}
   session.joined=true;session.last=now;
   // Only the creator decides whether the room has bots.
   if(id==='host'&&m.bots===true)this.match.enableBots();
   this.send(id,{type:'welcome',id,room:this.match.room,team:player.team,tickRate:RULES.tickRate},false);
   this.send(id,this.match.snapshot(id),false);return;
  }
  session.last=now;
  if(m.type==='input')this.match.input(id,m.input);
  else if(m.type==='ping'&&Number.isFinite(m.at))this.send(id,{type:'pong',at:m.at},false);
  else if(m.type==='buy'&&typeof m.item==='string'){
   const valid=Object.hasOwn(WEAPONS,m.item)||['armor','kit','ammo'].includes(m.item);
   this.send(id,{type:'buy-result',item:m.item,error:valid?this.match.buy(id,m.item):'unknown'},false);
  }
 }
 step(dt:number){
  const now=this.now();for(const [id,s] of this.sessions){
   if(!s.joined&&now-s.opened>10000)this.reject(id,'Join timed out.');
   else if(s.joined&&id!=='host'&&now-s.last>20000)this.reject(id,'Peer stopped responding.');
  }
  this.match.step(dt);
  if(++this.snapshotTicks%3===0)for(const [id,s]of this.sessions)if(s.joined)this.send(id,this.match.snapshot(id),true);
 }
 leave(id:string){
  const session=this.sessions.get(id);if(!session)return;this.sessions.delete(id);
  if(session.joined){this.match.leave(id);if(this.match.botsEnabled)this.match.fillBots();}
 }
}
