import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BOXES, GROUND_PATCHES} from '../shared/map';
import {footSurface, enclosureAt} from '../src/audio-space';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';
import {Match} from '../server/match';
import {neutralInput} from '../shared/protocol';

test('footsteps follow visible ground patches and raised contact materials',()=>{
  for(const patch of GROUND_PATCHES)assert.equal(footSurface(patch.x,0,patch.z),patch.surface);
  for(const material of ['crate','metal'] as const){
    const box=BOXES.find(b=>b.material===material)!;
    assert.equal(footSurface(box.x,box.y+box.h,box.z),material==='crate'?'wood':'metal');
  }
  assert.equal(footSurface(0,0,20),'asphalt');
  assert.equal(enclosureAt(0,40,20),0);
  const crate=BOXES.find(b=>b.material==='crate')!;
  assert(enclosureAt(crate.x+crate.w/2+.2,1,crate.z)>.45);
});

test('a jump emits one landing on contact and subsequent stationary ticks emit none',async()=>{
  const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
  const kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
  const match=new Match('FOLEY',engine,kernel);
  const player=match.join('a','Runner','attack')!;
  match.join('b','Other','defend');
  match.phase='live'; match.phaseLeft=110;
  Object.assign(player,{x:0,y:0,z:23,grounded:true});
  match.input(player.id,{...neutralInput(),seq:1,jump:true});
  match.step(1/60);
  assert.equal(player.grounded,false);
  for(let i=0;i<120;i++)match.step(1/60);
  assert.equal(player.grounded,true);
  const landings=match.events.filter(e=>e.type==='landing');
  assert.equal(landings.length,1);
  assert.equal(landings[0].actor,player.id);
  assert.deepEqual([landings[0].x,landings[0].y,landings[0].z],[0,0,23]);
});
