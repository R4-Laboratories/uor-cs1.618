import {GAME_PROTOCOL} from '../shared/protocol';
import {SeatChat} from '../shared/room-chat';
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {createEngine} from '../shared/engine';
import {RULES} from '../shared/config';
import {Match} from './match';
import {createRoundKernel} from '../shared/round-kernel';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function createGameServer({dev=false,port=3000,host='0.0.0.0'}={}){
 const bytes=await readFile(path.join(ROOT,'public/wasm/cs_verdant.wasm'));
 const roundKernel=await createRoundKernel(await readFile(path.join(ROOT,'public/wasm/cs_round.wasm')));
 const rooms=new Map<string,Match>();
 const vite=dev?await (await import('vite')).createServer({root:ROOT,server:{middlewareMode:true},appType:'spa'}):null;
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url??'/', 'http://localhost');
  if(url.pathname==='/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,game:'cs1.618',rooms:rooms.size}));return;}
  if(url.pathname==='/api/rooms'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify([...rooms.values()].map(r=>({name:r.room,players:[...r.players.values()].filter(p=>!p.bot).length,bots:[...r.players.values()].filter(p=>p.bot).length,phase:r.phase}))));return;}
  if(vite){vite.middlewares(req,res);return;}
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
  const file=path.resolve(ROOT,'dist','.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(path.join(ROOT,'dist')+path.sep)){res.writeHead(403);res.end();return;}
  try{if(!(await stat(file)).isFile())throw Error();const data=await readFile(file);const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.woff2':'font/woff2'};res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.end(data);}catch{res.writeHead(404);res.end('Not found. Run npm run build first.');}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{if(req.url!=='/socket'){socket.destroy();return;}const allowed=process.env.ALLOWED_ORIGINS?.split(',');if(allowed&&req.headers.origin&&!allowed.includes(req.headers.origin)){socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));});
 const connections=new Map<WebSocket,{id:string;room:Match|null;joined:boolean;messages:number;window:number;alive:boolean}>();
 wss.on('connection',ws=>{
  if(connections.size>=200){ws.close(1013,'Server full');return;}
  const c={id:randomUUID(),room:null as Match|null,joined:false,messages:0,window:Date.now(),alive:true};connections.set(ws,c);
  const chat=new SeatChat();
  const timeout=setTimeout(()=>{if(!c.joined)ws.close(1008,'Join timeout');},10000);
  ws.on('pong',()=>{c.alive=true;});
  ws.on('error',()=>{});
  ws.on('message',async data=>{
   if(Date.now()-c.window>1000){c.window=Date.now();c.messages=0;}if(++c.messages>150){ws.close(1008,'Message rate exceeded');return;}
   let m;try{m=JSON.parse(data.toString());}catch{ws.send(JSON.stringify({type:'error',code:'invalid-json',message:'Invalid message.'}));return;}
   if(!m||typeof m!=='object')return;
   if(m.type==='ping'){if(Number.isFinite(m.at))ws.send(JSON.stringify({type:'pong',at:m.at}));return;}
   if(m.type==='join'&&!c.joined){
    if(m.protocol!==GAME_PROTOCOL){ws.close(1002,'Incompatible game version');return;}
    if(typeof m.room!=='string'||!/^[A-Za-z0-9-]{1,20}$/.test(m.room)||typeof m.name!=='string'||!['auto','attack','defend'].includes(m.team)||typeof m.bots!=='boolean'){ws.send(JSON.stringify({type:'error',code:'join',message:'Use a room code of 1–20 letters, digits or hyphens.'}));return;}
    // Reserve the handshake before awaiting Wasm to prevent duplicate joins.
    c.joined=true;const room=m.room.toUpperCase();
    if(!rooms.has(room)){
     if(rooms.size>=32){c.joined=false;ws.send(JSON.stringify({type:'error',code:'rooms-full',message:'Server room limit reached.'}));return;}
     // Each room gets an independent Wasm spatial world.
     const engine=await createEngine(bytes);if(ws.readyState!==WebSocket.OPEN)return;
     if(!rooms.has(room))rooms.set(room,new Match(room,engine,roundKernel));
    }
    const match=rooms.get(room)!;
    const p=match.join(c.id,m.name,m.team);if(!p){c.joined=false;ws.send(JSON.stringify({type:'error',code:'room-full',message:'This room is full.'}));return;}
    c.room=match;clearTimeout(timeout);if(m.bots)match.enableBots();
    ws.send(JSON.stringify({type:'welcome',protocol:GAME_PROTOCOL,id:c.id,room,team:p.team,tickRate:RULES.tickRate}));ws.send(JSON.stringify(match.snapshot(c.id)));return;
   }
   if(!c.room)return;
   if(m.type==='chat'){
    const delivery=chat.route(c.room.players,c.id,m);
    if(!delivery)return;
    const packet=JSON.stringify(delivery.message);
    for(const [peer,seat] of connections){
     if(seat.room===c.room&&delivery.recipients.includes(seat.id)&&peer.readyState===WebSocket.OPEN)peer.send(packet);
    }
    return;
   }
   if(m.type==='input'){if(!c.room.input(c.id,m.input))ws.send(JSON.stringify({type:'error',code:'input',message:'Input rejected.'}));}
   if(m.type==='buy'&&typeof m.item==='string'){const error=c.room.buy(c.id,m.item);ws.send(JSON.stringify({type:'buy-result',item:m.item,error}));}
  });
  ws.on('close',()=>{clearTimeout(timeout);c.room?.leave(c.id);connections.delete(ws);if(c.room){if(![...c.room.players.values()].some(p=>!p.bot))rooms.delete(c.room.room);else if(c.room.botsEnabled)c.room.fillBots();}});
 });
 let last=performance.now(),accumulator=0;
 const timer=setInterval(()=>{
  const now=performance.now();accumulator+=Math.min(0.1,(now-last)/1000);last=now;
  while(accumulator>=1/RULES.tickRate){for(const room of rooms.values())room.step(1/RULES.tickRate);accumulator-=1/RULES.tickRate;}
 },1000/RULES.tickRate/2);
 const snapshots=setInterval(()=>{for(const [ws,c] of connections)if(c.room&&ws.readyState===WebSocket.OPEN){if(ws.bufferedAmount>1024*1024){ws.close(1013,'Slow connection');continue;}ws.send(JSON.stringify(c.room.snapshot(c.id)));}},1000/RULES.snapshotRate);
 const heartbeat=setInterval(()=>{for(const [ws,c] of connections){if(!c.alive){ws.terminate();continue;}c.alive=false;ws.ping();}},15000);
 await new Promise<void>(resolve=>server.listen(port,host,resolve));
 const addr=server.address() as {port:number};
 return {server,rooms,port:addr.port,close:async()=>{clearInterval(timer);clearInterval(snapshots);clearInterval(heartbeat);for(const ws of connections.keys())ws.terminate();await new Promise<void>(r=>wss.close(()=>r()));await vite?.close();await new Promise<void>(r=>server.close(()=>r()));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const game=await createGameServer({dev:process.argv.includes('--dev'),port:Number(process.env.PORT??3000),host:process.env.HOST??'0.0.0.0'});
 console.log(`cs1.618 is ready at http://localhost:${game.port}`);
 for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{void game.close().then(()=>process.exit(0));});
}
