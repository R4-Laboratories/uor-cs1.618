import {Match} from '../server/match';
import {BrowserMatchHost} from '../shared/browser-host';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';
let host:BrowserMatchHost|null=null,initializing=false;
self.onmessage=async({data:m})=>{
 try{
  if(m.type==='init'&&!initializing){
   initializing=true;
   const engine=await createEngine(m.bytes),kernel=await createRoundKernel(m.roundBytes);
   host=new BrowserMatchHost(new Match(m.room,engine,kernel),m.token,
    (peer,message,realtime)=>self.postMessage({type:'deliver',peer,message,realtime}),
    (peer,reason)=>self.postMessage({type:'drop',peer,reason}));
   host.open('host');host.message('host',{type:'join',token:m.token,name:m.name,team:m.team,bots:m.bots});
   self.postMessage({type:'ready'});
   let last=performance.now(),accumulator=0;
   setInterval(()=>{const now=performance.now();accumulator+=Math.min(.1,(now-last)/1000);last=now;
    while(accumulator>=1/60){host!.step(1/60);accumulator-=1/60;}
   },1000/120);
  }else if(m.type==='open')host?.open(m.peer);
  else if(m.type==='message')host?.message(m.peer,m.message);
  else if(m.type==='leave')host?.leave(m.peer);
 }catch{self.postMessage({type:'fatal',message:'The browser host could not run the match. Reload and try again.'});}
};
