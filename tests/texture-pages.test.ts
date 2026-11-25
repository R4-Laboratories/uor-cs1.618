import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEngine } from '../shared/engine';

const artifact = await readFile('public/wasm/cs_verdant.wasm');

test('vTensor RGBA8 byte span and vRAM page choices retain exact bytes across GPU uploads',async()=>{
 const engine = await createEngine(artifact);
 const width = 65, height = 48;
 const input = new Uint8Array(width * height * 4).fill(127);
 input[4096 + 17] = 20;
 for (let i = 8192; i < 12288; i++) input[i] = i % 11;
 for (let i = 12288; i < input.length; i++) input[i] = i & 255;
 const original = input.slice();
 const texture = engine.packTexture(width,height,input);
 input.fill(0);
 const first = texture.unpack();
 assert.deepEqual(first,original); first.fill(42);
 assert.deepEqual(texture.unpack(),original);
 assert.deepEqual(engine.textureStaging,{
  textures:1,logicalBytes:12480,storedBytes:1+4+12+2048+192,
  fillPages:1,sparsePages:1,palettePages:1,literalPages:1
 });
 assert.equal(texture.storedBytes,engine.textureStaging.storedBytes);
});

test('stageTexture rejects mismatched spans and invalid extents before staging',async()=>{
 const engine = await createEngine(artifact);
 for (const [w,h,length] of [[-1,1,4],[0,1,0],[1,1.5,6],[1,2,4],[1,1025,4100],[2**32+1,1,4]]) {
  assert.throws(()=>engine.stageTexture(w,h,new Uint8Array(length)),RangeError);
 }
 assert.equal(engine.textureStaging.textures,0);
 const rgba = Uint8Array.of(3,5,7,255);
 assert.deepEqual(engine.stageTexture(1,1,rgba),rgba);
 assert.equal(engine.textureStaging.literalPages,1);
});
