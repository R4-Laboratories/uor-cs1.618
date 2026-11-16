import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFile} from 'node:fs/promises';
import {createEngine} from '../shared/engine';
import {HdLayer} from '../src/hd-layer';
const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
test('HD scene installs real engine geometry and swaps detail without leaking old meshes',async()=>{
 const scene=new T.Scene();const layer=new HdLayer(scene,async lod=>[0,1,2].map(k=>engine.hdAsset(k,lod)));
 await layer.setLod(0);const before=layer.diagnostics.triangles;assert(before>100);assert.equal(layer.diagnostics.lod,0);
 const old=layer.group.children[0] as T.Mesh;let disposed=false;old.geometry.addEventListener('dispose',()=>disposed=true);
 await layer.setLod(4);assert(disposed);assert(layer.diagnostics.triangles>before);assert.equal(layer.group.children.length,9);
 const oldGroup=layer.group.children.slice();await assert.rejects(layer.setLod(5));assert.deepEqual(layer.group.children,oldGroup);
 layer.dispose();assert.equal(scene.children.length,0);
});
test('late worker results cannot override a newer quality choice',async()=>{
 const assets=[0,1,2].map(k=>engine.hdAsset(k,0));let finish!:(v:typeof assets)=>void;
 const layer=new HdLayer(new T.Scene(),lod=>lod===4?new Promise(r=>finish=r):Promise.resolve(assets));
 const high=layer.setLod(4);await layer.setLod(0);finish(assets);await high;assert.equal(layer.diagnostics.lod,0);layer.dispose();
});
