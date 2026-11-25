import {Match} from '../server/match';
import {createEngine} from '../shared/engine';
import {RULES} from '../shared/config';
import {createRoundKernel} from '../shared/round-kernel';

let match:Match|null=null;
let playing=false;
const id='local-operator';
self.onmessage=async({data:m})=>{
 if(m.type==='init'){
  const engine=await createEngine(m.bytes);
  match=new Match('PRACTICE',engine,await createRoundKernel(m.roundBytes));
  match.join(id,m.name,m.team);match.enableBots();
  self.postMessage({type:'welcome',id,room:'PRACTICE',team:match.players.get(id)!.team,tickRate:RULES.tickRate});
  self.postMessage(match.snapshot(id));
  let last=performance.now(),accumulator=0;
  setInterval(()=>{
   const now=performance.now();
   if(playing)accumulator+=Math.min(.1,(now-last)/1000);
   else accumulator=0;
   last=now;
   while(accumulator>=1/60){
    match!.step(1/60);accumulator-=1/60;
    if(match!.tick%3===0)self.postMessage(match!.snapshot(id));
   }
  },1000/120);
 }else if(m.type==='practice-playing'){
  playing=m.playing===true;
 }else if(m.type==='input'&&playing){
  match?.input(id,m.input);
 }else if(m.type==='buy'){
  if(!match)return;
  const error=match.buy(id,m.item);
  // During pre-deployment shopping the game clock is stopped and no snapshots are ticking.
  const selfState=!playing && !error?match.snapshot(id).self:undefined;
  self.postMessage({type:'buy-result',item:m.item,error,selfState});
 }else if(m.type==='ping'){
  self.postMessage({type:'pong',at:m.at});
 }
};
