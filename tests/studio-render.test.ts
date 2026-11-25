import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {Color, DataTexture} from 'three';
import {studioSurface, stageStudioSurfaces, type StudioSurfaceName} from '../src/studio-render';
import {createEngine} from '../shared/engine';

test('material register matches the current authored library and Studio authority pin', () => {
  execFileSync('python3', ['scripts/studio-render-materials.py', '--check'], {stdio: 'pipe'});
});

test('material upload sources rematerialize identical OpenPBR pixels from Verdant backing', async () => {
  const engine = await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
  const names: StudioSurfaceName[] = ['concrete', 'crate', 'tealPaint', 'brushedSteel', 'oliveFabric', 'glass'];
  const tiles = names.map(name => {
    const map = studioSurface(name).roughnessMap;
    assert.ok(map instanceof DataTexture);
    return map;
  });
  const before = tiles.map(tile => new Uint8Array(tile.image.data as Uint8Array));
  stageStudioSurfaces(engine);
  for (const [index, tile] of tiles.entries()) {
    assert.deepEqual(tile.image.data, before[index]);
    // A GL upload or consumer may retain/mutate the first materialization.
    // Restoration must read from the immutable packed source again.
    (tile.image.data as Uint8Array)[0] ^= 255;
    assert.deepEqual(tile.image.data, before[index]);
    assert.equal(studioSurface(names[index]).roughnessMap, tile);
  }
  assert.equal(studioSurface('concrete').roughnessMap, studioSurface('limestone').roughnessMap);
  const stats = {...engine.textureStaging};
  assert.equal(stats.textures, names.length);
  assert.ok(stats.fillPages > 0 && stats.literalPages > 0 && stats.palettePages > 0);
  assert.ok(stats.storedBytes < stats.logicalBytes);
  stageStudioSurfaces(engine);
  assert.deepEqual(engine.textureStaging, stats);
  assert.ok(studioSurface('brushedSteel').color instanceof Color);
});
