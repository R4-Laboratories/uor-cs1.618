import {chromium,type Page} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGameServer} from '../server/index';
const game=await createGameServer({port:0,host:'127.0.0.1'});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const errors:string[]=[];const results:string[]=[];
const context=await browser.newContext({viewport:{width:1100,height:760},deviceScaleFactor:1});
const a=await context.newPage(),b=await context.newPage();
for(const page of [a,b]){page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));}
const state=(page:Page)=>page.evaluate(()=>JSON.parse(JSON.stringify((window as any).cs1618)));
const ready=async(page:Page,name:string,team:string)=>{
 await page.goto(`http://127.0.0.1:${game.port}`,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#lobby:not(.hidden)');
 await page.fill('#name',name);await page.fill('#room','BROWSER');await page.click(`[data-team="${team}"]`);await page.locator('#connection-settings').evaluate((e:any)=>e.open=true);await page.uncheck('#fill-bots');await page.click('#join');await page.waitForSelector('#deploy-overlay:not(.hidden)');
};
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
 await a.waitForFunction(()=>(window as any).cs1618.snapshot.phase==='live');await a.keyboard.down('KeyW');await a.waitForTimeout(900);await a.keyboard.up('KeyW');
 const moved=await state(a);assert.ok(moved.snapshot.self.z<22,`Expected motion, got ${moved.snapshot.self.z}`);await b.waitForFunction(id=>(window as any).cs1618.snapshot.players.find((p:any)=>p.id===id).z<22,pa.id);results.push('WASD movement appears on both independently rendered clients');
 console.log('Testing combat');Object.assign(pa,{x:0,z:20,vx:0,vz:0,recoil:0,cooldown:0});Object.assign(pb,{x:0,z:16,vx:0,vz:0,health:100});
 await a.waitForTimeout(300);await a.mouse.move(550,380);const aiming=await state(a);await a.mouse.move(550+aiming.yaw/.002,380+aiming.pitch/.002);await a.waitForTimeout(150);console.log('Aim',JSON.stringify({yaw:(await state(a)).yaw,pitch:(await state(a)).pitch,locked:(await state(a)).locked,weapon:pa.inventory[pa.slot].id}));await a.dispatchEvent('#world','mousedown',{button:0});await a.waitForTimeout(800);await a.dispatchEvent('#world','mouseup',{button:0});
 console.log('Combat result',JSON.stringify({ammo:pa.inventory[pa.slot].ammo,health:pb.health,yaw:pa.yaw,pitch:pa.pitch,phase:room.phase,events:room.events.slice(-5)}));await b.waitForFunction(()=>(window as any).cs1618.snapshot.self.health<100);assert.ok(pb.health<100);results.push('Mouse fire consumes server ammo and damages the remote opponent');
 await a.keyboard.press('Tab');await a.waitForTimeout(150);await a.keyboard.down('Tab');await a.waitForSelector('#scoreboard:not(.hidden)');await a.screenshot({path:'artifacts/multiplayer-scoreboard.png',timeout:20000});await a.keyboard.up('Tab');
 await a.screenshot({path:'artifacts/multiplayer.png',timeout:20000});
 await a.keyboard.press('Escape');await a.waitForSelector('#pause:not(.hidden)');await a.click('#leave');await a.waitForSelector('#lobby:not(.hidden)');
 await a.screenshot({path:'artifacts/lobby.png',timeout:20000});results.push('Escape menu and leaving a room restore the lobby');
 console.log('Testing standalone practice');await a.click('#practice');await a.waitForSelector('#deploy-overlay:not(.hidden)');await a.waitForFunction(()=>(window as any).cs1618.snapshot?.players.length===10);await a.click('#deploy');await a.waitForTimeout(300);assert.equal((await state(a)).snapshot.room,'PRACTICE');results.push('Static browser practice starts ten-player simulation without a WebSocket connection');
 await a.screenshot({path:'artifacts/practice.png',timeout:20000});
 assert.deepEqual(errors,[]);results.push('No uncaught browser errors across online and local gameplay');
 await writeFile('artifacts/browser-results.json',JSON.stringify({passed:results,errors},null,2)+'\n');console.log(results.join('\n'));
}catch(error){console.error('Failure state',JSON.stringify({a:await state(a).catch(()=>null),b:await state(b).catch(()=>null)}));throw error;}finally{await browser.close();await game.close();}
