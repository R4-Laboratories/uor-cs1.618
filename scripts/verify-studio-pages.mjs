import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const commit = process.argv[2];
assert.match(commit ?? '', /^[a-f0-9]{40}$/, 'Pass the expected Pages commit SHA');
const base = new URL(process.argv[3] ?? 'https://r4-laboratories.github.io/uor-cs1.618/').href;
const output = 'artifacts/field-release';
await mkdir(output, {recursive:true});
const browser = await chromium.launch({args:['--no-sandbox', '--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage({viewport:{width:1100, height:760}, deviceScaleFactor:.75});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', res => {
    if (res.url().startsWith(base) && res.status() >= 400) errors.push(res.status() + ' ' + res.url());
  });
  page.setDefaultTimeout(60000);
  await page.addInitScript(() => localStorage.setItem('cs1618-quality', 'low'));
  await page.goto(base, {waitUntil:'domcontentloaded'});
  const build = await page.evaluate(async () => (await fetch('./build.json', {cache:'no-store'})).json());
  assert.equal(build.commit, commit);
  await page.locator('#lobby:not(.hidden)').waitFor();
  await page.goto(base + 'identity.html#career');
  await page.click('#create-identity');
  await page.waitForFunction(() => {
    const owner=document.querySelector('#career-owner')?.textContent?.trim();
    const id=document.querySelector('#prism-id')?.textContent?.trim();
    return id?.startsWith('sha256:') && owner?.endsWith(id);
  });
  const ready=page.waitForEvent('download');
  await page.click('#career-export');
  assert.equal((await ready).suggestedFilename(),'cs1618-career.json');
  await page.goto(base);
  await page.click('#practice');
  await page.locator('#deploy-overlay:not(.hidden)').waitFor();
  await page.waitForFunction(()=>window.cs1618?.snapshot?.players.length===10);
  assert.equal(await page.evaluate(()=>window.cs1618.snapshot.tick),0);
  await page.click('#ready-loadout');
  const rivet=page.locator('[data-buy="rivet"]');
  await rivet.waitFor();
  assert.equal(await page.locator('[data-buy="breaker"],[data-buy="tern"]').count(),2);
  await rivet.click();
  await page.waitForFunction(()=>window.cs1618.snapshot.self.inventory[1].id==='rivet');
  await page.screenshot({path:output+'/armory.png'});
  await page.click('#close-buy');
  assert.equal(await page.evaluate(()=>window.cs1618.snapshot.tick),0);
  await page.click('#deploy');
  await page.waitForFunction(() => {
    const s = window.cs1618;
    return s?.locked && s.snapshot?.phase === 'live' && s.hd?.status === 'ready'
      && s.mapAssets?.loaded === s.mapAssets?.total && s.textureStaging?.textures === 6;
  });
  const game = await page.evaluate(() => {
    const s = window.cs1618;
    return {room:s.snapshot.room, players:s.snapshot.players.length, tick:s.snapshot.tick, mode:s.network.mode,
      staging:s.textureStaging, assets:s.mapAssets, joints:s.characters.joints, visible:!document.hidden};
  });
  assert.equal(game.room, 'PRACTICE');
  assert.equal(game.mode, 'practice');
  assert.equal(game.players, 10);
  assert.equal(game.joints, 22);
  assert.equal(game.visible, true);
  assert(game.tick > 0 && game.assets.loaded >= 15 && !game.assets.failed.length);
  assert(game.staging.storedBytes > 0 && game.staging.storedBytes < game.staging.logicalBytes);
  await page.screenshot({path:output + '/practice.png'});
  await page.keyboard.press('KeyT');
  await page.locator('#chat-input').fill('Practice chat check');
  await page.keyboard.press('Enter');
  await page.locator('#chat-feed .chat-line').filter({hasText:'Practice chat check'}).waitFor({state:'attached'});
  await page.goto(base + 'evolution-studio.html');
  const inspector = page.locator('#material-inspector[data-state="ready"]');
  await inspector.waitFor();
  const picker = inspector.getByLabel('Surface', {exact:true});
  assert.equal(await picker.locator('option').count(), 20);
  assert.equal(await inspector.getAttribute('data-staged-textures'), '6');
  await picker.selectOption('tealPaint');
  await inspector.screenshot({path:output + '/materials.png'});
  assert.deepEqual(errors, []);
  await writeFile(output + '/live.json', JSON.stringify({base, build, game, surfaces:20, purchased:'rivet', signedCareerExport:true, errors}, null, 2) + '\n');
  console.log(JSON.stringify({commit:build.commit, game, surfaces:20, purchased:'rivet', signedCareerExport:true, errors}));
} finally {
  await browser.close();
}
