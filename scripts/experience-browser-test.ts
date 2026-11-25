import {chromium} from 'playwright';
import {preview} from 'vite';
import {WEAPONS} from '../shared/config';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const server=process.env.EXPERIENCE_URL?null:await preview({preview:{port:0,host:'127.0.0.1'}});
const url=process.env.EXPERIENCE_URL??`http://127.0.0.1:${(server!.httpServer.address() as {port:number}).port}/`;
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'evolution-lab.html');await page.waitForFunction(()=>(window as any).experienceLab);
 const sound=await page.evaluate(()=>(window as any).experienceLab.measureAudio());
 for(const row of sound.rows){assert(row.peak>0&&row.peak<1);assert(row.right>row.left*3);assert(row.tail<1e-9);assert.equal(row.ended,1);}
 for(const weapon of Object.keys(WEAPONS)){const rows=sound.rows.filter((r:any)=>r.weapon===weapon);assert.equal(rows.length,2);assert(rows[1].right<rows[0].right);}
 assert(sound.stress.peak<1);assert.equal(sound.stress.ended,sound.stress.voices);
 const voices=await page.evaluate(()=>(window as any).experienceLab.stressVoices());assert(voices.high<=voices.limit);assert.equal(voices.after,0);
 const render=await page.evaluate(()=>{const world=(window as any).evolutionLab.world;world.setQuality('low');const low=world.renderer.getPixelRatio();const count=world.scene.children.length;world.setQuality('native');const native=world.renderer.getPixelRatio();return {low,native,count,after:world.scene.children.length};});
 assert(Math.abs(render.low/render.native-.7)<.001);assert.equal(render.count,render.after);
 // A stale unversioned engine can lack newly required exports. Production must bypass it.
 let staleEngineHits=0;
 await page.route(u=>u.pathname.endsWith('/wasm/cs_verdant.wasm')&&!u.search,route=>{staleEngineHits++;return route.fulfill({status:200,contentType:'application/wasm',body:Buffer.from([0,97,115,109,1,0,0,0])});});
 await page.goto(url);await page.waitForFunction(()=>(window as any).cs1618);
 await page.waitForFunction(()=>(window as any).cs1618.hd?.status==='ready');
 await page.locator('#render-quality').selectOption('native',{force:true});
 await page.waitForFunction(()=>(window as any).cs1618.hd?.lod===4&&(window as any).cs1618.hd.status==='ready');
 assert.equal(staleEngineHits,0,'Both main and HD worker must load the digest-addressed engine');
 const hd4=await page.evaluate(()=>(window as any).cs1618.hd);
 await mkdir('artifacts/experience',{recursive:true});await page.screenshot({path:'artifacts/experience/verdant-hd4.png'});
 await page.locator('#render-quality').selectOption('low',{force:true});
 await page.waitForFunction(()=>(window as any).cs1618.hd?.lod===0&&(window as any).cs1618.hd.status==='ready');
 const hd0=await page.evaluate(()=>(window as any).cs1618.hd);assert(hd4.triangles>hd0.triangles*2);assert(hd0.triangles>100);

 await page.click('#practice');await page.waitForSelector('#deploy-overlay:not(.hidden)');await page.click('#deploy');
 await page.waitForFunction(()=>(window as any).cs1618.cameraGuard?.guarded);
 await page.locator('#render-quality').selectOption('native',{force:true});
 await page.waitForFunction(()=>(window as any).cs1618.hd?.lod===4&&(window as any).cs1618.hd.status==='ready');
 await page.evaluate(()=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:0,movementY:-100,bubbles:true})));
 await page.screenshot({path:'artifacts/experience/verdant-play-hd4.png'});
 await page.locator('#render-quality').selectOption('low',{force:true});
 const seqBefore=await page.evaluate(()=>(window as any).cs1618.snapshot.self.seq);
 await page.setViewportSize({width:1200,height:1});await page.waitForFunction(()=>!!(window as any).cs1618.cameraError);
 await page.setViewportSize({width:960,height:640});
 await page.waitForFunction(seq=>{const s=(window as any).cs1618;return !s.cameraError&&s.cameraGuard?.guarded&&s.snapshot.self.seq>seq;},seqBefore);
 await page.keyboard.press('Escape');
 await page.locator('#volume').evaluate((el:any)=>{el.value='.25';el.dispatchEvent(new Event('input'));});
 await page.reload();await page.waitForFunction(()=>(window as any).cs1618?.quality.mode==='low');assert.equal(await page.locator('#volume').inputValue(),'.25'.replace(/^\./,'0.'));
 await page.setViewportSize({width:390,height:844});
 const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);assert(fits,'Mobile page overflows');
 assert.deepEqual(errors,[]);await mkdir('artifacts/experience',{recursive:true});await writeFile('artifacts/experience/browser-results.json',JSON.stringify({url,sound,voices,render,hd:{hd0,hd4},cameraResizeRecovery:true,staleEngineCacheBypassed:staleEngineHits===0,settingsPersist:true,mobileFits:fits,errors},null,2)+'\n');console.log('Experience browser: waveform, occlusion, stereo, cleanup, voice budget, render modes and persisted settings passed.');
}finally{await browser.close();if(server)await new Promise<void>(resolve=>server.httpServer.close(()=>resolve()));}
