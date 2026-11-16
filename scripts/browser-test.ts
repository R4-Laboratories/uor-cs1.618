import {chromium,type Page} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGameServer} from '../server/index';
const game=await createGameServer({port:0,host:'127.0.0.1'});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const errors:string[]=[];const results:string[]=[];
// Keep both clients fully rendered, but bound software-GPU load with the real
// Performance setting. Native HD/render fidelity has separate browser gates.
const context=await browser.newContext({viewport:{width:1100,height:760},deviceScaleFactor:.5});
await context.addInitScript("localStorage.setItem('cs1618-quality','low');");
const a=await context.newPage(),b=await context.newPage();
for(const page of [a,b]){page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));}
const state=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.stringify((window as any).cs1618)));
const ready=async(page:Page,name:string,team:string)=>{
 await page.goto(`http://127.0.0.1:${game.port}`,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#lobby:not(.hidden)');
 await page.selectOption('#network-mode','server');await page.fill('#name',name);await page.fill('#room','BROWSER');await page.click(`[data-team="${team}"]`);await page.locator('#connection-settings').evaluate((e:any)=>e.open=true);await page.uncheck('#fill-bots');await page.click('#join');await page.waitForSelector('#deploy-overlay:not(.hidden)');
};
const aimForward=async(page:Page)=>{
 // Pointer lock consumes relative deltas. Absolute Playwright cursor coordinates
 // can be rebased by Chromium on CI; establish this fixture through the real
 // input handler, then require both the client and authoritative host to agree.
 await page.evaluate(()=>{
  const before=(window as any).cs1618;
  if(!before.locked)throw Error('Aim fixture requires pointer lock');
  document.dispatchEvent(new MouseEvent('mousemove',{movementX:125,movementY:75,bubbles:true}));
  const turned=(window as any).cs1618,expected=Math.atan2(Math.sin(before.yaw-.25),Math.cos(before.yaw-.25));
  if(Math.abs(turned.yaw-expected)>1e-6)throw Error('Relative mouse input did not turn the camera');
  document.dispatchEvent(new MouseEvent('mousemove',{movementX:Math.round(turned.yaw/.002),movementY:Math.round(turned.pitch/.002),bubbles:true}));
 });
 await page.waitForFunction(()=>{const s=(window as any).cs1618;return Math.abs(s.yaw)<.003&&Math.abs(s.pitch)<.003&&Math.abs(s.snapshot.self.yaw)<.003&&Math.abs(s.snapshot.self.pitch)<.003;});

};
const rendering='Both clients render real scenes; Performance mode, 1100x760 CSS viewport, deviceScaleFactor 0.5; no hidden override';

try{
 await mkdir('artifacts',{recursive:true});
 console.log('Opening first client');await ready(a,'Aster','attack');
 console.log('Opening second client');await ready(b,'Beryl','defend');
 const room=game.rooms.get('BROWSER')!;assert.equal(room.players.size,2);room.phaseLeft=120;
 const pa=[...room.players.values()].find(p=>p.name==='Aster')!,pb=[...room.players.values()].find(p=>p.name==='Beryl')!;
 pa.money=5000;
 await a.bringToFront();await a.click('#deploy');await a.waitForFunction(()=>(window as any).cs1618.locked);
 await a.keyboard.press('KeyB');await a.waitForSelector('#buy-menu:not(.hidden)');await a.click('[data-buy="kestrel"]');await a.waitForFunction(()=>(window as any).cs1618.snapshot.self.inventory[0].id==='kestrel');
 await a.click('#close-buy');await a.waitForFunction(()=>(window as any).cs1618.locked);
 await a.waitForFunction(()=>(window as any).cs1618.snapshot.self.weapon==='kestrel');assert.equal(pa.money,2300);results.push('Browser buy menu equips a server-issued rifle and deducts the exact price');
 console.log('Testing locomotion');room.phase='live';room.phaseLeft=100;
 Object.assign(pa,{x:0,z:23,vx:0,vz:0});Object.assign(pb,{x:20,z:-18,vx:0,vz:0});
 await Promise.all([
  a.waitForFunction(()=>{const s=(window as any).cs1618.snapshot;return s.phase==='live'&&Math.abs(s.self.x)<.01&&Math.abs(s.self.z-23)<.01;}),
  b.waitForFunction(id=>{const s=(window as any).cs1618.snapshot,p=s.players.find((p:any)=>p.id===id);return s.phase==='live'&&Math.abs(p.x)<.01&&Math.abs(p.z-23)<.01&&Math.abs(s.self.x-20)<.01&&Math.abs(s.self.z+18)<.01;},pa.id),
 ]);
 await aimForward(a);assert(Math.abs(pa.yaw)<.003&&Math.abs(pa.pitch)<.003);results.push('Relative pointer-lock aiming reaches the authoritative host before axis-specific locomotion');
 let releaseSeq=pa.acceptedSeq;await a.keyboard.down('KeyW');
 try{await Promise.all([
  a.waitForFunction(()=>(window as any).cs1618.snapshot.self.z<22,undefined,{timeout:30000}),
  b.waitForFunction(id=>(window as any).cs1618.snapshot.players.find((p:any)=>p.id===id).z<22,pa.id,{timeout:30000}),
 ]);}finally{releaseSeq=pa.acceptedSeq;await a.keyboard.up('KeyW');}
 // Observe a real queued neutral packet becoming the host's processed input.
 // Matching object identity excludes synthetic stale-input fallback, even if
 // another packet has just reset inputAge. This only reads host state.
 const queuedNeutral=new Set<typeof pa.input>();let neutralSeq=0;
 const releaseDeadline=Date.now()+30000;
 while(Date.now()<releaseDeadline){
  for(const input of pa.queue)if(input.seq>releaseSeq&&input.forward===0&&input.strafe===0)queuedNeutral.add(input);
  if(queuedNeutral.has(pa.input)&&pa.processedSeq===pa.input.seq)neutralSeq=pa.processedSeq;
  for(const input of queuedNeutral)if(input.seq<=pa.processedSeq)queuedNeutral.delete(input);
  if(neutralSeq>releaseSeq&&pa.input.forward===0&&pa.input.strafe===0&&!pa.queue.some(input=>input.forward!==0||input.strafe!==0)&&Math.hypot(pa.vx,pa.vz)<.001)break;
  await new Promise(resolve=>setTimeout(resolve,5));
 }
 assert(neutralSeq>releaseSeq&&pa.input.forward===0&&pa.input.strafe===0&&!pa.queue.some(input=>input.forward!==0||input.strafe!==0)&&Math.hypot(pa.vx,pa.vz)<.001,'Host must process real keyup movement before combat teleport');
 console.log('Movement release',JSON.stringify({releaseSeq,neutralSeq,processedSeq:pa.processedSeq,forward:pa.input.forward,strafe:pa.input.strafe,queuedMoving:pa.queue.filter(input=>input.forward!==0||input.strafe!==0).length,speed:Math.hypot(pa.vx,pa.vz)}));
 results.push('Real released movement input is processed and settled before combat teleport');
 const moved=await state(a);assert.equal(moved.quality.mode,'low');assert(await a.evaluate(()=>!document.hidden));assert(await b.evaluate(()=>!document.hidden));assert.ok(moved.snapshot.self.z<22,`Expected motion, got ${moved.snapshot.self.z}`);await b.waitForFunction(id=>(window as any).cs1618.snapshot.players.find((p:any)=>p.id===id).z<22,pa.id);results.push('WASD movement appears on both independently rendered clients');
 console.log('Testing combat');Object.assign(pa,{x:0,z:20,vx:0,vz:0,recoil:0,cooldown:0});Object.assign(pb,{x:0,z:16,vx:0,vz:0,health:100});
 await Promise.all([
  a.waitForFunction(()=>{const s=(window as any).cs1618.snapshot;return Math.abs(s.self.x)<.01&&Math.abs(s.self.z-20)<.01&&s.players.some((p:any)=>p.name==='Beryl'&&Math.abs(p.x)<.01&&Math.abs(p.z-16)<.01);}),
  b.waitForFunction(()=>{const s=(window as any).cs1618.snapshot;return s.self.health===100&&Math.abs(s.self.x)<.01&&Math.abs(s.self.z-16)<.01&&s.players.some((p:any)=>p.name==='Aster'&&Math.abs(p.x)<.01&&Math.abs(p.z-20)<.01);}),
 ]);
 await aimForward(a);
 results.push('Relative pointer-lock aiming reaches the authoritative host before combat');
 await a.waitForFunction(()=>(window as any).cs1618.hd?.status==='ready'&&(window as any).cs1618.cameraGuard?.guarded);
 const guard=(await state(a)).cameraGuard;assert(guard.clearance>=guard.guard);results.push('HD worker scenery and triangle-guarded camera are active in multiplayer');
 await a.waitForFunction(()=>(window as any).cs1618.characters?.joints===22&&(window as any).cs1618.characters.poseUpdates>1);await a.screenshot({path:'artifacts/verdant-operator.png',timeout:20000});results.push('Upstream Verdant 22-joint operators render and animate in multiplayer');console.log('Aim',JSON.stringify({yaw:(await state(a)).yaw,pitch:(await state(a)).pitch,locked:(await state(a)).locked,weapon:pa.inventory[pa.slot].id}));const ammoBefore=pa.inventory[pa.slot].ammo;await a.dispatchEvent('#world','mousedown',{button:0});
 try{await b.waitForFunction(()=>(window as any).cs1618.snapshot.self.health<100,undefined,{timeout:30000});}finally{await a.dispatchEvent('#world','mouseup',{button:0});}
 assert(pa.inventory[pa.slot].ammo<ammoBefore,'Real mouse fire must consume authoritative ammunition');
 console.log('Combat result',JSON.stringify({ammo:pa.inventory[pa.slot].ammo,health:pb.health,yaw:pa.yaw,pitch:pa.pitch,phase:room.phase,events:room.events.slice(-5)}));await b.waitForFunction(()=>(window as any).cs1618.snapshot.self.health<100);assert.ok(pb.health<100);results.push('Mouse fire consumes server ammo and damages the remote opponent');
 await a.keyboard.press('Tab');await a.waitForTimeout(150);await a.keyboard.down('Tab');await a.waitForSelector('#scoreboard:not(.hidden)');await a.screenshot({path:'artifacts/multiplayer-scoreboard.png',timeout:20000});await a.keyboard.up('Tab');
 await a.screenshot({path:'artifacts/multiplayer.png',timeout:20000});
 await a.keyboard.press('Escape');await a.waitForSelector('#pause:not(.hidden)');await a.click('#leave');await a.waitForSelector('#lobby:not(.hidden)');
 await a.screenshot({path:'artifacts/lobby.png',timeout:20000});await a.waitForFunction(()=>(window as any).cs1618.characters.actors===0);results.push('Escape menu and leaving a room restore the lobby and release character slots');
 console.log('Testing standalone practice');await a.click('#practice');await a.waitForSelector('#deploy-overlay:not(.hidden)');await a.waitForFunction(()=>(window as any).cs1618.snapshot?.players.length===10);await a.click('#deploy');await a.waitForTimeout(300);assert.equal((await state(a)).snapshot.room,'PRACTICE');results.push('Static browser practice starts ten-player simulation without a WebSocket connection');
 await a.waitForFunction(()=>(window as any).cs1618.characters.actors===10);await a.screenshot({path:'artifacts/practice.png',timeout:20000});
 assert.deepEqual(errors,[]);results.push('No uncaught browser errors across online and local gameplay');
 await writeFile('artifacts/browser-results.json',JSON.stringify({passed:results,errors,rendering},null,2)+'\n');console.log(results.join('\n'));
}catch(error){
 // Persist the failure before querying a potentially stalled renderer. CI must
 // have a receipt even when readiness or the first gameplay assertion fails.
 const receipt={status:'failed',passed:results,errors,error:error instanceof Error?{name:error.name,message:error.message,stack:error.stack}:String(error),rendering};
 await writeFile('artifacts/browser-results.json',JSON.stringify(receipt,null,2)+'\n');
 const failureState={a:await state(a).catch(()=>null),b:await state(b).catch(()=>null)};console.error('Failure state',JSON.stringify(failureState));
 const failureUI=[];
 for(const page of [a,b]){const diagnostic=await page.evaluate(()=>({status:document.querySelector('#lobby-status')?.textContent,focused:document.hasFocus(),active:document.activeElement?.id,locked:document.pointerLockElement?.id,scoreboard:document.querySelector('#scoreboard')?.className,scoreboardDisplay:document.querySelector('#scoreboard')?getComputedStyle(document.querySelector('#scoreboard')!).display:null,hidden:document.hidden})).catch(()=>null);failureUI.push(diagnostic);console.error('Failure UI',diagnostic);}
 await writeFile('artifacts/browser-results.json',JSON.stringify({...receipt,failureState,failureUI},null,2)+'\n');throw error;
}finally{await browser.close();await game.close();}
