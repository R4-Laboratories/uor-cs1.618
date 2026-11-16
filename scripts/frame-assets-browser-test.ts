import {chromium,type Page} from 'playwright';
import {preview} from 'vite';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import pin from '../model/prism-frame.json';
await mkdir('artifacts',{recursive:true});
const corrupt=Buffer.from(await readFile('public/'+pin.dependencies[0].path));corrupt[100]^=1;
const server=await preview({preview:{port:0,host:'127.0.0.1'},plugins:[{name:'frame-failure-fixtures',configurePreviewServer(s){s.middlewares.use((req,res,next)=>{
 const url=req.url??'';
 if(url==='/corrupt/'+pin.dependencies[0].path){res.setHeader('Content-Type','text/javascript');res.end(corrupt);return;}
 if(url==='/unavailable/prism-frame-worker.js'){res.statusCode=503;res.end('Worker unavailable fixture');return;}
 if(url==='/foreign/seed.html'){res.setHeader('Content-Type','text/html');res.end('<title>Other application worker fixture</title>');return;}
 if(url==='/foreign/foreign-worker.js'){res.setHeader('Content-Type','text/javascript');res.end("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));");return;}
 for(const prefix of ['/corrupt/','/unavailable/','/foreign/'])if(url.startsWith(prefix)){req.url='/'+url.slice(prefix.length);break;}next();
 });}}]});
const origin=`http://127.0.0.1:${(server.httpServer.address() as {port:number}).port}`;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results:unknown[]=[],errors:string[]=[],network:unknown[]=[];let current:Page|null=null,stage='start';
try{
 for(const mode of ['corrupt','unavailable','foreign']){
  stage=mode;const context=await browser.newContext(),page=await context.newPage();current=page;page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>network.push({mode,url:r.url(),status:r.status(),serviceWorker:r.fromServiceWorker()}));
  if(mode==='foreign'){
   await page.goto(origin+'/foreign/seed.html');await page.evaluate(async()=>{await navigator.serviceWorker.register('./foreign-worker.js',{scope:'./'});await navigator.serviceWorker.ready;});await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/foreign-worker.js'));
  }
  const response=await page.goto(`${origin}/${mode}/identity.html`);assert.equal(response?.fromServiceWorker(),false,'Application navigation must remain unhandled');
  await page.waitForSelector('prism-frame[data-error="frame"]',{timeout:15000});
  const result=await page.evaluate(()=>{const f=document.querySelector('prism-frame') as any;return {account:!!f.account,disabled:f.getAttribute('aria-disabled'),notice:f.querySelector('[slot="status"]')?.textContent,controller:navigator.serviceWorker.controller?.scriptURL,assets:f.dataset.assets};});
  assert.equal(result.account,false);assert.equal(result.disabled,'true');assert.match(result.notice,/unavailable/);assert.notEqual(result.assets,'verified');
  if(mode==='foreign')assert.equal(result.controller,origin+'/foreign/foreign-worker.js');
  if(mode==='corrupt'){
   assert(network.some((n:any)=>n.mode===mode&&n.url===pin.dependencies[0].url&&n.status===502&&n.serviceWorker));
   const engineUrl=`${origin}/corrupt/wasm/cs_verdant.wasm`;const engineResponse=page.waitForResponse(engineUrl);assert(await page.evaluate(async url=>(await fetch(url)).ok,engineUrl));assert.equal((await engineResponse).fromServiceWorker(),false,'Engine bytes must not be intercepted');
  }
  results.push({mode,...result});await context.close();current=null;
 }
 assert.deepEqual(errors,[]);await writeFile('artifacts/frame-assets-browser.json',JSON.stringify({passed:true,results,errors,network},null,2)+'\n');console.log('Frame delivery: corrupt bytes rejected, unavailable worker disables sharing, unrelated scope preserved, navigation/engine requests unhandled.');
}catch(error){await writeFile('artifacts/frame-assets-browser.json',JSON.stringify({passed:false,stage,error:String(error),results,errors,network},null,2)+'\n');throw error;}finally{await browser.close();await new Promise<void>(r=>server.httpServer.close(()=>r()));}
