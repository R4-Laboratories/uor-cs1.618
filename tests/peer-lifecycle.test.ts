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
  runInNewContext(compiled,{exports,require:(name:string)=>name==='peerjs'?{default:FakePeer}:{PEER_PROTOCOL:'cs1618-v2',invitationUrl:()=>''},crypto,location:{href:'https://game.test/'},performance,setTimeout,clearTimeout,setInterval,clearInterval,URL});
  const started=exports.PeerRoom.start({host,invitation:{room:'123456789abc',token:'0'.repeat(32)},network:{ice:{iceServers:[]}},receive:()=>{},status:()=>{},closed:()=>{}});
  const rejected=assert.rejects(started,/Could not establish/);
  try{for(let n=0;n<25;n++)peer.offerMedia();assert.equal(peer.calls.size,0,'Unsupported calls must close immediately on both host and guest');}
  finally{peer.emit('error',{type:'network'});await rejected;}
 }
});
