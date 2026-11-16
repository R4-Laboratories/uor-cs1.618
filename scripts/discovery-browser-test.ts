import {chromium,type Page} from 'playwright';
import assert from 'node:assert/strict';
import express from 'express';
import {createServer} from 'node:http';
import {ExpressPeerServer,type IClient} from 'peer';
import {mkdir,writeFile} from 'node:fs/promises';
import {createIdentity} from '../shared/hologram-identity';
import {signListing,encodeListing} from '../shared/match-discovery';
// @ts-expect-error Exercise the unchanged upstream relay at its HTTP boundary.
import {createRelayBus} from '../vendor/stitch/src/prism-id.js';
const app=express(),http=createServer(app),signal=ExpressPeerServer(http,{path:'/',allow_discovery:false}),clients=new Set<IClient>();
signal.on('connection',c=>clients.add(c));signal.on('disconnect',c=>clients.delete(c));app.use('/signal',signal);app.use(express.static('dist'));
await new Promise<void>(r=>http.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${(http.address() as any).port}`;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const events=new Map<string,object[]>(),errors:string[]=[],checks:string[]=[];let posts=0,outage=false;
const ca=await browser.newContext(),cb=await browser.newContext();
for(const context of [ca,cb]){
 await context.addInitScript('Object.defineProperty(document,"hidden",{get:()=>true});');
 // External ntfy HTTP boundary only. Bytes are produced and consumed by the
 // unchanged upstream Stitch framer/reassembler; no directory/signature mock.
 await context.route('https://ntfy.sh/**',async route=>{
  if(outage){await route.fulfill({status:503,body:'offline'});return;}
  const request=route.request(),u=new URL(request.url()),topic=u.pathname.split('/')[1];
  if(request.method()==='POST'){
   const frame=request.postData()!;assert.equal(JSON.parse(frame).v,'stitch/1','Actual Stitch relay framing required');
   const list=events.get(topic)??[];list.push({id:String(++posts),time:Math.floor(Date.now()/1000),event:'message',topic,message:frame});events.set(topic,list);
   await route.fulfill({status:200,body:'{}'});
  }else await route.fulfill({status:200,contentType:'application/x-ndjson',body:(events.get(topic)??[]).map(e=>JSON.stringify(e)).join('\n')+'\n'});
 });
}
const a=await ca.newPage(),b=await cb.newPage();
async function injectSubstitute(invite:string){
 const code=new URLSearchParams(new URL(invite).hash.slice(1)).get('p2p')!,[room,token]=code.split('.');
 const topic='prism-matches:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`cs1618/matches/1 ${url}`))),b=>b.toString(16).padStart(2,'0')).join('');
 const bus=createRelayBus({WebSocket:null,BroadcastChannel:null,fetch:async(address:string,init:RequestInit)=>{
  const name=new URL(address).pathname.slice(1),list=events.get(name)??[];
  assert.equal(JSON.parse(String(init.body)).v,'stitch/1');list.push({id:String(++posts),time:Math.floor(Date.now()/1000),event:'message',topic:name,message:String(init.body)});events.set(name,list);return new Response('{}');
 }});
 try{await bus.publish(topic,encodeListing(await signListing(await createIdentity(),url,{room,token,name:'Substitute host',players:1,capacity:10,map:'meridian',signaling:url+'/signal'})));}finally{bus.close();}
}
for(const p of [a,b]){p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(e.message));}
async function setup(p:Page,name:string){await p.goto(url);await p.waitForSelector('#lobby:not(.hidden)');await p.fill('#name',name);await p.locator('#connection-settings').evaluate((e:HTMLDetailsElement)=>e.open=true);await p.fill('#signaling-server',url+'/signal');await p.fill('#stun-servers','');await p.uncheck('#fill-bots');}
try{
 await setup(a,'Directory host');await setup(b,'Directory guest');
 assert.equal(await a.locator('#room-visibility').inputValue(),'public');
 assert.match((await a.locator('#public-disclosure').textContent())!,/invitation.*public identity/i);
 await a.click('#host-room');await a.waitForFunction(()=>(window as any).cs1618.network.mode==='host');
 await a.waitForFunction(()=>document.querySelector('.publication-state')?.textContent?.includes('acknowledged'));
 assert.ok(posts>0);await b.click('#refresh-matches');await b.locator('[data-discovery-join]').first().waitFor();
 assert.match((await b.locator('#match-list').textContent())!,/Directory host/);
 checks.push('Public default discloses publication; real signed multi-frame Stitch listing crosses isolated contexts');
 await b.locator('[data-discovery-join]').first().click();await b.waitForFunction(()=>(window as any).cs1618.network.mode==='guest');
 await b.waitForFunction(()=>(window as any).cs1618.network.hostVerified===true);await a.waitForFunction(()=>(window as any).cs1618.snapshot.players.length===2);
 checks.push('Discovery pins Prism and completes a fresh host proof before real WebRTC welcome');
 await b.locator('#leave').evaluate((el:HTMLButtonElement)=>el.click());await b.waitForSelector('#lobby:not(.hidden)');
 await injectSubstitute(await a.locator('.invitation-link').first().inputValue());await b.click('#refresh-matches');
 await b.locator('.match-row').filter({hasText:'Substitute host'}).getByRole('button',{name:'JOIN',exact:true}).click();
 await b.waitForFunction(()=>document.querySelector('#lobby-status')?.textContent?.includes('Host identity proof refused'));
 assert.equal(await b.evaluate(()=>(window as any).cs1618.snapshot),null);
 checks.push('A real signed substitute listing cannot authenticate a different live host or deliver a welcome');
 // Rejoin the authentic listing so host departure also covers its guest lifecycle.
 await b.fill('#peer-invite',await a.locator('.invitation-link').first().inputValue());await b.click('#join');await b.waitForFunction(()=>(window as any).cs1618.network.mode==='guest');
 await a.locator('#leave').evaluate((el:HTMLButtonElement)=>el.click());await b.waitForSelector('#lobby:not(.hidden)');
 await b.click('#refresh-matches');await b.waitForFunction(()=>![...document.querySelectorAll('.match-row')].some(e=>e.textContent?.includes('Directory host')));
 checks.push('Normal host close withdraws the signed listing and closes the guest');
 const before=posts;await a.selectOption('#room-visibility','private');await a.click('#host-room');await a.waitForFunction(()=>(window as any).cs1618.network.mode==='host');
 const invite=await a.locator('.invitation-link').first().inputValue();assert.equal(posts,before,'Private hosting must publish nothing');
 await b.fill('#peer-invite',invite);await b.click('#join');await b.waitForFunction(()=>(window as any).cs1618.network.mode==='guest');
 checks.push('Private invitation hosts emit no relay publication and still join over WebRTC');
 await a.locator('#leave').evaluate((el:HTMLButtonElement)=>el.click());await b.waitForSelector('#lobby:not(.hidden)');
 outage=true;await a.selectOption('#room-visibility','public');await a.click('#host-room');await a.waitForFunction(()=>(window as any).cs1618.network.mode==='host');
 await a.waitForFunction(()=>document.querySelector('.publication-state')?.textContent?.includes('unavailable'));
 await b.click('#refresh-matches');await b.waitForFunction(()=>document.querySelector('#directory-status')?.textContent?.includes('unavailable'));
 await b.fill('#peer-invite',await a.locator('.invitation-link').first().inputValue());await b.click('#join');await b.waitForFunction(()=>(window as any).cs1618.network.mode==='guest');
 checks.push('Relay 503 is reported honestly while invitation joins remain available');
 assert.deepEqual(errors,[]);await mkdir('artifacts',{recursive:true});await writeFile('artifacts/discovery-browser.json',JSON.stringify({passed:checks,errors,relayFrames:posts},null,2)+'\n');console.log(checks.join('\n'));
}finally{await browser.close();for(const c of clients)c.getSocket()?.close();await new Promise<void>(r=>http.close(()=>r()));}
process.exit(0);
