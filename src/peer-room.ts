import Peer,{type DataConnection} from 'peerjs';
import {signHostProof,verifyHostProof,type HostBinding} from '../shared/match-discovery';
import type {HologramPolicy} from '../shared/hologram-policy';
import type {Team} from '../shared/config';
import {PEER_PROTOCOL,invitationUrl,type Invitation,type NetworkConfig} from './peer-config';
interface Options {
 host:boolean;invitation:Invitation;network:NetworkConfig;name:string;team:Team|'auto';bots:boolean;
 bytes:ArrayBuffer;roundBytes:ArrayBuffer;
 hostIdentity?:any;expectedHost?:{prism:string;audience:string;policy:HologramPolicy};
 receive:(message:any)=>void;status:(message:string)=>void;closed:(reason:string)=>void;
}
interface Link {proofState:'none'|'waiting'|'verifying'|'verified';challenge?:HostBinding;id:string;opened:boolean;connection:DataConnection;fast:RTCDataChannel|null;timer:ReturnType<typeof setTimeout>;lastSeen:number;route:string;window:number;count:number;}
/** Rendezvous uses PeerServer; gameplay stays on encrypted browser-to-browser channels. */
export class PeerRoom {
 readonly invitation:string;
 readonly isHost:boolean;
 private peer:Peer;
 private worker:Worker|null=null;
 private links=new Map<string,Link>();
 private stopped=false;
 private joined=false;
 // Crypto remains in flight even after its link is removed.
 private signing=0;
 private startup!:ReturnType<typeof setTimeout>;
 private monitor!:ReturnType<typeof setInterval>;
 private resolve!:()=>void;
 private reject!:(error:Error)=>void;
 private ready:Promise<void>;
 private reconnect:ReturnType<typeof setTimeout>|null=null;
 private diagnostics={mode:'connecting',route:'negotiating',peers:0,fast:false,hostVerified:false};
 static async start(options:Options){const room=new PeerRoom(options);await room.ready;return room;}
 private constructor(private options:Options){
  this.isHost=options.host;this.invitation=invitationUrl(options.invitation,location.href);
  this.ready=new Promise<void>((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});
  this.peer=new Peer(options.host?`${PEER_PROTOCOL}-${options.invitation.room}`:`${PEER_PROTOCOL}-guest-${crypto.randomUUID()}`,
   {...options.network.signaling,config:options.network.ice,debug:0});
  this.startup=setTimeout(()=>this.fail('Connection timed out. Check the invitation and signaling service; restrictive networks may need TURN.'),25000);
  this.peer.on('open',()=>{
   if(this.stopped||this.joined)return;
   if(options.host)this.startHost();
   else this.attach(this.peer.connect(`${PEER_PROTOCOL}-${options.invitation.room}`,{label:PEER_PROTOCOL,serialization:'raw',reliable:true,metadata:{protocol:PEER_PROTOCOL}}));
  });
  // Media is outside this protocol; PeerJS retains unanswered calls until closed.
  this.peer.on('call',call=>call.close());
  this.peer.on('connection',connection=>{
   if(!options.host||!this.worker||this.links.size>=9||connection.label!==PEER_PROTOCOL||connection.metadata?.protocol!==PEER_PROTOCOL||connection.serialization!=='raw'){connection.close();return;}
   this.attach(connection);
  });
  this.peer.on('error',error=>{
   const type=error.type as string;
   if(this.joined&&['network','disconnected','socket-error','socket-closed','peer-unavailable'].includes(type)){
    options.status('Signaling unavailable. Existing peer links can continue; new joins may fail.');return;
   }
   if(this.joined&&options.host){options.status('A peer could not connect. Check TURN settings if direct connections fail.');return;}
   this.fail(type==='peer-unavailable'?'Room not found. The host must keep the room open.':type==='unavailable-id'?'That browser room is already in use. Create a new room.':'Could not establish the browser room. Check signaling, STUN and TURN settings.');
  });
  this.peer.on('disconnected',()=>{
   if(this.stopped)return;options.status('Signaling disconnected. Existing gameplay links remain active.');
   if(!this.reconnect)this.reconnect=setTimeout(()=>{this.reconnect=null;if(!this.stopped&&this.peer.disconnected&&!this.peer.destroyed)this.peer.reconnect();},5000);
  });
  this.monitor=setInterval(()=>{
   if(this.joined&&!this.isHost)this.send({type:'ping',at:performance.now()});
   for(const link of this.links.values()){
    if(performance.now()-link.lastSeen>20000){this.remove(link,'Peer stopped responding.');continue;}
    void this.inspectRoute(link);
   }
  },3000);
 }
 private startHost(){
  this.worker=new Worker(new URL('./host-worker.ts',import.meta.url),{type:'module'});
  this.worker.onerror=()=>this.fail('The browser host stopped. Reload and create a new room.');
  this.worker.onmessage=({data:m})=>{
   if(this.stopped)return;
   if(m.type==='ready'){this.joined=true;this.diagnostics.mode='host';clearTimeout(this.startup);this.resolve();}
   else if(m.type==='fatal')this.fail(m.message);
   else if(m.type==='drop'){
    const link=this.links.get(m.peer);if(link){this.transmit(link,{type:'error',code:'peer',message:m.reason},false);setTimeout(()=>this.remove(link,m.reason),200);}
   }else if(m.type==='deliver'){
    if(m.peer==='host')this.options.receive(m.message);
    else {const link=this.links.get(m.peer);if(link){if(m.message.type==='welcome')clearTimeout(link.timer);this.transmit(link,m.message,m.realtime);}}
   }
  };
  const o=this.options;
  this.worker.postMessage({type:'init',room:o.invitation.room.toUpperCase(),token:o.invitation.token,bytes:o.bytes,roundBytes:o.roundBytes,name:o.name,team:o.team,bots:o.bots});
 }
 private attach(connection:DataConnection){
  const id=`remote-${crypto.randomUUID()}`;
  const link:Link={id,proofState:'none',opened:false,connection,fast:null,lastSeen:performance.now(),route:'negotiating',window:performance.now(),count:0,timer:setTimeout(()=>this.remove(link,'Peer handshake timed out.'),15000)};
  this.links.set(id,link);this.diagnostics.peers=this.links.size;
  // PeerJS normally owns ondatachannel. Route only its primary channel to its handler.
  const pc=connection.peerConnection,original=pc.ondatachannel;
  pc.ondatachannel=event=>{if(event.channel.label==='cs-realtime')this.attachFast(link,event.channel);else if(event.channel.label===PEER_PROTOCOL)original?.call(pc,event);else event.channel.close();};
  connection.on('open',()=>{
   if(this.stopped||link.opened||!this.links.has(id))return;
   link.opened=true;
   if(this.options.host)this.worker?.postMessage({type:'open',peer:id});
   else{
    this.attachFast(link,pc.createDataChannel('cs-realtime',{ordered:false,maxRetransmits:0}));
    if(this.options.expectedHost){
     link.proofState='waiting';
     link.challenge={...this.options.invitation,hostPeer:connection.peer,guestPeer:this.peer.id,signaling:this.signaling(),challenge:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')};
     this.transmit(link,{type:'host-challenge',...link.challenge},false);
    }else this.join(link);
   }
  });
  connection.on('data',data=>this.incoming(link,data,false));
  connection.on('close',()=>this.remove(link,'The host left or the connection closed.'));
  connection.on('error',()=>this.remove(link,'The peer connection failed. Check TURN settings and try again.'));
  pc.addEventListener('connectionstatechange',()=>{if(pc.connectionState==='failed')this.remove(link,'Direct connection failed. Configure TURN for restricted networks.');});
 }
 private attachFast(link:Link,channel:RTCDataChannel){
  if(link.fast){channel.close();return;}link.fast=channel;
  channel.onmessage=event=>this.incoming(link,event.data,true);
  channel.onopen=()=>{this.diagnostics.fast=true;};
  channel.onclose=()=>{this.diagnostics.fast=[...this.links.values()].some(l=>l.fast?.readyState==='open');};
 }
 private incoming(link:Link,data:unknown,realtime:boolean){
  if(this.stopped||!this.links.has(link.id))return;
  const now=performance.now();if(now-link.window>=1000){link.window=now;link.count=0;}
  if(++link.count>150){this.remove(link,'Message rate exceeded.');return;}
  if(typeof data!=='string'||data.length>(this.options.host?4096:131072)){this.remove(link,'Invalid peer packet.');return;}
  let message:any;try{message=JSON.parse(data);}catch{this.remove(link,'Invalid peer packet.');return;}
  if(!message||typeof message!=='object')return;
  link.lastSeen=performance.now();
  if(this.options.host){
   if(message.type==='host-challenge'){
    if(realtime||link.proofState!=='none'||!this.options.hostIdentity||message.room!==this.options.invitation.room||message.token!==this.options.invitation.token||message.hostPeer!==this.peer.id||message.guestPeer!==link.connection.peer||message.signaling!==this.signaling()||typeof message.challenge!=='string'||!/^[a-f0-9]{64}$/.test(message.challenge)){this.remove(link,'Host challenge refused.');return;}
    if(this.signing>=4){this.remove(link,'Host proof capacity exceeded. Try again shortly.');return;}
    this.signing++;link.proofState='verifying';
    const binding:HostBinding={room:message.room,token:message.token,hostPeer:message.hostPeer,guestPeer:message.guestPeer,signaling:message.signaling,challenge:message.challenge};
    void signHostProof(this.options.hostIdentity,location.origin,binding).then(proof=>{if(this.stopped||!this.links.has(link.id))return;link.proofState='verified';this.transmit(link,{type:'host-proof',proof},false);}).catch(()=>this.remove(link,'Could not prove the host identity.')).finally(()=>{this.signing--;});return;
   }
   if(link.proofState==='verifying'){this.remove(link,'Wait for the host proof.');return;}
   if(realtime&&message.type!=='input')return;
   this.worker?.postMessage({type:'message',peer:link.id,message});
  }else{
   if(this.options.expectedHost&&link.proofState!=='verified'){
    if(realtime||message.type!=='host-proof'||link.proofState!=='waiting'||!link.challenge){this.remove(link,'Host sent gameplay before proving its identity.');return;}
    link.proofState='verifying';const expected=this.options.expectedHost;
    void verifyHostProof(message.proof,expected.prism,expected.audience,link.challenge,expected.policy).then(()=>{
     if(this.stopped||!this.links.has(link.id))return;
     link.proofState='verified';this.diagnostics.hostVerified=true;this.join(link);
    }).catch(()=>this.remove(link,'Host identity proof refused. This host does not match the public listing.'));return;
   }
   if(realtime&&message.type!=='snapshot')return;
   if(message.type==='error'&&message.code==='peer'){this.fail(message.message);return;}
   if(message.type==='welcome'&&!this.joined){this.joined=true;this.diagnostics.mode='guest';clearTimeout(this.startup);clearTimeout(link.timer);this.resolve();}
   if(this.joined&&['welcome','snapshot','pong','buy-result','error'].includes(message.type))this.options.receive(message);
  }
 }
 private signaling(){const s=this.options.network.signaling;return s?new URL(`${s.secure?'https':'http'}://${s.host}:${s.port}${s.path}`).href:'peerjs-cloud';}
 private join(link:Link){this.transmit(link,{type:'join',token:this.options.invitation.token,name:this.options.name,team:this.options.team},false);}
 private transmit(link:Link,message:unknown,realtime:boolean){
  if(this.stopped)return;
  const fast=link.fast?.readyState==='open'?link.fast:null;
  const channel=realtime&&fast?fast:link.connection.dataChannel;
  if(!channel||channel.readyState!=='open')return;
  if(channel.bufferedAmount>(realtime?64*1024:1024*1024)){
   if(!realtime)this.remove(link,'Peer connection is too slow.');return;
  }
  try{channel.send(JSON.stringify(message));}catch{this.remove(link,'Peer connection closed.');}
 }
 send(message:any){
  if(this.stopped)return;
  if(this.isHost)this.worker?.postMessage({type:'message',peer:'host',message});
  else {const link=this.links.values().next().value;if(link)this.transmit(link,message,message?.type==='input');}
 }
 private async inspectRoute(link:Link){
  try{
   const stats=await link.connection.peerConnection.getStats();let pair:any;
   stats.forEach(s=>{if(s.type==='transport'&&s.selectedCandidatePairId)pair=stats.get(s.selectedCandidatePairId);});
   if(!pair)stats.forEach(s=>{if(s.type==='candidate-pair'&&s.state==='succeeded'&&s.nominated)pair=s;});
   if(pair){const local=stats.get(pair.localCandidateId),remote=stats.get(pair.remoteCandidateId);link.route=local?.candidateType==='relay'||remote?.candidateType==='relay'?'relayed':'direct';}
   this.diagnostics.route=[...this.links.values()].some(l=>l.route==='relayed')?'relayed':link.route;
  }catch{/* Closed connections have no candidate stats. */}
 }
 private remove(link:Link,reason:string){
  if(!this.links.delete(link.id))return;
  clearTimeout(link.timer);link.fast?.close();link.connection.close();this.worker?.postMessage({type:'leave',peer:link.id});this.diagnostics.peers=this.links.size;this.diagnostics.fast=[...this.links.values()].some(l=>l.fast?.readyState==='open');if(!this.links.size)this.diagnostics.route='waiting for guests';
  if(!this.isHost&&!this.stopped)this.fail(reason);
 }
 private fail(reason:string){if(this.stopped)return;this.reject(Error(reason));this.close();this.options.closed(reason);}
 get status(){return {...this.diagnostics,host:this.isHost};}
 close(){
  if(this.stopped)return;this.stopped=true;clearTimeout(this.startup);clearInterval(this.monitor);if(this.reconnect)clearTimeout(this.reconnect);
  this.worker?.terminate();this.worker=null;
  for(const link of this.links.values()){clearTimeout(link.timer);link.fast?.close();link.connection.close();}this.links.clear();this.peer.destroy();
 }
}
