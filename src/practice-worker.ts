import {Match} from '../server/match';
import {createEngine} from '../shared/engine';
import {RULES} from '../shared/config';
import {createRoundKernel} from '../shared/round-kernel';
let match:Match|null=null;const id='local-operator';
self.onmessage=async({data:m})=>{
 if(m.type==='init'){const engine=await createEngine(m.bytes);match=new Match('PRACTICE',engine,await createRoundKernel(m.roundBytes));match.join(id,m.name,m.team);match.enableBots();self.postMessage({type:'welcome',id,room:'PRACTICE',team:match.players.get(id)!.team,tickRate:RULES.tickRate});self.postMessage(match.snapshot(id));let tick=0;setInterval(()=>{match!.step(1/60);if(++tick%3===0)self.postMessage(match!.snapshot(id));},1000/60);}
 else if(m.type==='input')match?.input(id,m.input);
 else if(m.type==='buy')self.postMessage({type:'buy-result',item:m.item,error:match?.buy(id,m.item)});
 else if(m.type==='ping')self.postMessage({type:'pong',at:m.at});
};
