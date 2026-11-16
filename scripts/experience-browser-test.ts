import {chromium} from 'playwright';
import {preview} from 'vite';
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
 for(const weapon of ['sidearm','kestrel','m4','smg','scout']){const rows=sound.rows.filter((r:any)=>r.weapon===weapon);assert(rows[1].right<rows[0].right);}
 assert(sound.stress.peak<1);assert.equal(sound.stress.ended,sound.stress.voices);
 const voices=await page.evaluate(()=>(window as any).experienceLab.stressVoices());assert(voices.high<=voices.limit);assert.equal(voices.after,0);
 const render=await page.evaluate(()=>{const world=(window as any).evolutionLab.world;world.setQuality('low');const low=world.renderer.getPixelRatio();const count=world.scene.children.length;world.setQuality('native');const native=world.renderer.getPixelRatio();return {low,native,count,after:world.scene.children.length};});
 assert(Math.abs(render.low/render.native-.7)<.001);assert.equal(render.count,render.after);
 await page.goto(url);await page.waitForFunction(()=>(window as any).cs1618);
 await page.locator('#render-quality').selectOption('low',{force:true});
 await page.locator('#volume').evaluate((el:any)=>{el.value='.25';el.dispatchEvent(new Event('input'));});
 await page.reload();await page.waitForFunction(()=>(window as any).cs1618?.quality.mode==='low');assert.equal(await page.locator('#volume').inputValue(),'.25'.replace(/^\./,'0.'));
 await page.setViewportSize({width:390,height:844});
 const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);assert(fits,'Mobile page overflows');
 assert.deepEqual(errors,[]);await mkdir('artifacts/experience',{recursive:true});await writeFile('artifacts/experience/browser-results.json',JSON.stringify({url,sound,voices,render,settingsPersist:true,mobileFits:fits,errors},null,2)+'\n');console.log('Experience browser: waveform, occlusion, stereo, cleanup, voice budget, render modes and persisted settings passed.');
}finally{await browser.close();if(server)await new Promise<void>(resolve=>server.httpServer.close(()=>resolve()));}
