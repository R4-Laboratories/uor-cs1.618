import pin from '../model/prism-frame.json';
import policyPin from '../model/hologram-policy.json';
import {HologramPolicy} from '../shared/hologram-policy';
export const frame=document.createElement('prism-frame');
frame.id='prism-frame';
for(const [key,value]of Object.entries({name:'cs1.618',address:'cs1.618',live:'https://r4-laboratories.github.io/uor-cs1.618/',repo:'https://github.com/R4-Laboratories/uor-cs1.618',identity:'./identity.html',purpose:'Original Verdant-powered browser tactical multiplayer FPS',verdict:'wait','verdict-label':'Checking identity component',proof:'Identity handoff requires all four admission observations; this is not a proof of the whole game.'}))frame.setAttribute(key,value);
document.body.prepend(frame);
// The shared bar wraps on narrow screens; retain its height while gameplay hides it.
new ResizeObserver(([entry])=>{const height=entry.borderBoxSize?.[0]?.blockSize??frame.getBoundingClientRect().height;if(height>0)document.documentElement.style.setProperty('--cs-prism-height',`${height}px`);}).observe(frame);
const notice=document.createElement('span');notice.slot='status';notice.textContent='Identity & app details';notice.addEventListener('click',()=>location.assign('./identity.html'));frame.append(notice);
// Preserve the published frame byte-for-byte while closing its immutable
// dependency set locally. Only this application's exact dependency GETs route.
async function prepareFrameAssets(){
 if(!window.isSecureContext||!navigator.serviceWorker)throw Error('Verified frame assets require a secure service-worker context');
 const base=new URL(import.meta.env.BASE_URL,document.baseURI),workerUrl=new URL('prism-frame-worker.js',base);
 const version=pin.dependencies.map(asset=>asset.sha256).join(':');
 await new Promise<void>((resolve,reject)=>{
  let finished=false;const ports=new Set<MessagePort>();
  const finish=(error?:Error)=>{if(finished)return;finished=true;clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',check);for(const port of ports)port.close();error?reject(error):resolve();};
  const check=()=>{const controller=navigator.serviceWorker.controller;if(finished||controller?.scriptURL!==workerUrl.href)return;const channel=new MessageChannel();ports.add(channel.port1);channel.port1.onmessage=event=>{ports.delete(channel.port1);channel.port1.close();if(event.data===version)finish();};controller.postMessage('prism-frame-assets-version',[channel.port2]);};
  const timer=setTimeout(()=>finish(Error('Verified frame asset delivery did not become ready')),10000);
  navigator.serviceWorker.addEventListener('controllerchange',check);
  void (async()=>{
   const existing=await navigator.serviceWorker.getRegistration(base.href);
   if(existing?.scope===base.href&&[existing.active,existing.waiting,existing.installing].some(worker=>worker&&worker.scriptURL!==workerUrl.href))throw Error('An unrelated service worker already owns this application scope');
   await navigator.serviceWorker.register(workerUrl,{scope:base.href,type:'module',updateViaCache:'none'});check();
  })().catch(error=>finish(error instanceof Error?error:Error(String(error))));
 });
 const abort=new AbortController(),deadline=setTimeout(()=>abort.abort(),10000);
 try{await Promise.all(pin.dependencies.map(async asset=>{
  const response=await fetch(asset.url,{signal:abort.signal});if(!response.ok)throw Error('Verified frame dependency unavailable');
  const bytes=await response.arrayBuffer(),sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  if(bytes.byteLength!==asset.bytes||sha!==asset.sha256)throw Error('Verified frame dependency integrity mismatch');
 }));}finally{abort.abort();clearTimeout(deadline);}
 frame.dataset.assets='verified';
}
export const frameReady=(async()=>{
 await prepareFrameAssets();
 const response=await fetch(`${import.meta.env.BASE_URL}prism-frame/frame.mjs`);if(!response.ok)throw Error('Prism frame unavailable');const bytes=await response.arrayBuffer();
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');if(sha!==pin.sha256)throw Error('Prism frame integrity mismatch');
 const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));try{await import(/* @vite-ignore */url);}finally{URL.revokeObjectURL(url);}
 return frame;
})();
frameReady.catch(()=>{notice.textContent='Verified Prism bar unavailable · identity details';frame.setAttribute('data-error','frame');frame.setAttribute('aria-disabled','true');});
export const policyReady=(async()=>{
 const response=await fetch(`${import.meta.env.BASE_URL}app.holo`);if(!response.ok)throw Error('Identity Holo unavailable');const bytes=new Uint8Array(await response.arrayBuffer()),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');if(digest!==policyPin.sha256)throw Error('Identity Holo differs from pinned build');const policy=await HologramPolicy.load(bytes);
 const result=await policy.application.acceptance();if(!('archiveFingerprint'in policy.application.identities))throw Error('Not a Holo archive');frame.setAttribute('fingerprint',policy.application.identities.archiveFingerprint);frame.setAttribute('examples',`${result.passed}/${result.total}`);frame.setAttribute('verdict','good');frame.setAttribute('verdict-label','Identity component bytes and examples checked');return policy;
})();
policyReady.catch(()=>{frame.setAttribute('verdict','bad');frame.setAttribute('verdict-label','Identity component could not be checked');});
