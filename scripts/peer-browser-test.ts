import {chromium,type Page} from 'playwright';
import assert from 'node:assert/strict';
import express from 'express';
import {createServer} from 'node:http';
import {ExpressPeerServer,type IClient} from 'peer';
import {mkdir,writeFile} from 'node:fs/promises';
// Only static files and rendezvous signaling: deliberately no game-server import.
const app=express(),http=createServer(app),signaling=ExpressPeerServer(http,{path:'/',allow_discovery:false});
const signalingClients=new Set<IClient>();signaling.on('connection',c=>signalingClients.add(c));signaling.on('disconnect',c=>signalingClients.delete(c));
let gameServerRequests=0;app.use((req,_res,next)=>{if(req.url.startsWith('/socket'))gameServerRequests++;next();});
app.use('/signal',signaling);app.use(express.static('dist'));
await new Promise<void>(r=>http.listen(0,'127.0.0.1',r));
const port=(http.address() as {port:number}).port,url=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const errors:string[]=[],gamePacketsInSignaling:string[]=[],checks:string[]=[];
const hostContext=await browser.newContext(),guestContext=await browser.newContext();
// Networking checks do not spend CPU drawing two 3D scenes. The separate gameplay
// browser suite tests real rendering; this changes no networking or simulation code.
for(const context of [hostContext,guestContext])await context.addInitScript('Object.defineProperty(document,"hidden",{get:function(){return true;}});');
const a=await hostContext.newPage(),b=await guestContext.newPage();
for(const page of [a,b]){
 page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 page.on('websocket',ws=>{const inspect=(frame:{payload:string|Buffer})=>{try{const p=JSON.parse(String(frame.payload));if(['input','snapshot','buy','chat'].includes(p.type))gamePacketsInSignaling.push(p.type);}catch{}};ws.on('framesent',inspect);ws.on('framereceived',inspect);});
}
async function setup(page:Page,name:string,team:string){
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForSelector('#lobby:not(.hidden)');
 await page.selectOption('#room-visibility','private');await page.fill('#name',name);await page.click(`[data-team="${team}"]`);
 await page.locator('#connection-settings').evaluate((e:HTMLDetailsElement)=>e.open=true);
 await page.fill('#signaling-server',`${url}/signal`);await page.fill('#stun-servers','');await page.uncheck('#fill-bots');
}
const state=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.stringify((window as any).cs1618)));
try{
 console.log('Opening static-only browser host');await setup(a,'Host','attack');await a.click('#host-room');
 await a.waitForFunction(()=>(window as any).cs1618.network.mode==='host');
 const invite=await a.locator('.invitation-link').first().inputValue();assert.ok(invite.includes('#p2p='));
 console.log('Checking invitation rejection');await setup(b,'Guest','defend');
 const bad=invite.slice(0,-1)+(invite.endsWith('0')?'1':'0');await b.fill('#peer-invite',bad);await b.click('#join');
 await b.waitForFunction(()=>document.querySelector('#lobby-status')?.textContent?.includes('Invalid invitation'));
 assert.equal((await state(a)).snapshot.players.length,1);checks.push('Wrong invitation is rejected before joining or evicting a bot');
 console.log('Joining real WebRTC connection');await b.fill('#peer-invite',invite);await b.click('#join');
 await b.waitForFunction(()=>(window as any).cs1618.network.mode==='guest');
 await a.waitForFunction(()=>(window as any).cs1618.snapshot.players.length===2);
 await b.waitForFunction(()=>(window as any).cs1618.network.fast);
 assert.notEqual((await state(a)).snapshot.self.id,(await state(b)).snapshot.self.id);
 checks.push('Isolated browser contexts join the same worker-hosted match with a real unordered WebRTC channel');
 await b.click('#deploy');await b.waitForFunction(()=>(window as any).cs1618.locked);
 await b.keyboard.press('KeyB');await b.waitForSelector('#buy-menu:not(.hidden)');await b.click('[data-buy="kit"]');
 await b.waitForFunction(()=>(window as any).cs1618.snapshot.self.kit===true);
 assert.equal((await state(b)).snapshot.self.money,400);await b.click('#close-buy');
 checks.push('Guest purchase is applied by the host and deducts the authoritative price');
 console.log('Testing input and remote snapshots');await b.waitForFunction(()=>(window as any).cs1618.snapshot.phase==='live');
 const before=(await state(b)).snapshot.self;
 await b.keyboard.down('KeyW');await b.waitForTimeout(600);await b.keyboard.up('KeyW');
 await a.waitForFunction(({id,z})=>Math.abs((window as any).cs1618.snapshot.players.find((p:any)=>p.id===id).z-z)>.3,{id:before.id,z:before.z});
 checks.push('Guest input moves its authoritative player and reaches the host snapshot');
 const tick=(await state(b)).snapshot.tick;
 for(const client of signalingClients)client.getSocket()?.close();
 await b.waitForFunction(t=>(window as any).cs1618.snapshot.tick>t+30,tick);
 checks.push('Established gameplay continues when signaling sockets disconnect');
 console.log('Testing reliable in-game chat and shortcut settings');
 await b.keyboard.press('KeyY');await b.locator('#chat-input').fill('Private squad message');
 await b.keyboard.press('Enter');await b.locator('#chat-feed .chat-line').filter({hasText:'Private squad message'}).waitFor({state:'attached'});
 await b.keyboard.press('KeyT');await b.locator('#chat-input').fill('Everyone sees <b>literal text</b>');
 await b.keyboard.press('Enter');await a.locator('#chat-feed .chat-line').filter({hasText:'Everyone sees <b>literal text</b>'}).waitFor({state:'attached'});
 assert.equal(await a.locator('#chat-feed .chat-line').filter({hasText:'Private squad message'}).count(),0);
 assert.equal(await a.locator('#chat-feed b').filter({hasText:'literal text'}).count(),0);
 await b.keyboard.press('KeyT');await b.locator('#chat-input').fill('Discard this draft');
 await b.keyboard.press('Escape');await b.locator('#chat-input').waitFor({state:'hidden'});
 assert.equal(await b.locator('#pause').isVisible(),false);
 assert.equal(await b.locator('#chat-feed').getByText('Discard this draft').count(),0);
 await b.keyboard.press('Escape');await b.locator('#chat-key-all').selectOption('KeyH');await b.click('#resume');
 await b.keyboard.press('KeyT');assert.equal(await b.locator('#chat-input').isVisible(),false);
 await b.keyboard.press('KeyH');await b.locator('#chat-input').fill('New shortcut works');
 await b.keyboard.press('Enter');await a.locator('#chat-feed .chat-line').filter({hasText:'New shortcut works'}).waitFor({state:'attached'});
 checks.push('A live WebRTC guest can send all-chat, keep team chat private, cancel a draft and rebind T without pausing');
 assert.equal(gameServerRequests,0);assert.deepEqual(gamePacketsInSignaling,[]);
 checks.push('No dedicated game-server endpoint or gameplay payload through signaling');
 console.log('Testing host departure');await a.close();
 await b.waitForSelector('#lobby:not(.hidden)');assert.equal((await state(b)).snapshot,null);
 checks.push('Host departure closes the match and restores a usable guest lobby');
 await b.reload({waitUntil:'domcontentloaded'});await b.waitForSelector('#lobby:not(.hidden)');
 assert.equal(await b.locator('#chat-key-all').inputValue(),'KeyH');
 assert.equal(await b.locator('#chat-feed .chat-line').count(),0);
 checks.push('Chat key settings survive reload, while room messages stay in the previous match');
 assert.deepEqual(errors,[]);checks.push('No uncaught browser errors');
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/peer-browser-results.json',JSON.stringify({passed:checks,errors},null,2)+'\n');console.log(checks.join('\n'));
}catch(error){console.error('Peer failure',JSON.stringify({lobbyA:await a.locator('#lobby-status').textContent(),lobbyB:await b.locator('#lobby-status').textContent(),a:await state(a).catch(()=>null),b:await state(b).catch(()=>null)}));throw error;}
finally{await browser.close();for(const client of signalingClients)client.getSocket()?.close();await new Promise<void>(r=>http.close(()=>r()));}
// PeerServer 1.0.2 retains internal recurring maintenance timers without exposing
// a shutdown API. Browser and HTTP resources are closed above; failures throw
// before reaching this successful CLI exit.
process.exit(0);
