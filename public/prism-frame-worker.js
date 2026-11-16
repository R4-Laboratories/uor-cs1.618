// Application-scoped delivery of two exact published immutable dependencies.
// No navigation interception, general proxy, Cache API, or application update cache.
import {assets,assetVersion} from './prism-frame-assets.mjs';
export function assetTarget(request,scope){
 if(request.method!=='GET')return null;
 const asset=assets.find(candidate=>candidate.url===request.url);
 return asset?{...asset,href:new URL(asset.path,scope).href}:null;
}
export async function serveAsset(target,fetcher=fetch){
 const abort=new AbortController(),deadline=setTimeout(()=>abort.abort(),8000);
 try{
  const response=await fetcher(target.href,{cache:'no-store',signal:abort.signal});
  if(!response.ok)throw Error('Mirror unavailable');
  const bytes=await response.arrayBuffer();
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  if(bytes.byteLength!==target.bytes||sha!==target.sha256)throw Error('Mirror integrity mismatch');
  return new Response(bytes,{headers:{'Content-Type':'text/javascript','Cache-Control':'no-store'}});
 }catch{return new Response('Pinned Prism dependency unavailable or altered',{status:502});}finally{abort.abort();clearTimeout(deadline);}
}
if(typeof self!=='undefined'&&'registration'in self){
 self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
 self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
 self.addEventListener('message',event=>{if(event.data==='prism-frame-assets-version')event.ports[0]?.postMessage(assetVersion);});
 self.addEventListener('fetch',event=>{const target=assetTarget(event.request,self.registration.scope);if(target)event.respondWith(serveAsset(target));});
}
