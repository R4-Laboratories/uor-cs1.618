// @ts-expect-error Byte-pinned upstream JS intentionally has no local declarations.
import {createRelayBus} from '../vendor/stitch/src/prism-id.js';
import {MatchRecords,signListing,encodeListing,MATCH_REFRESH_MS,type MatchFields} from '../shared/match-discovery';
import type {HologramPolicy} from '../shared/hologram-policy';
interface Options {audience:string;policy:HologramPolicy;changed:()=>void;status:(message:string)=>void;publication?:(message:string)=>void;fetch?:typeof fetch;}
interface Publication {session:any;fields:()=>MatchFields;at:number;}
/** Polling uses upstream retained/framing; HTTP errors are surfaced before its empty-result fallback. */
export class MatchDirectory {
 private records:MatchRecords;
 private bus:ReturnType<typeof createRelayBus>;
 private topic='';private closed=false;private active=false;private refreshing=false;
 private poll:ReturnType<typeof setInterval>|null=null;private lease:ReturnType<typeof setInterval>|null=null;
 private host:Publication|null=null;private publishing:Promise<void>|null=null;
 private requests=new Set<AbortController>();
 constructor(private options:Options){
  this.records=new MatchRecords(options.audience,options.policy);
  this.bus=createRelayBus({WebSocket:null,BroadcastChannel:null,fetch:async(url:string,init:RequestInit={})=>{
   const controller=new AbortController();this.requests.add(controller);const timeout=setTimeout(()=>controller.abort(),8000);
   try{
    const response=await (options.fetch??globalThis.fetch.bind(globalThis))(url,{...init,signal:controller.signal,keepalive:init.method==='POST'});
    if(!response.ok){void response.body?.cancel();throw Error('Stitch relay unavailable');}
    // Bound the response while reading, not after an untrusted text allocation.
    const reader=response.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
    if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024){await reader.cancel();throw Error('Stitch relay response too large');}chunks.push(value);}
    return new Response(new Blob(chunks as BlobPart[]),{status:200});
   }finally{clearTimeout(timeout);this.requests.delete(controller);}
  }});
 }
 get listings(){return this.records.list();}
 async start(){
  if(this.active||this.closed)return;this.active=true;
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`cs1618/matches/1 ${this.options.audience}`));
  this.topic='prism-matches:'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  if(this.closed)return;
  this.poll=setInterval(()=>{this.options.changed();void this.refresh();},10000);
  this.lease=setInterval(()=>void this.publish(),MATCH_REFRESH_MS);await this.refresh();
 }
 async refresh(){
  if(!this.topic||this.closed||this.refreshing)return;this.refreshing=true;
  try{
   const retained:Uint8Array[]=await this.bus.retained(this.topic);
   if(this.closed)return;
   // The upstream response/reassembly is bounded too; cap our crypto work per poll.
   for(const bytes of retained.slice(-256)){if(this.closed)break;await this.records.accept(bytes);}
   if(!this.closed){this.options.changed();this.options.status('Stitch relay checked. Listings expire within 45 seconds; availability is not guaranteed.');}
  }catch{if(!this.closed)this.options.status('Stitch directory unavailable. Retry refresh or use a private invitation.');}
  finally{this.refreshing=false;}
 }
 async publishHost(session:any,fields:()=>MatchFields){
  await this.stopHosting();if(this.closed)throw Error('Directory closed');
  this.host={session,fields,at:0};await this.publish();
 }
 private async publish(){
  if(!this.host||this.closed||this.publishing)return;
  const held=this.host;
  this.publishing=(async()=>{
   try{
    held.at=Math.max(Date.now(),held.at+1);
    const proof=await signListing(held.session,this.options.audience,held.fields(),held.at);
    const acknowledged=await this.bus.publish(this.topic,encodeListing(proof));
    if(this.host!==held||this.closed)return;
    if(!acknowledged)throw Error('Not acknowledged');
    await this.records.accept(encodeListing(proof));this.options.changed();
    this.options.publication?.('Public listing acknowledged by Stitch relay. This is not a delivery guarantee.');
   }catch{if(this.host===held&&!this.closed)this.options.publication?.('Public listing unavailable. Share the invitation directly or retry from the lobby.');}
  })();
  try{await this.publishing;}finally{this.publishing=null;}
 }
 async stopHosting(){
  const held=this.host;this.host=null;if(!held)return;
  await this.publishing;
  try{
   const proof=await signListing(held.session,this.options.audience,held.fields(),Math.max(Date.now(),held.at+1),true);
   await this.records.accept(encodeListing(proof));this.options.changed();
   if(!await this.bus.publish(this.topic,encodeListing(proof)))throw Error('Not acknowledged');
  }catch{this.options.status('Withdrawal unavailable; the last public listing expires within 45 seconds.');}
 }
 async stop(){
  if(this.closed)return;
  if(this.poll)clearInterval(this.poll);if(this.lease)clearInterval(this.lease);
  await this.stopHosting();this.closed=true;for(const request of this.requests)request.abort();this.bus.close();
 }
}
