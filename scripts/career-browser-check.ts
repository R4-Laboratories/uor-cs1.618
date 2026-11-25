import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import type {Page} from 'playwright';
import {createGameServer} from '../server/index';
import type {Player} from '../server/match';

/** Drive a real game connection. The fixture positions two actors, then calls
 * the normal authoritative fire routine; neither client gets injected scores. */
export async function checkLinkedCareer(a:Page,b:Page,owner:string) {
  const game=await createGameServer({port:0,host:'127.0.0.1'});
  const page=await a.context().newPage(),base=new URL('./',a.url()).href;
  try {
    await page.setViewportSize({width:800,height:600});
    await page.addInitScript(()=>localStorage.setItem('cs1618-quality','low'));
    await page.goto(base+'?server='+encodeURIComponent('ws://127.0.0.1:'+game.port+'/socket'));
    await page.waitForSelector('#lobby:not(.hidden)');
    await page.fill('#name','Career Player');await page.fill('#room','CAREER');
    await page.click('[data-team="attack"]');
    await page.locator('#connection-settings').evaluate((details:HTMLDetailsElement)=>details.open=true);
    await page.uncheck('#fill-bots');await page.click('#join');
    await page.waitForSelector('#deploy-overlay:not(.hidden)');
    const match=game.rooms.get('CAREER')!,self=[...match.players.values()][0];
    const other=match.join('fixture','Visitor','defend')!;
    function score(shooter:Player,target:Player){
      match.beginRound();match.phase='live';match.phaseLeft=60;
      Object.assign(shooter,{x:0,y:0,z:20,yaw:0,pitch:0,cooldown:0,health:100,alive:true});
      Object.assign(target,{x:0,y:0,z:16,health:1,armor:0,alive:true});
      match.fire(shooter);assert.equal(target.alive,false);
    }
    score(self,other);score(other,self);
    await page.waitForFunction(()=>{const s=(window as any).cs1618.snapshot;return s?.self.career.kills===1&&s.self.career.deaths===1;});
    await page.goto(base+'identity.html#career');
    await page.waitForFunction(()=>document.querySelector('#career-multiplayer')?.textContent==='1 kill · 1 death · 1.00 K/D');
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#career-multiplayer')?.textContent?.includes('1.00 K/D'));
    assert.match(await page.locator('#career-owner').innerText(),new RegExp(owner));
    assert.equal(await page.locator('#career-practice').innerText(),'0 kills · 0 deaths · — K/D');
    const event=page.waitForEvent('download');await page.click('#career-export');
    const file=await event,buffer=await readFile((await file.path())!);
    const data=JSON.parse(buffer.toString('utf8'));
    assert.equal(data.owner,owner);assert.equal(data.rows.length,1);
    await page.evaluate(({owner,row})=>{
      localStorage.setItem('cs1618-career-pending/'+owner+'/'+row.seat,JSON.stringify(row));
    },{owner,row:data.rows[0]});
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#career-multiplayer')?.textContent?.includes('1.00 K/D'));
    assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('cs1618-career-pending/')).length),0);
    for(let i=0;i<2;i++) {
      await b.locator('#career-status').evaluate(el=>el.textContent='');
      await b.locator('#career-import').setInputFiles({name:'career.json',mimeType:'application/json',buffer});
      await b.waitForFunction(()=>document.querySelector('#career-status')?.textContent?.includes('Backup merged.'));
      assert.equal(await b.locator('#career-multiplayer').innerText(),'1 kill · 1 death · 1.00 K/D');
    }
    // Return the original file so the shared-frame account-switch check can reject it.
    return buffer;
  } catch(error) {
    const details=await page.evaluate(()=>({url:location.pathname,owner:document.querySelector('#career-owner')?.textContent,
      online:document.querySelector('#career-multiplayer')?.textContent,save:document.querySelector('#career-save-state')?.textContent,
      receipt:(window as any).cs1618?.snapshot?.self.career}));
    console.error('Career browser fixture',details);throw error;
  } finally {await page.close();await game.close();}
}
