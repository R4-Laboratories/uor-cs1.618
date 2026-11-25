import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';
import {Match} from '../server/match';
import {BrowserMatchHost} from '../shared/browser-host';
import {neutralInput} from '../shared/protocol';
const engineBytes=await readFile('public/wasm/cs_verdant.wasm');
const kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
async function fixture(){
 const match=new Match('PEERTEST',await createEngine(engineBytes),kernel);
 const sent:{id:string;message:any;realtime:boolean}[]=[],closed:string[]=[];let clock=0;
 const host=new BrowserMatchHost(match,'secret',(id,message,realtime)=>sent.push({id,message,realtime}),id=>closed.push(id),()=>clock);
 const join=(id:string,bots=false)=>{assert.ok(host.open(id));host.message(id,{type:'join',token:'secret',name:id,team:'auto',bots});};
 return {match,host,sent,closed,join,setClock:(v:number)=>clock=v};
}
test('browser authority authenticates before bot eviction and binds identity to transport',async()=>{
 const f=await fixture();f.join('host',true);assert.equal(f.match.players.size,10);
 f.host.open('intruder');f.host.message('intruder',{type:'join',token:'wrong',name:'Intruder',team:'auto'});
 assert.equal(f.match.players.size,10);assert.ok(f.closed.includes('intruder'));
 f.join('guest');assert.equal(f.match.players.size,10);assert.ok(f.match.players.has('guest'));
 f.host.message('guest',{type:'join',token:'secret',name:'second',team:'attack'});
 assert.equal(f.match.players.size,10);assert.ok(!f.match.players.has('second'));
 f.host.message('guest',{type:'input',id:'host',input:{...neutralInput(),seq:1,slot:1}});
 assert.equal(f.match.players.get('guest')!.acceptedSeq,1);assert.equal(f.match.players.get('host')!.acceptedSeq,0);
});
test('browser snapshots are private, purchases validated, and guests clean up',async()=>{
 const f=await fixture();f.join('host');f.join('guest');f.host.step(1/60);
 const snapshot=f.sent.find(x=>x.id==='guest'&&x.message.type==='snapshot')!.message;
 assert.equal(snapshot.self.id,'guest');assert.ok(snapshot.players.every((p:any)=>!('money' in p)));
 f.host.message('guest',{type:'buy',item:'constructor'});assert.equal(f.match.players.get('guest')!.money,800);
 f.host.leave('guest');assert.ok(!f.match.players.has('guest'));
});
test('browser host bounds connections, oversized messages, rates and join deadlines',async()=>{
 const f=await fixture();f.join('host');
 f.host.open('large');f.host.message('large',{type:'ping',padding:'x'.repeat(4096)});assert.ok(f.closed.includes('large'));
 f.host.open('slow');f.setClock(11000);f.host.step(1/60);assert.ok(f.closed.includes('slow'));
 f.join('flood');for(let n=0;n<151;n++)f.host.message('flood',{type:'ping',at:n});assert.ok(f.closed.includes('flood'));
 for(let n=0;n<9;n++)assert.ok(f.host.open('pending'+n));assert.equal(f.host.open('overflow'),false);
});
test('duplicate transport opens preserve joined sessions and the original join deadline',async()=>{
 const f=await fixture();f.join('host');f.join('guest');const player=f.match.players.get('guest');
 assert.equal(f.host.open('guest'),true);assert.equal(f.closed.length,0);assert.equal(f.match.players.get('guest'),player);
 f.host.message('guest',{type:'input',input:{...neutralInput(),seq:1}});assert.equal(player!.acceptedSeq,1);
 f.host.open('pending');f.setClock(9000);assert.equal(f.host.open('pending'),true);
 f.setClock(10001);f.host.step(1/60);assert(f.closed.includes('pending'),'Repeated open must not renew unauthenticated handshake lifetime');
});
test('WebRTC scores are delivered reliably and repeated in later movement snapshots',async()=>{
 const f=await fixture();f.join('host');f.join('guest');
 f.sent.length=0;f.match.players.get('guest')!.kills=1;
 for(let i=0;i<6;i++)f.host.step(1/60);
 const packets=f.sent.filter(p=>p.id==='guest'&&p.message.type==='snapshot');
 assert.deepEqual(packets.map(p=>[p.realtime,p.message.self.career.kills]),[[false,1],[true,1]]);
});

test('queued movement delivered after a render stall keeps the guest connected and controls responsive',async()=>{
 const f=await fixture();f.join('host');f.join('guest');
 for(let seq=1;seq<=155;seq++)f.host.message('guest',{type:'input',input:{...neutralInput(),seq}});
 f.host.message('guest',{type:'ping',at:321});
 assert(f.sent.some(entry=>entry.id==='guest'&&entry.message.type==='pong'&&entry.message.at===321));
 assert.equal(f.closed.length,0);
 assert(f.match.players.get('guest')!.acceptedSeq<155);
 f.setClock(20);f.host.message('guest',{type:'input',input:{...neutralInput(),seq:156}});
 assert.equal(f.match.players.get('guest')!.acceptedSeq,156);
});
