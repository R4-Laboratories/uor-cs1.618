import {chromium,type Page} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGameServer} from '../server/index';
const game=await createGameServer({port:0,host:'127.0.0.1'});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const contexts=await Promise.all([0,1].map(()=>browser.newContext({viewport:{width:1100,height:760},deviceScaleFactor:.5})));
// Match the peer-browser transport gate: pause expensive software 3D rendering,
// keeping the real DOM keyboard handlers, RAF input, WebSocket and host tick loop.
for(const context of contexts)await context.addInitScript("localStorage.setItem('cs1618-quality','low');Object.defineProperty(document,'hidden',{get:function(){return true;}});");
const a=await contexts[0].newPage(),d=await contexts[1].newPage(),errors:string[]=[],passed:string[]=[];
for(const page of [a,d]){page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));}
async function join(page:Page,name:string,team:string){console.log('Joining',name);await page.goto(`http://127.0.0.1:${game.port}`,{waitUntil:'domcontentloaded'});await page.waitForSelector('#lobby:not(.hidden)');await page.addStyleTag({content:'#world{visibility:hidden}body{background:#102327}body::after{content:"HUD CHECK · SCENE RENDER PAUSED";position:fixed;top:105px;left:50%;transform:translateX(-50%);color:#9cb9b3;font:11px monospace;z-index:100;pointer-events:none}'});await page.selectOption('#network-mode','server');await page.fill('#name',name);await page.fill('#room','OBJECTIVE');await page.click(`[data-team="${team}"]`);await page.locator('#connection-settings').evaluate((el:any)=>el.open=true);await page.uncheck('#fill-bots');await page.click('#join');await page.waitForSelector('#deploy-overlay:not(.hidden)');console.log('Joined',name);}
async function until(check:()=>boolean){const deadline=Date.now()+5000;while(!check()){if(Date.now()>deadline)throw Error('Host input did not arrive');await new Promise(resolve=>setTimeout(resolve,10));}}
async function deploy(page:Page){await page.bringToFront();if(await page.locator('#deploy-overlay').isVisible())await page.click('#deploy');else if(await page.locator('#pause').isVisible())await page.click('#resume');await page.waitForFunction(()=>(window as any).cs1618.locked);}
try{
 await mkdir('artifacts',{recursive:true});
 await join(a,'Planter','attack');await join(d,'Defuser','defend');
 const match=game.rooms.get('OBJECTIVE')!,pa=[...match.players.values()].find(p=>p.name==='Planter')!,pd=[...match.players.values()].find(p=>p.name==='Defuser')!;
 match.phase='live';match.phaseLeft=90;
 await a.waitForFunction(()=>/PLANT.*A.*B/.test(document.getElementById('context-hint')!.textContent!));
 await d.waitForFunction(()=>/DEFEND/.test(document.getElementById('context-hint')!.textContent!));passed.push('Persistent team-specific site instructions and distance in real client HUD');
 await deploy(a);await a.screenshot({scale:'css',path:'artifacts/hud-sync-repro/objective-carry.png'});await a.keyboard.press('Escape');
 let plants=0;
 async function plant(){
  plants++;
  Object.assign(pa,{x:-16,z:-11,vx:0,vz:0});Object.assign(pd,{x:0,z:-23,vx:0,vz:0});pa.inventory[pa.slot].ammo=0;
  await deploy(a);await a.waitForFunction(()=>document.getElementById('context-hint')!.textContent!.includes('HOLD E TO PLANT'));
  if(plants===1)await a.evaluate("(function(){var el=document.getElementById('objective-text');var descriptor=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');Object.defineProperty(el,'textContent',{configurable:true,get:function(){return descriptor.get.call(el);},set:function(value){setTimeout(function(){descriptor.set.call(el,value);},400);}});})()");
  console.log('Holding plant');await a.keyboard.down('KeyE');await a.waitForFunction(()=>(window as any).cs1618.snapshot.self.progress>.03);
  if(plants===1){const stale=await a.locator('#objective-text').innerText();assert.doesNotMatch(stale,/PLANTING.*s/);console.log('REPRODUCED: positive real snapshot progress with stale HUD label',JSON.stringify(stale));}
  // Snapshot delivery precedes the throttled HUD refresh. Assert the rendered
  // interaction only after the visible DOM catches up to the real input state.
  await a.waitForFunction(()=>(window as any).cs1618.snapshot.self.progress>.03&&!document.getElementById('objective')!.classList.contains('hidden')&&parseFloat(document.getElementById('objective-progress')!.style.width)>0&&/PLANTING.*s/.test(document.getElementById('objective-text')!.textContent??''));
  assert.match(await a.locator('#objective-text').innerText(),/PLANTING.*s/);assert.doesNotMatch(await a.locator('#context-hint').innerText(),/PRESS R/);
  await a.screenshot({scale:'css',path:`artifacts/hud-sync-repro/objective-plant-progress${plants===1?'':'-2'}.png`});
  // Exact3s timing is covered by real-engine unit tests. Advance only fixture
  // progress after observing real E input, so software-RAF stalls cannot flake this HUD gate.
  await until(()=>pa.input.use&&pa.inputAge<.1);pa.progress=.999;pa.action='PLANTING';
  await a.waitForFunction(()=>(window as any).cs1618.snapshot.bomb?.state==='planted');await a.keyboard.up('KeyE');
  assert.equal(match.bomb!.site,'A');assert.ok(match.bomb!.remaining>38);await a.keyboard.press('Escape');
 }
 await plant();console.log('Planted');passed.push('Real keyboard plant progress crosses WebSocket host and outranks empty-magazine hint; host fixture completes plant through normal objective/kernel path');
 Object.assign(pd,{x:-16,z:-11,vx:0,vz:0,kit:true});await deploy(d);await d.keyboard.down('KeyE');
 await d.waitForFunction(()=>(window as any).cs1618.snapshot.self.progress>.03);
 await d.waitForFunction(()=>(window as any).cs1618.snapshot.self.progress>.03&&!document.getElementById('objective')!.classList.contains('hidden')&&parseFloat(document.getElementById('objective-progress')!.style.width)>0&&/DEFUSING.*s/.test(document.getElementById('objective-text')!.textContent??''));
 assert.match(await d.locator('#objective-text').innerText(),/DEFUSING.*s/);
 await d.screenshot({scale:'css',path:'artifacts/hud-sync-repro/objective-defuse-progress.png'});
 await d.keyboard.up('KeyE');await d.waitForFunction(()=>(window as any).cs1618.snapshot.self.progress===0);
 assert.equal(match.phase,'live');await d.keyboard.down('KeyE');await until(()=>pd.input.use&&pd.inputAge<.1);pd.progress=.999;pd.action='DEFUSING';await d.waitForFunction(()=>(window as any).cs1618.snapshot.bomb?.terminal==='defused');await d.keyboard.up('KeyE');
 await d.waitForFunction(()=>document.getElementById('banner-detail')!.textContent==='Device defused');assert.equal(match.winner,'defend');assert.equal(match.score.defend,1);assert.equal(match.events.filter(e=>e.type==='defuse').length,1);passed.push('Real keyboard defuse interruption resets progress; host completion fixture produces exactly one compiled-kernel defender award and HUD result');
 await d.keyboard.press('Escape');await a.waitForFunction(()=>(window as any).cs1618.snapshot.phase==='freeze');match.phase='live';match.phaseLeft=90;
 await plant();await deploy(d);Object.assign(pa,{x:-16,z:-11});Object.assign(pd,{x:0,z:-23});
 await d.waitForFunction(()=>/DEFUSE.*A/.test(document.getElementById('context-hint')!.textContent!));
 match.bomb!.remaining=.1;await d.waitForFunction(()=>(window as any).cs1618.snapshot.bomb?.terminal==='exploded');
 await d.waitForFunction(()=>document.getElementById('banner-detail')!.textContent==='Device detonated');
 assert.equal(match.winner,'attack');assert.equal(match.score.attack,1);assert.equal(pa.alive,false);assert.equal(pd.health,100);assert.equal(match.events.filter(e=>e.type==='explode').length,1);passed.push('Host expiry fixture detonates once, kills nearby planter, spares distant defender and displays compiled-kernel attacker result; exact40s timing is unit-tested');
 assert.deepEqual(errors,[]);await mkdir('artifacts',{recursive:true});await d.screenshot({scale:'css',path:'artifacts/hud-sync-repro/objective-result.png'});await writeFile('artifacts/hud-sync-repro/objective-browser-results.json',JSON.stringify({passed,errors,timing:'Late-progress/expiry host fixtures after real input observations; exact3s/5s/10s/40s lifecycle timings are verified by real-engine unit tests',rendering:'HUD-only: document.hidden override pauses software 3D rendering; normal keyboard, WebSocket and host ticks remain active'},null,2)+'\n');console.log(passed.join('\n'));
}catch(error){console.log('Objective failure',JSON.stringify({host:[...game.rooms.values()].map(m=>({phase:m.phase,bomb:m.bomb,players:[...m.players.values()].map(p=>({id:p.id,x:p.x,y:p.y,z:p.z,progress:p.progress,inputAge:p.inputAge,input:p.input}))})),a:await a.evaluate(()=>({self:(window as any).cs1618?.snapshot?.self,bomb:(window as any).cs1618?.snapshot?.bomb,cameraError:(window as any).cs1618?.cameraError,locked:(window as any).cs1618?.locked,hint:document.getElementById('context-hint')?.textContent})).catch(()=>null)}));throw error;}finally{await browser.close();await game.close();}
