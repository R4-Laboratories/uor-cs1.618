import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEngine} from '../shared/engine';
import {BotNavigator} from '../server/navigation';
import {MAP,MAP_LANES,MAP_DEFEND_HOLDS,GROUND_PATCHES,groundSurfaceAt,zoneAt} from '../shared/map';

const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
const nav=new BotNavigator(engine);
test('all five entry corridors lead from spawn to separate contact cells and actual planting space',()=>{
 const connected=new Set([nav.nearest(0,22)]);
 for(const index of connected)for(const adjacent of nav.nodes[index].links)connected.add(adjacent);
 assert.equal(connected.size,nav.nodes.length,'no orphan cells in the expanded graph');
 const contacts=new Set<number>();
 for(const lane of MAP_LANES){
  const {entry,contact}=lane;
  const entryId=nav.nearest(entry.x,entry.z),endId=nav.nearest(contact.x,contact.z);
  assert.deepEqual([nav.nodes[entryId].x,nav.nodes[entryId].z],[entry.x,entry.z],lane.id+' entry lies on the grid');
  assert.deepEqual([nav.nodes[endId].x,nav.nodes[endId].z],[contact.x,contact.z],lane.id+' contact lies on the grid');
  assert.equal(nav.path(0,22,entry.x,entry.z).at(-1),entryId);
  assert.equal(nav.path(entry.x,entry.z,contact.x,contact.z).at(-1),endId);
  contacts.add(endId);
  for(const site of MAP.sites.filter(s=>lane.site==='mid'||s.id===lane.site)){
   const end=MAP_DEFEND_HOLDS[site.id][0];
   const plant=nav.nodes.find(n=>Math.hypot(n.x-site.x,n.z-site.z)<site.radius-.5);
   assert(plant);
   assert.equal(nav.path(contact.x,contact.z,plant.x,plant.z).at(-1),nav.nearest(plant.x,plant.z));
   assert.equal(nav.path(0,-23,end.x,end.z).at(-1),nav.nearest(end.x,end.z));
  }
 }
 assert.equal(contacts.size,5);
});
test('outlying streets have collidable exterior walls, distinct location names and matching floor surfaces',()=>{
 for(const side of [-1,1]){
  assert.equal(engine.ray(side*39,1,22,side,0,0,20),MAP.halfWidth-39);
  assert.notEqual(zoneAt(side*36,0),zoneAt(0,0));
 }
 assert.equal(groundSurfaceAt(-36,1),'stone');assert.equal(groundSurfaceAt(36,0),'metal');
 assert.equal(groundSurfaceAt(0,0),'asphalt');
 for(const patch of GROUND_PATCHES)assert.equal(groundSurfaceAt(patch.x,patch.z),patch.surface);
});
