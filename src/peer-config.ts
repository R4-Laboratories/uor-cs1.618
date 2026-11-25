export interface Invitation {room:string;token:string;}
export interface NetworkFields {stun:string;turn:string;username:string;credential:string;relay:boolean;signaling:string;}
export interface NetworkConfig {ice:RTCConfiguration;signaling?:{host:string;port:number;path:string;secure:boolean;};}
export const DEFAULT_STUN='stun:stun.l.google.com:19302, stun:stun.cloudflare.com:3478';
export {GAME_PROTOCOL as PEER_PROTOCOL} from '../shared/protocol';
export function newInvitation():Invitation{
 const hex=(n:number)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),v=>v.toString(16).padStart(2,'0')).join('');
 return {room:hex(6),token:hex(16)};
}
export function parseInvitation(value:string):Invitation{
 let text=value.trim();if(/^https?:\/\//.test(text))text=new URLSearchParams(new URL(text).hash.slice(1)).get('p2p')??'';
 const [room,token,...rest]=text.split('.');
 if(rest.length||!room||!token||! /^[a-f0-9]{12}$/.test(room)||!/^[a-f0-9]{32}$/.test(token))throw Error('Paste the complete browser-room invitation link or code.');
 return {room,token};
}
export function invitationUrl(invite:Invitation,base:string){const url=new URL(base);url.search='';url.hash=new URLSearchParams({p2p:`${invite.room}.${invite.token}`}).toString();return url.href;}
export function networkConfig(fields:NetworkFields):NetworkConfig{
 const iceServers:RTCIceServer[]=[];
 const list=(value:string)=>value.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean);
 const stun=list(fields.stun),turn=list(fields.turn);
 if(stun.some(s=>!/^stuns?:[^\s/]+$/i.test(s)))throw Error('STUN addresses must start with stun: or stuns:.');
 if(turn.some(s=>!/^turns?:[^\s/]+$/i.test(s)))throw Error('TURN addresses must start with turn: or turns:.');
 if(stun.length)iceServers.push({urls:stun});
 if(turn.length){if(!fields.username.trim()||!fields.credential)throw Error('Enter the TURN username and credential supplied by your relay provider.');iceServers.push({urls:turn,username:fields.username.trim(),credential:fields.credential});}
 if(fields.relay&&!turn.length)throw Error('Relay-only mode requires a configured TURN server.');
 let signaling:NetworkConfig['signaling'];
 if(fields.signaling.trim()){
  const url=new URL(fields.signaling.trim());if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('Use an http(s) PeerServer URL without credentials, query or fragment.');
  signaling={host:url.hostname,port:Number(url.port||(url.protocol==='https:'?443:80)),path:url.pathname,secure:url.protocol==='https:'};
 }
 return {ice:{iceServers,iceTransportPolicy:fields.relay?'relay':'all'},signaling};
}
