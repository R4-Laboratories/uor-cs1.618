import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

const base='https://r4-laboratories.github.io/uor-cs1.618/';
const expected=process.argv[2];
assert.match(expected??'',/^[0-9a-f]{40}$/);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:760},deviceScaleFactor:.5});
const errors=[],failedAssets=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)failedAssets.push({url:response.url(),status:response.status()});});
page.setDefaultTimeout(45000);
await page.addInitScript(()=>localStorage.setItem('cs1618-quality','low'));
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#lobby:not(.hidden)');
 const build=await page.evaluate(async()=>await(await fetch('./build.json',{cache:'no-store'})).json());
 assert.equal(build.commit,expected);
 await page.fill('#name','Release check');
 await page.click('#practice');
 await page.waitForSelector('#deploy-overlay:not(.hidden)');
 await page.click('#deploy');
 await page.waitForFunction(()=>window.cs1618?.locked&&window.cs1618.snapshot?.phase==='live'&&window.cs1618.hd?.status==='ready');
 const state=await page.evaluate(()=>{
  const s=window.cs1618;
  return {room:s.snapshot.room,phase:s.snapshot.phase,tick:s.snapshot.tick,players:s.snapshot.players.length,engine:s.engine,network:s.network,hd:s.hd.status,quality:s.quality,hidden:document.hidden,canvas:{width:document.querySelector('#world').width,height:document.querySelector('#world').height}};
 });
 assert.equal(state.room,'PRACTICE');assert.equal(state.network.mode,'practice');assert.equal(state.players,10);assert.equal(state.hidden,false);assert(state.tick>0);assert(state.canvas.width>0);assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);
 await page.screenshot({path:'artifacts/experience-refresh/live-practice.png',scale:'css'});
 await writeFile('artifacts/experience-refresh/live-pages.json',JSON.stringify({url:base,build,state,errors,failedAssets,observedAt:new Date().toISOString(),scope:'Actual published origin and local practice worker; real rendered scene, no snapshot mutation or hidden override. Chromium SwiftShader Performance mode at deviceScaleFactor0.5; not a multiplayer/NAT or physical-GPU benchmark.'},null,2)+'\n');
 console.log('Published origin: expected build,10-player live practice, rendered scene and zero page/asset errors.');
}finally{await browser.close();}
