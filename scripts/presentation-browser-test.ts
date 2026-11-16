import {chromium} from 'playwright';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const baseline=process.env.PRESENTATION_BASELINE==='1',out='artifacts/presentation';
await mkdir(out,{recursive:true});
const server=await createServer({server:{port:0,host:'127.0.0.1'},plugins:[{name:'presentation-fixture',configureServer(s){s.middlewares.use('/presentation-fixture',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><body><canvas id="world"></canvas><div id="app"></div></body></html>');});}}]});
await server.listen();const url=server.resolvedUrls!.local[0];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:760}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'presentation-fixture');
 await page.evaluate(`(async()=>{
 await import('/src/style.css');const {WorldView}=await import('/src/world.ts'),{UI}=await import('/src/ui.ts'),{createEngine}=await import('/shared/engine.ts'),{WEAPONS}=await import('/shared/config.ts');
 const world=new WorldView(document.querySelector('canvas'),{preserveDrawingBuffer:true});world.setEngine(await createEngine(await (await fetch('/wasm/cs_verdant.wasm')).arrayBuffer()));world.setQuality('native');
 const ui=new UI();ui.show('loading',false);ui.show('hud',true);
 const self={id:'p',name:'Operator',team:'attack',alive:true,x:-21,y:0,z:16,vx:0,vy:0,vz:0,grounded:true,crouch:false,yaw:0,pitch:0,weapon:'sidearm',kills:0,deaths:0,bot:false,health:100,armor:100,money:4200,kit:false,inventory:[{id:'kestrel',ammo:30,reserve:90},{id:'sidearm',ammo:15,reserve:60}],slot:1,reloadLeft:0,progress:0,action:'',seq:1,recoil:0};
 const snapshot={type:'snapshot',time:20,tick:1200,room:'MERIDIAN',phase:'live',round:3,remaining:95,score:{attack:1,defend:1},players:[self],self,bomb:{state:'carried',carrier:'p',x:-21,y:0,z:16,site:null,remaining:40},events:[],winner:null,reason:''};
 window.fixture={world,ui,snapshot,draw(){const gun=snapshot.self.inventory[1];if(gun.id!==snapshot.self.weapon){const config=WEAPONS[snapshot.self.weapon];Object.assign(gun,{id:config.id,ammo:config.mag,reserve:config.reserve});}world.render(.1,snapshot,snapshot.self,snapshot.self.yaw,snapshot.self.pitch,false,null,true);ui.update(snapshot,snapshot.self,0,null);}};
 })()`);
 await page.waitForFunction(()=>(window as any).fixture.world.hd.diagnostics.status==='ready');
 const prefix=baseline?'before':'after';
 for(const weapon of ['sidearm','kestrel','m4','smg','scout']){
  await page.evaluate(weapon=>{const f=(window as any).fixture;f.snapshot.self.weapon=weapon;for(let i=0;i<5;i++)f.draw();},weapon);
  await page.screenshot({path:`${out}/${prefix}-${weapon}.png`});
 }
 await page.evaluate(()=>{const f=(window as any).fixture,s=f.snapshot;s.self.x=-17;s.self.z=-8;s.self.pitch=-.28;s.self.weapon='sidearm';s.bomb={state:'planted',carrier:null,x:-16,y:0,z:-12,site:'A',remaining:17};f.draw();});
 await page.screenshot({path:`${out}/${prefix}-site.png`});
 if(!baseline){
  const result=await page.evaluate(()=>{const f=(window as any).fixture,w=f.world,s=f.snapshot;const before=w.bomb.rotation.y;f.draw();const stable=before===w.bomb.rotation.y;s.bomb.terminal='defused';f.draw();const terminalHidden=!w.bomb.visible;s.bomb=null;f.draw();w.setQuality('low');const low=w.renderer.getPixelRatio();f.draw();s.self.weapon='m4';f.draw();const geometries=w.renderer.info.memory.geometries;for(let i=0;i<12;i++){s.self.weapon=i%2?'m4':'scout';f.draw();}const after=w.renderer.info.memory.geometries;f.ui.event({id:1,type:'kill',target:'p',text:'Device blast'},s);f.ui.update(s,s.self,0,null);return {stable,terminalHidden,geometries,after,low,killfeed:document.getElementById('kill-feed')!.textContent,hidden:document.hidden};});
  assert(result.stable);assert(result.terminalHidden);assert(!result.hidden);assert.equal(result.after,result.geometries);assert.match(result.killfeed!,/Bomb blast/);assert.doesNotMatch(result.killfeed!,/Operator.*Operator/);
  await page.waitForFunction(()=>(window as any).fixture.world.hd.diagnostics.lod===0&&(window as any).fixture.world.hd.diagnostics.status==='ready');
  await page.evaluate(()=>(window as any).fixture.draw());await page.screenshot({path:`${out}/after-performance.png`});
  const feedback=await page.evaluate(()=>{const f=(window as any).fixture,s=f.snapshot,w=f.world;const rest=w.gun.rotation.z;s.self.reloadLeft=1.1;s.self.inventory[1].ammo=1;f.draw();return {rest,reload:w.gun.rotation.z};});assert(Math.abs(feedback.reload-feedback.rest)>.2);
  await page.screenshot({path:`${out}/after-reload.png`});
  const switchFeedback=await page.evaluate(()=>{const f=(window as any).fixture;f.snapshot.self.reloadLeft=0;f.snapshot.self.weapon='sidearm';f.draw();return f.world.gun.position.y;});assert(switchFeedback<-.3);
  await page.screenshot({path:`${out}/after-switch.png`});
  await page.goto(url);await page.waitForFunction(()=>(window as any).cs1618);await page.setViewportSize({width:390,height:844});
  const mobile=await page.evaluate(()=>{document.documentElement.style.setProperty('--dim','#000');document.documentElement.style.setProperty('--mint','#000');return {fits:document.documentElement.scrollWidth<=innerWidth,label:getComputedStyle(document.querySelector('label')!).color};});assert(mobile.fits);assert.equal(mobile.label,'rgb(156, 174, 172)');await page.screenshot({path:`${out}/after-mobile-lobby.png`});

  await writeFile(`${out}/browser-results.json`,JSON.stringify({result,feedback,switchFeedback,mobile,errors,renderer:'Chromium SwiftShader; real scene render, fixed snapshot fixtures, no hidden override'},null,2));
 }
 assert.deepEqual(errors,[]);console.log(`Presentation ${prefix}: rendered screenshots captured; zero page errors.`);
}finally{await browser.close();await server.close();}
