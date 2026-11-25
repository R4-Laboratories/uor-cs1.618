import {PacketBudget} from '../shared/packet-budget';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EventEmitter} from 'node:events';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
// Exercise the production room's public lifecycle without a browser. FakePeer
// reproduces PeerJS's documented ownership of a call before emitting `call`.
const source=readFileSync('src/peer-room.ts','utf8').replaceAll('import.meta.url',JSON.stringify('https://game.test/peer-room.ts'));
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
test('browser rooms reject unsolicited media calls before they accumulate',async()=>{
 for(const host of [true,false]){
  let peer!:FakePeer;
  class FakePeer extends EventEmitter{
   calls=new Set<object>();destroyed=false;
   constructor(){super();peer=this;}
   destroy(){this.destroyed=true;}
   offerMedia(){const call={close:()=>this.calls.delete(call)};this.calls.add(call);this.emit('call',call);}
  }
  const exports:Record<string,any>={};
  runInNewContext(compiled,{exports,require:(name:string)=>name.endsWith('/packet-budget')?{PacketBudget}:name==='peerjs'?{default:FakePeer}:{PEER_PROTOCOL:'cs1618-v3',invitationUrl:()=>''},crypto,location:{href:'https://game.test/'},performance,setTimeout,clearTimeout,setInterval,clearInterval,URL});
  const started=exports.PeerRoom.start({host,invitation:{room:'123456789abc',token:'0'.repeat(32)},network:{ice:{iceServers:[]}},receive:()=>{},status:()=>{},closed:()=>{}});
  const rejected=assert.rejects(started,/Could not establish/);
  try{for(let n=0;n<25;n++)peer.offerMedia();assert.equal(peer.calls.size,0,'Unsupported calls must close immediately on both host and guest');}
  finally{peer.emit('error',{type:'network'});await rejected;}
 }
});
test('duplicate PeerJS open notifications perform a single host or guest handshake',async()=>{
 for(const host of [true,false]){
  let peer!:FakePeer;const sent:any[]=[],workerMessages:any[]=[];let fastCreated=0;
  const channel=()=>({readyState:'open',bufferedAmount:0,send:(s:string)=>sent.push(JSON.parse(s)),close:()=>{}});
  class Connection extends EventEmitter {
   label='cs1618-v3';metadata={protocol:'cs1618-v3'};serialization='raw';dataChannel=channel();
   peerConnection={ondatachannel:null,addEventListener:()=>{},createDataChannel:()=>{fastCreated++;return channel();}};
   close(){}
  }
  const connection=new Connection();
  class FakePeer extends EventEmitter {constructor(){super();peer=this;}connect(){return connection;}destroy(){}}
  class FakeWorker {onmessage:any;postMessage(m:any){workerMessages.push(m);if(m.type==='init')this.onmessage({data:{type:'ready'}});}terminate(){}}
  const exports:Record<string,any>={};
  runInNewContext(compiled,{exports,require:(name:string)=>name.endsWith('/packet-budget')?{PacketBudget}:name==='peerjs'?{default:FakePeer}:{PEER_PROTOCOL:'cs1618-v3',invitationUrl:()=>''},Worker:FakeWorker,crypto,location:{href:'https://game.test/'},performance,setTimeout,clearTimeout,setInterval,clearInterval,URL});
  const started=exports.PeerRoom.start({host,invitation:{room:'123456789abc',token:'0'.repeat(32)},network:{ice:{iceServers:[]}},receive:()=>{},status:()=>{},closed:()=>{}});
  peer.emit('open');if(host)peer.emit('connection',connection);
  connection.emit('open');connection.emit('open');
  if(!host)connection.emit('data',JSON.stringify({type:'welcome',id:'guest'}));
  const room=await started;
  try{assert.equal(room.status.mode,host?'host':'guest');if(host)assert.equal(workerMessages.filter(m=>m.type==='open').length,1);else{assert.equal(sent.filter(m=>m.type==='join').length,1);assert.equal(fastCreated,1);}}
  finally{room.close();}
 }
});
test('discovery guests refuse every gameplay packet until a live host proof has passed',async()=>{
 for(const packet of [{type:'welcome',id:'forged'},{type:'snapshot'},{type:'pong'},{type:'error',code:'other',message:'bypass'}]){
  let peer!:FakePeer;const sent:any[]=[],received:any[]=[];
  const channel={readyState:'open',bufferedAmount:0,send:(s:string)=>sent.push(JSON.parse(s)),close:()=>{}};
  class Connection extends EventEmitter {
   peer='cs1618-v3-123456789abc';dataChannel=channel;
   peerConnection={ondatachannel:null,addEventListener:()=>{},createDataChannel:()=>channel};close(){}
  }
  const connection=new Connection();
  class FakePeer extends EventEmitter {id='cs1618-v3-guest-test';constructor(){super();peer=this;}connect(){return connection;}destroy(){}}
  const exports:Record<string,any>={};
  runInNewContext(compiled,{exports,require:(name:string)=>name.endsWith('/packet-budget')?{PacketBudget}:name==='peerjs'?{default:FakePeer}:{PEER_PROTOCOL:'cs1618-v3',invitationUrl:()=>''},crypto,location:{href:'https://game.test/',origin:'https://game.test'},performance,setTimeout,clearTimeout,setInterval,clearInterval,URL});
  const started=exports.PeerRoom.start({host:false,expectedHost:{prism:'pinned-prism',audience:'https://game.test',policy:{}},invitation:{room:'123456789abc',token:'0'.repeat(32)},network:{ice:{iceServers:[]}},receive:(m:any)=>received.push(m),status:()=>{},closed:()=>{}});
  const outcome=started.then((room:any)=>{room.close();return 'accepted';},()=> 'refused');
  peer.emit('open');connection.emit('open');connection.emit('data',JSON.stringify(packet));
  // A missing gate can leave non-welcome traffic waiting; terminate that path.
  peer.emit('error',{type:'network'});
  assert.equal(await outcome,'refused','Unproved welcome must not resolve the room');
  assert.deepEqual(received,[]);
  assert.equal(sent[0]?.type,'host-challenge','Discovery sends a challenge before join');
  assert.equal(sent.some(p=>p.type==='join'),false);
 }
});
test('closing challenged links does not release the room-wide pending-signature budget',async()=>{
 let peer!:FakePeer,startedSignatures=0;const pending:{resolve:(proof:any)=>void;reject:(reason:Error)=>void}[]=[],sent:any[]=[];
 const channel=()=>({readyState:'open',bufferedAmount:0,send:(s:string)=>sent.push(JSON.parse(s)),close:()=>{}});
 class Connection extends EventEmitter {
  peer='guest';label='cs1618-v3';metadata={protocol:'cs1618-v3'};serialization='raw';dataChannel=channel();
  peerConnection={ondatachannel:null,addEventListener:()=>{},createDataChannel:channel};close(){}
 }
 class FakePeer extends EventEmitter {id='cs1618-v3-123456789abc';constructor(){super();peer=this;}destroy(){}}
 class FakeWorker {onmessage:any;postMessage(m:any){if(m.type==='init')this.onmessage({data:{type:'ready'}});}terminate(){}}
 const exports:Record<string,any>={};
 runInNewContext(compiled,{exports,require:(name:string)=>name.endsWith('/packet-budget')?{PacketBudget}:name==='peerjs'?{default:FakePeer}:name.includes('match-discovery')?{signHostProof:()=>{startedSignatures++;return new Promise((resolve,reject)=>pending.push({resolve,reject}));}}:{PEER_PROTOCOL:'cs1618-v3',invitationUrl:()=>''},Worker:FakeWorker,crypto,location:{href:'https://game.test/',origin:'https://game.test'},performance,setTimeout,clearTimeout,setInterval,clearInterval,URL});
 const started=exports.PeerRoom.start({host:true,hostIdentity:{},invitation:{room:'123456789abc',token:'0'.repeat(32)},network:{ice:{iceServers:[]}},receive:()=>{},status:()=>{},closed:()=>{}});peer.emit('open');const room=await started;
 const churn=()=>{const c=new Connection();peer.emit('connection',c);c.emit('open');c.emit('data',JSON.stringify({type:'host-challenge',room:'123456789abc',token:'0'.repeat(32),hostPeer:peer.id,guestPeer:c.peer,signaling:'peerjs-cloud',challenge:'a'.repeat(64)}));c.emit('close');};
 try{
  for(let n=0;n<100;n++)churn();
  assert.equal(startedSignatures,4,'Outstanding crypto stays capped even when every link closes');
  pending.shift()!.resolve({});await new Promise(r=>setImmediate(r));churn();assert.equal(startedSignatures,5,'Settled work releases one slot');
  pending.shift()!.reject(Error('signing failed'));await new Promise(r=>setImmediate(r));churn();assert.equal(startedSignatures,6,'Failed work also releases one slot');
  assert.deepEqual(sent,[],'Late results from removed links are never sent');
 }finally{room.close();for(const task of pending)task.resolve({});await new Promise(r=>setImmediate(r));}
});
