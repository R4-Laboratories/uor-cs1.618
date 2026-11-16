import {signIdentity,verifyIdentity,type IdentityProof,MAX_IDENTITY_BYTES} from './hologram-identity';
import type {HologramPolicy} from './hologram-policy';
export const MATCH_LEASE_MS=45000, MATCH_REFRESH_MS=20000;
export const MATCH_PROTOCOL='cs1618-v2', DIRECTORY_CHALLENGE='cs1618/matches/1';
export interface MatchFields {room:string;token:string;name:string;players:number;capacity:number;map:'meridian';signaling:string;}
export interface MatchListing extends MatchFields {kind:'cs1618/match/1';protocol:typeof MATCH_PROTOCOL;visibility:'public';at:number;expires:number;withdrawn:boolean;prism:string;}
export interface HostBinding {room:string;token:string;hostPeer:string;guestPeer:string;signaling:string;challenge:string;}
const encoder=new TextEncoder();
/** Public discovery permits PeerJS Cloud or a same-origin PeerServer. Never follow arbitrary relay-supplied endpoints. */
export function supportedSignaling(value:unknown,audience:string):value is string {
 if(value==='peerjs-cloud')return true;
 if(typeof value!=='string'||value.length>512)return false;
 try{const u=new URL(value);return u.origin===audience&&!u.username&&!u.password&&!u.search&&!u.hash&&u.href===value;}catch{return false;}
}
function invitation(p:any){return /^[a-f0-9]{12}$/.test(p?.room)&&/^[a-f0-9]{32}$/.test(p?.token);}
function fresh(at:unknown,expires:unknown,now:number,duration:number){return Number.isSafeInteger(at)&&Number.isSafeInteger(expires)&&(at as number)<=now+2000&&(at as number)>=now-duration&&(expires as number)>now&&(expires as number)<=(at as number)+duration;}
function listingShape(p:any,audience:string,now:number):boolean {
 return !!p&&Object.keys(p).sort().join(',')==='at,capacity,expires,kind,map,name,players,protocol,room,signaling,token,visibility,withdrawn'&&p.kind==='cs1618/match/1'&&p.protocol===MATCH_PROTOCOL&&p.visibility==='public'&&typeof p.withdrawn==='boolean'&&invitation(p)&&p.map==='meridian'&&typeof p.name==='string'&&p.name.length>0&&p.name.length<=32&&Number.isInteger(p.players)&&p.players>=1&&p.players<=10&&p.capacity===10&&supportedSignaling(p.signaling,audience)&&fresh(p.at,p.expires,now,MATCH_LEASE_MS);
}
export async function signListing(session:any,audience:string,fields:MatchFields,now=Date.now(),withdrawn=false):Promise<IdentityProof>{
 const {room,token,name,players,capacity,map,signaling}=fields;
 const payload={kind:'cs1618/match/1',protocol:MATCH_PROTOCOL,visibility:'public',room,token,name,players,capacity,map,signaling,at:now,expires:now+MATCH_LEASE_MS,withdrawn};
 if(!listingShape(payload,audience,now))throw Error('Unsupported public listing or signaling endpoint. Use PeerJS Cloud, a same-origin PeerServer, or a private invitation.');
 return signIdentity(session,audience,DIRECTORY_CHALLENGE,payload,now);
}
/** Bounded local view of signed leases. Tombstones survive until all older leases expire. */
export class MatchRecords {
 private entries=new Map<string,{at:number;expires:number;listing:MatchListing|null}>();
 private pending=0;
 constructor(readonly audience:string,private policy:HologramPolicy){}
 list(now=Date.now()):MatchListing[]{this.prune(now);return [...this.entries.values()].flatMap(e=>e.listing?[structuredClone(e.listing)]:[]).slice(0,64);}
 private prune(now:number){for(const [key,e] of this.entries)if(e.expires<=now)this.entries.delete(key);}
 async accept(bytes:Uint8Array,now=Date.now()):Promise<boolean>{
  if(bytes.byteLength>MAX_IDENTITY_BYTES||this.pending>=4)return false;
  this.pending++;
  try{
   const proof=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as IdentityProof,p=proof?.envelope?.body?.payload?.payload;
   if(!listingShape(p,this.audience,now)||proof.envelope.body.at!==p.at)return false;
   await verifyIdentity(proof,this.audience,DIRECTORY_CHALLENGE,now,new Set());
   // Each observation comes from the checks above: exact audience, lease,
   // upstream signature, and signed public publication intent.
   if(!await this.policy.admits({origin:proof.envelope.body.audience===this.audience,fresh:fresh(p.at,p.expires,now,MATCH_LEASE_MS),signature:true,consent:p.visibility==='public'}))return false;
   this.prune(now);const key=`${proof.prism}/${p.room}`,previous=this.entries.get(key);
   if(previous&&previous.at>=p.at)return false;
   if(!previous&&(this.entries.size>=128||(!p.withdrawn&&this.list(now).length>=64)))return false;
   this.entries.set(key,{at:p.at,expires:p.expires,listing:p.withdrawn?null:{...p,prism:proof.prism}});return true;
  }catch{return false;}finally{this.pending--;}
 }
}
export async function signHostProof(session:any,audience:string,binding:HostBinding,now=Date.now()){
 return signIdentity(session,audience,binding.challenge,{kind:'cs1618/live-host/1',...binding,at:now,expires:now+15000},now);
}
export async function verifyHostProof(proof:IdentityProof,prism:string,audience:string,binding:HostBinding,policy:HologramPolicy,now=Date.now()){
 if(proof?.prism!==prism)throw Error('Host identity does not match the public listing.');
 const p=proof.envelope?.body?.payload?.payload;
 if(!p||Object.keys(p).sort().join(',')!=='at,challenge,expires,guestPeer,hostPeer,kind,room,signaling,token'||p.kind!=='cs1618/live-host/1'||!invitation(p)||Object.entries(binding).some(([k,v])=>p[k]!==v)||!fresh(p.at,p.expires,now,15000)||p.at!==proof.envelope.body.at)throw Error('Host proof does not bind this fresh invitation and transport challenge.');
 await verifyIdentity(proof,audience,binding.challenge,now,new Set());
 if(!await policy.admits({origin:proof.envelope.body.audience===audience,fresh:fresh(p.at,p.expires,now,15000),signature:true,consent:proof.prism===prism}))throw Error('Identity Holo refused the host proof.');
}
export const encodeListing=(proof:IdentityProof)=>encoder.encode(JSON.stringify(proof));
