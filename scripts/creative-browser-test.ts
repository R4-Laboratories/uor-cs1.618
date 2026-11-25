import {chromium} from 'playwright';
import {preview} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import surfaces from '../model/studio-render-surfaces.json';
const server=process.env.CREATIVE_URL?null:await preview({preview:{port:0,host:'127.0.0.1'}});
const url=process.env.CREATIVE_URL??`http://127.0.0.1:${(server!.httpServer.address() as {port:number}).port}/`;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 await mkdir('artifacts/creative',{recursive:true});const page=await browser.newPage({viewport:{width:1280,height:900}});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'evolution-studio.html');await page.waitForFunction(()=>(window as any).creativeStudio);
 const inspector = page.locator('#material-inspector[data-state="ready"]');
 await inspector.waitFor();
 const surface = inspector.getByLabel('Surface', {exact: true});
 const listed = await surface.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value));
 assert.deepEqual(listed.sort(), Object.keys(surfaces).sort());
 assert.equal(await inspector.getAttribute('data-staged-textures'), '6');
 const initialSample = await inspector.locator('canvas').screenshot();
 const comparison = await inspector.locator('output').nth(1).innerText();
 await surface.selectOption('copper');
 assert.equal(await inspector.locator('output').first().innerText(),
  `Roughness ${surfaces.copper.specular_roughness.toFixed(2)} · Metalness ${surfaces.copper.base_metalness.toFixed(2)}`);
 assert.equal(await inspector.locator('output').nth(1).innerText(), comparison);
 assert(!(await inspector.locator('canvas').screenshot()).equals(initialSample));
 await inspector.screenshot({path:'artifacts/creative/material-inspector.png'});
 const first=await page.locator('#site-a').evaluate((c:any)=>c.toDataURL());const program=await page.evaluate(()=>(window as any).creativeStudio.art);
 await page.check('#original');const original=await page.locator('#site-a').evaluate((c:any)=>c.toDataURL());if(program.shapes.length)assert.notEqual(first,original);await page.uncheck('#original');assert.equal(await page.locator('#site-a').evaluate((c:any)=>c.toDataURL()),first);
 await page.screenshot({path:'artifacts/creative/studio-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'artifacts/creative/studio-mobile.png',fullPage:true});
 await page.goto(url+'evolution-lab.html');await page.waitForFunction(()=>(window as any).evolutionLab?.ready);
 const result=await page.evaluate(()=>{const lab=(window as any).evolutionLab,layer=lab.world.artwork;const before=layer.panels.map((p:any)=>p.visible);const rejected=layer.apply({...lab.artProgram,ink:'url(https://invalid)'});const after=layer.panels.map((p:any)=>p.visible);layer.setEnabled(false);const disabled=layer.panels.every((p:any)=>!p.visible);layer.setEnabled(true);const restored=layer.panels.map((p:any)=>p.visible);const bad=lab.measureArt({...lab.artProgram,ink:lab.artProgram.background});return {before,rejected,after,disabled,restored,contrast:bad.textures.map((t:any)=>t.contrast)};});
 assert.equal(result.rejected,false);assert.deepEqual(result.before,result.after);assert.ok(result.disabled);assert.deepEqual(result.before,result.restored);assert.ok(result.contrast.every((n:number)=>n<4.5));assert.deepEqual(errors,[]);
 const evidence={url,checks:['Studio displays bundled programs','Material inspector stages six roughness tiles and independently renders selected finishes','Original/evolved mural toggle is reversible','Mobile layout fits viewport','Invalid artwork preserves scene','Artwork disable restores baseline visibility','Unreadable lettering fails contrast threshold'],errors};await writeFile('artifacts/creative/browser-results.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence.checks.join('\n'));
}finally{await browser.close();if(server)await new Promise<void>(r=>server.httpServer.close(()=>r()));}
