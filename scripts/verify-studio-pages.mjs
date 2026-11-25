import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const commit = process.argv[2];
assert.match(commit ?? '', /^[a-f0-9]{40}$/, 'Pass the expected Pages commit SHA');
const base = 'https://r4-laboratories.github.io/uor-cs1.618/';
const output = 'artifacts/studio-release';
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
  await page.click('#practice');
  await page.locator('#deploy-overlay:not(.hidden)').waitFor();
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
  assert(game.tick > 0 && game.assets.loaded >= 11 && !game.assets.failed.length);
  assert(game.staging.storedBytes > 0 && game.staging.storedBytes < game.staging.logicalBytes);
  await page.screenshot({path:output + '/practice.png'});
  await page.goto(base + 'evolution-studio.html');
  const inspector = page.locator('#material-inspector[data-state="ready"]');
  await inspector.waitFor();
  const picker = inspector.getByLabel('Surface', {exact:true});
  assert.equal(await picker.locator('option').count(), 20);
  assert.equal(await inspector.getAttribute('data-staged-textures'), '6');
  await picker.selectOption('tealPaint');
  await inspector.screenshot({path:output + '/materials.png'});
  assert.deepEqual(errors, []);
  await writeFile(output + '/live.json', JSON.stringify({base, build, game, surfaces:20, errors}, null, 2) + '\n');
  console.log(JSON.stringify({commit:build.commit, game, surfaces:20, errors}));
} finally {
  await browser.close();
}
