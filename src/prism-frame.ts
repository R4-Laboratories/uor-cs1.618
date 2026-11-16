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
export const frameReady=(async()=>{
 const response=await fetch(`${import.meta.env.BASE_URL}prism-frame/frame.mjs`);if(!response.ok)throw Error('Prism frame unavailable');const bytes=await response.arrayBuffer();
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');if(sha!==pin.sha256)throw Error('Prism frame integrity mismatch');
 const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));try{await import(/* @vite-ignore */url);}finally{URL.revokeObjectURL(url);}
 return frame;
})();
frameReady.catch(()=>{notice.textContent='Prism bar unavailable · identity details';frame.setAttribute('data-error','frame');});
export const policyReady=(async()=>{
 const response=await fetch(`${import.meta.env.BASE_URL}app.holo`);if(!response.ok)throw Error('Identity Holo unavailable');const bytes=new Uint8Array(await response.arrayBuffer()),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');if(digest!==policyPin.sha256)throw Error('Identity Holo differs from pinned build');const policy=await HologramPolicy.load(bytes);
 const result=await policy.application.acceptance();if(!('archiveFingerprint'in policy.application.identities))throw Error('Not a Holo archive');frame.setAttribute('fingerprint',policy.application.identities.archiveFingerprint);frame.setAttribute('examples',`${result.passed}/${result.total}`);frame.setAttribute('verdict','good');frame.setAttribute('verdict-label','Identity component bytes and examples checked');return policy;
})();
policyReady.catch(()=>{frame.setAttribute('verdict','bad');frame.setAttribute('verdict-label','Identity component could not be checked');});
