import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createIdentity} from '../shared/hologram-identity';
import {HologramPolicy} from '../shared/hologram-policy';
const path='../src/match-directory.ts',directory:any=await import(path).catch(()=>({}));
test('real Stitch relay HTTP framing publishes, discovers, withdraws and reports service failure',async()=>{
 assert.equal(typeof directory.MatchDirectory,'function','Stitch match relay adapter is not implemented');
 const policy=await HologramPolicy.load(readFileSync('public/app.holo')),host=await createIdentity();
 const frames:string[]=[],status:string[]=[];let down=false;
 const fetchRelay:typeof fetch=async (url,init)=>{
  assert.match(String(url),/^https:\/\/ntfy.sh\/prism-[0-9a-f]+/);
  if(down)return new Response('offline',{status:503});
  if(init?.method==='POST'){
   const frame=JSON.parse(String(init.body));assert.equal(frame.v,'stitch/1');assert.equal(frame.p,'warm');assert.ok(frame.x);frames.push(String(init.body));return new Response('{}');
  }
  return new Response(frames.map(message=>JSON.stringify({event:'message',message})).join('\n'));
 };
 const a=new directory.MatchDirectory({audience:'https://game.example',policy,fetch:fetchRelay,changed:()=>{},status:(s:string)=>status.push(s)});
 const b=new directory.MatchDirectory({audience:'https://game.example',policy,fetch:fetchRelay,changed:()=>{},status:(s:string)=>status.push(s)});
 try{
  await a.start();await b.start();
  await a.publishHost(host,()=>({room:'012345abcdef',token:'1'.repeat(32),name:'Host',players:1,capacity:10,map:'meridian',signaling:'peerjs-cloud'}));
  await b.refresh();assert.equal(b.listings[0].prism,host.prism);assert.ok(frames.length>1,'Full public records must use actual chunk framing');
  await a.stopHosting();await b.refresh();assert.equal(b.listings.length,0);
  down=true;await b.refresh();assert.match(status.at(-1)!,/unavailable/i);
 }finally{await a.stop();await b.stop();}
});
test('stop and stopHosting synchronously cancel queued or signing publications before relay writes',async()=>{
 const [{runInNewContext},ts,discovery,stitch]=await Promise.all([
  import('node:vm'),import('typescript'),import('../shared/match-discovery'),
  // @ts-expect-error Unchanged upstream JS is the real framed transport.
  import('../vendor/stitch/src/prism-id.js'),
 ]);
 const compiled=ts.default.transpileModule(readFileSync('src/match-directory.ts','utf8'),{compilerOptions:{target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.CommonJS}}).outputText;
 const policy=await HologramPolicy.load(readFileSync('public/app.holo')),host=await createIdentity();
 const fields=()=>({room:'012345abcdef',token:'1'.repeat(32),name:'Host',players:1,capacity:10,map:'meridian',signaling:'peerjs-cloud'});
 for(const method of ['stop','stopHosting'] as const)for(const phase of ['queued','signing']){
  let release!:()=>void,entered!:()=>void,posts=0;const held=new Promise<void>(r=>release=r),signing=new Promise<void>(r=>entered=r),intervals=new Set<()=>void>();
  const exports:Record<string,any>={};
  runInNewContext(compiled,{exports,require:(name:string)=>name.includes('prism-id')?stitch:{...discovery,signListing:async(...args:Parameters<typeof discovery.signListing>)=>{entered();await held;return discovery.signListing(...args);}},crypto,TextEncoder,TextDecoder,URL,Response,Blob,AbortController,Uint8Array,setTimeout,clearTimeout,setInterval:(fn:()=>void)=>{intervals.add(fn);return fn;},clearInterval:(fn:()=>void)=>intervals.delete(fn)});
  const d=new exports.MatchDirectory({audience:'https://game.example',policy,changed:()=>{},status:()=>{},fetch:async(_url:string,init:RequestInit)=>{if(init.method==='POST')posts++;return new Response('');}});
  try{
   await d.start();const publication=d.publishHost(host,fields);
   if(phase==='signing')await signing;
   const stopped=d[method]();release();await Promise.all([publication,stopped]);
   for(const callback of intervals)callback();await new Promise(r=>setImmediate(r));
   assert.equal(posts,0,`${method} must cancel ${phase} listing without a relay POST or later refresh`);
  }finally{release();await d.stop();}
 }
});
