import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEngine} from '../shared/engine';
const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
// Defect: stale engine, discarded topology, or a constant LOD mesh must fail these checks.
test('Verdant HD assets preserve real indexed geometry at all five detail levels',()=>{
 assert.equal(typeof engine.hdAsset,'function','HD Wasm bridge is missing');
 for(const kind of [0,1,2] as const){let previous=0;
  for(let lod=0;lod<=4;lod++){
   const m=engine.hdAsset(kind,lod);assert(m.indices.length>previous);previous=m.indices.length;
   assert.equal(m.normals.length,m.positions.length);assert.equal(m.uvs.length,m.positions.length);assert.equal(m.colors.length,m.positions.length);
   assert(m.positions.flat().every(Number.isFinite));assert(m.normals.flat().every(Number.isFinite));assert(m.indices.every(i=>Number.isInteger(i)&&i>=0&&i<m.positions.length));
  }
 }
 assert.throws(()=>engine.hdAsset(3,0));assert.throws(()=>engine.hdAsset(0,5));assert.throws(()=>engine.hdAsset(0,NaN));
});
test('upstream governor lowers overloaded LOD, raises with headroom, and honors user pins',()=>{
 assert.equal(typeof engine.recommendLod,'function','Prism-backed governor is missing');
 assert.equal(engine.recommendLod(3,40000,false),2);assert.equal(engine.recommendLod(3,4000,false),4);
 assert.equal(engine.recommendLod(3,40000,true),3);assert.equal(engine.recommendLod(0,40000,false),0);assert.equal(engine.recommendLod(4,4000,false),4);
 assert.throws(()=>engine.recommendLod(5,4000,false));assert.throws(()=>engine.recommendLod(1,NaN,false));
});
test('first-person near plane is guarded against Meridian walls and floor at wide and scoped FOV',()=>{
 assert.equal(typeof engine.cameraFrame,'function','camera Wasm bridge is missing');
 for(const fov of [32,76])for(const aspect of [0.05,0.5,16/9,4,12]){
  const frame=engine.cameraFrame(0,1.6,26.99,0,0,fov,aspect);
  const diagonal=.05*Math.sqrt(1+Math.tan(fov*Math.PI/360)**2*(1+aspect**2));
  assert(frame.guarded);assert(frame.guard>=diagonal);assert(frame.z+frame.guard<27.001);
  const floor=engine.cameraFrame(0,.01,20,0,0,fov,aspect);assert(floor.y>=floor.guard);
 }
 assert.throws(()=>engine.cameraFrame(0,1,0,0,0,0,1));assert.throws(()=>engine.cameraFrame(NaN,1,0,0,0,76,1));
});
