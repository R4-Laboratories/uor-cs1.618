import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {createGameServer} from '../server/index';
import {GAME_PROTOCOL,neutralInput} from '../shared/protocol';
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function client(port:number,name:string,team:string,room='INTEGRATION'){
 const ws=new WebSocket(`ws://127.0.0.1:${port}/socket`);const received:any[]=[];ws.on('message',d=>received.push(JSON.parse(d.toString())));
 await new Promise<void>((r,j)=>{ws.once('open',r);ws.once('error',j);});ws.send(JSON.stringify({type:'join',protocol:GAME_PROTOCOL,name,room,team,bots:false}));
 const wait=async(fn:(m:any)=>boolean)=>{const until=Date.now()+5000;while(Date.now()<until){const found=received.find(fn);if(found)return found;await sleep(15);}throw Error('Timed out waiting for message: '+JSON.stringify(received.slice(-2)));};
 const welcome=await wait(m=>m.type==='welcome');return {ws,received,wait,id:welcome.id,latest:()=>received.filter(m=>m.type==='snapshot').at(-1)};
}
test('CS-05 two real sockets see movement, authoritative combat, room isolation and cleanup',async()=>{
 const game=await createGameServer({port:0,host:'127.0.0.1'});
 try{
  const a=await client(game.port,'Alpha','attack'),b=await client(game.port,'Bravo','defend'),c=await client(game.port,'Other','attack','ISOLATED');
  await b.wait(m=>m.type==='snapshot'&&m.players.length===2);
  assert.equal(c.latest()?.players.length??1,1);
  const room=game.rooms.get('INTEGRATION')!;room.phase='live';room.phaseLeft=100;
  const pa=room.players.get(a.id)!,pb=room.players.get(b.id)!;Object.assign(pa,{x:0,z:20,yaw:0});Object.assign(pb,{x:0,z:16,yaw:Math.PI});
  a.ws.send(JSON.stringify({type:'input',input:{...neutralInput(),seq:1,forward:1,slot:1}}));await sleep(300);
  assert.ok(pa.z<20);assert.ok(b.latest().players.find((p:any)=>p.id===a.id).z<20);
  a.ws.send(JSON.stringify({type:'input',input:{...neutralInput(),seq:2,fire:true,slot:1}}));await b.wait(m=>m.type==='snapshot'&&m.self.health<100);
  const health=pb.health;a.ws.send(JSON.stringify({type:'input',input:{...neutralInput(),seq:3,forward:999,health:0,target:b.id}}));await a.wait(m=>m.type==='error'&&m.code==='input');assert.equal(pb.health,health);
  a.ws.send('{broken');await a.wait(m=>m.type==='error'&&m.code==='invalid-json');
  a.ws.close();b.ws.close();c.ws.close();await sleep(100);assert.equal(game.rooms.size,0);
 }finally{await game.close();}
});

test('a different map and equipment protocol cannot enter the room',async()=>{
 const game=await createGameServer({port:0,host:'127.0.0.1'});
 try{
  const client=new WebSocket(`ws://127.0.0.1:${game.port}/socket`);
  await new Promise<void>(resolve=>client.once('open',resolve));
  const closed=new Promise<number>(resolve=>client.once('close',resolve));
  client.send(JSON.stringify({type:'join',protocol:'cs1618-v2',name:'Legacy',room:'OLD',team:'auto',bots:true}));
  assert.equal(await closed,1002);assert.equal(game.rooms.size,0);
 }finally{await game.close();}
});
