import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';
import {Match} from '../server/match';
import {neutralInput} from '../shared/protocol';
const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm')),kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
const dt=1/60;
function setup(){const m=new Match('BOTS',engine,kernel);const a=m.join('a','Carrier','attack')!,d=m.join('d','Defuser','defend',true)!;m.phase='live';m.phaseLeft=90;Object.assign(a,{x:-20,z:22});Object.assign(d,{x:0,z:20,yaw:0});return {m,a,d};}
test('bot team chooses one kit defuser while another takes cover, then replaces a dead defuser',()=>{const {m,a,d}=setup();Object.assign(a,{x:12,z:13});const cover=m.join('cover','Cover','defend',true)!;Object.assign(cover,{alive:true,x:1,z:20,kit:false});d.kit=true;m.bomb={state:'planted',carrier:null,x:0,y:0,z:20,site:'A',remaining:30};m.step(dt);assert.equal(d.input.use,true);assert.equal(cover.input.use,false);assert.equal(cover.progress,0);d.alive=false;m.step(dt);assert.equal(cover.input.use,true);});
test('new visible targets require reaction time and automatic fire has recovery gaps',t=>{const {m,a,d}=setup();Object.assign(a,{x:0,z:16,health:10000});d.inventory[0]={id:'m4',ammo:30,reserve:90};d.slot=0;d.input.slot=0;for(let n=0;n<10;n++)m.step(dt);assert.equal(m.events.filter(e=>e.type==='shot').length,0);for(let n=0;n<100;n++)m.step(dt);const times=m.events.filter(e=>e.type==='shot'&&e.actor===d.id).map(e=>e.at!);assert.ok(times.length>=4);assert.ok(times[0]>=.2);assert.ok(times.some((t,n)=>n>0&&t-times[n-1]>.3));t.diagnostic(JSON.stringify({firstShotSeconds:times[0],shots:times.length,observedSeconds:m.time,largestGapSeconds:Math.max(...times.slice(1).map((t,n)=>t-times[n]))}));});
test('occlusion and range revoke fire immediately, reacquisition requires another reaction',()=>{const {m,a,d}=setup();Object.assign(a,{x:0,z:16,health:10000});for(let n=0;n<40;n++)m.step(dt);Object.assign(a,{x:12,z:13});m.botInput(d,dt);assert.equal(d.input.fire,false);Object.assign(a,{x:0,z:16});m.botInput(d,dt);assert.equal(d.input.fire,false);Object.assign(a,{x:0,z:-26});m.botInput(d,dt);assert.equal(d.input.fire,false);});
test('carrier can reach a navigable site and generated escort follows the carrier',()=>{const {m,a,d}=setup();a.bot=true;d.bot=false;Object.assign(d,{x:-20,z:-25});const escort=m.join('escort','Escort','attack',true)!;Object.assign(escort,{alive:true,x:-20,z:20});for(let n=0;n<2500&&m.bomb!.state!=='planted';n++)m.step(dt);assert.equal(m.bomb!.state,'planted');assert.ok(Math.hypot(escort.x-m.bomb!.x,escort.z-m.bomb!.z)<12);});

for(const {plant,start,sameNode,close} of [
 {plant:{x:-16.1,z:-13},start:{x:-17,z:-12.1},sameNode:false,close:false},
 {plant:{x:-16.1,z:-13},start:{x:-16.85,z:-12.1},sameNode:false,close:true},
 {plant:{x:-16.1,z:-10.1},start:{x:-17.9,z:-11.9},sameNode:true,close:false},
])test(`bot reaches a valid interaction position and defuses a legal plant from (${start.x}, ${start.z})`,t=>{
 const {m,a,d}=setup();d.bot=false;
 Object.assign(a,{...plant,y:0,grounded:true});
 for(let n=0;n<180;n++){
  assert.ok(m.input(a.id,{...neutralInput(),seq:a.acceptedSeq+1,slot:a.slot,use:true}));
  m.step(dt);
  if(n<179)assert.equal(m.bomb!.state,'carried');
 }
 assert.equal(m.bomb!.state,'planted');assert.equal(m.bomb!.site,'A');assert.equal(m.bomb!.remaining,40);
 assert.equal(m.events.filter(e=>e.type==='plant').length,1);
 Object.assign(a,{x:0,y:0,z:23});Object.assign(d,{...start,y:0,grounded:true,bot:true,kit:true});
 if(close)assert.ok(Math.hypot(start.x-plant.x,start.z-plant.z)<1.2,'fixture must exercise movement inside the ordinary arrival cutoff');
 if(sameNode){assert.equal(m.nav.nearest(start.x,start.z),m.nav.nearest(plant.x,plant.z));assert.deepEqual(m.nav.path(start.x,start.z,plant.x,plant.z),[]);}
 m.step(dt);assert.equal(d.progress,0,'invalid starting geometry must prevent initial defuse progress');
 const initialUse=d.input.use;
 let moved=false,progressed=false,ticks=1;
 for(;ticks<2400&&m.phase==='live';ticks++){
  m.step(dt);moved ||= Math.hypot(d.x-start.x,d.z-start.z)>.05;progressed ||= d.progress>0;
 }
 t.diagnostic(JSON.stringify({ticks,initialUse,moved,progressed,x:d.x,z:d.z,remaining:m.bomb!.remaining,terminal:m.bomb!.terminal}));
 assert.equal(m.bomb!.terminal,'defused');assert.equal(m.winner,'defend');
 assert.equal(initialUse,false,'blocked bot must navigate before using');assert.ok(moved);assert.ok(progressed);
 assert.ok(m.bomb!.remaining>0);assert.equal(m.score.defend,1);assert.equal(m.score.attack,0);
 assert.equal(m.events.filter(e=>e.type==='defuse').length,1);assert.equal(m.events.filter(e=>e.type==='explode').length,0);
 for(let n=0;n<30;n++)m.step(dt);
 assert.equal(m.score.defend,1);assert.equal(m.events.filter(e=>e.type==='defuse').length,1);
});

test('a carrier plants at the edge of a site with a visible opponent, and the selected defender finishes under contact',()=>{
 const {m,a,d}=setup();
 Object.assign(a,{bot:true,x:-16,y:0,z:-10.2,yaw:0});
 Object.assign(d,{bot:false,x:-16,y:0,z:-16,yaw:Math.PI});
 m.step(dt);
 assert.equal(a.botTarget,d.id);
 assert.equal(a.input.use,true);
 for(let n=1;n<180;n++)m.step(dt);
 assert.equal(m.bomb?.state,'planted');
 // Keep the same opponent in view at the site throughout the retake.
 Object.assign(a,{bot:false,x:-16,z:-7,input:neutralInput()});
 Object.assign(d,{bot:true,x:-15,z:-12,yaw:Math.PI,kit:true});
 m.step(dt);
 assert.equal(d.botTarget,a.id);
 assert.equal(d.input.use,true);
 for(let n=1;n<300;n++)m.step(dt);
 assert.equal(m.reason,'Device defused');
 assert.equal(m.score.defend,1);
});

test('a disconnected kit holder yields to a defender with a route to the planted device',()=>{
 const {m,a,d}=setup();
 const backup=m.join('backup','Backup','defend',true)!;
 Object.assign(a,{x:0,z:23});
 Object.assign(d,{x:-15,z:-17,kit:true});
 Object.assign(backup,{alive:true,x:-15,z:-5,kit:false});
 m.bomb={state:'planted',carrier:null,x:-16,y:0,z:-11,site:'A',remaining:14};
 m.nav.nodes=[
  {x:-15,z:-17,links:[]}, {x:-15,z:-5,links:[2]},
  {x:-15,z:-7,links:[1,3]}, {x:-15,z:-9,links:[2]},
 ];
 assert.equal(m.botDefuser(),backup.id);
 for(let n=0;n<14*60&&m.phase==='live';n++)m.step(dt);
 assert.equal(m.winner,'defend');
 assert.equal(m.events.find(e=>e.type==='defuse')?.actor,backup.id);
});

for(const interrupted of ['moved','dead'] as const)test('a '+interrupted+' primary hands a partial defuse to a teammate who starts from zero',()=>{
 const {m,a,d}=setup();
 const backup=m.join('backup','Backup','defend',true)!;
 Object.assign(a,{x:0,z:23});
 Object.assign(d,{x:-15,z:-11,kit:true});
 Object.assign(backup,{alive:true,x:-15,z:-7,kit:false});
 m.bomb={state:'planted',carrier:null,x:-16,y:0,z:-11,site:'A',remaining:20};
 for(let n=0;n<60;n++)m.step(dt);
 assert.equal(m.bomb.defuser,d.id);
 assert.ok(d.progress>0);
 if(interrupted==='dead')d.alive=false;
 else Object.assign(d,{x:-15,z:-14.5,vx:0,vz:0});
 for(let n=0;n<180&&m.bomb.defuser!==backup.id;n++)m.step(dt);
 assert.equal(m.bomb.defuser,backup.id);
 assert.equal(d.progress,0);
 assert.ok(backup.progress<=dt/10+1e-9);
 for(let n=0;n<600&&m.phase==='live';n++)m.step(dt);
 assert.equal(m.winner,'defend');
 assert.equal(m.events.find(e=>e.type==='defuse')?.actor,backup.id);
});

test('a route stalled on solid map geometry hands off before the fuse expires',()=>{
 const {m,a,d}=setup();
 const backup=m.join('backup','Backup','defend',true)!;
 Object.assign(a,{x:0,z:23});
 Object.assign(d,{x:-20,z:-14,kit:true});
 Object.assign(backup,{alive:true,x:-15,z:-6,kit:false});
 m.bomb={state:'planted',carrier:null,x:-16,y:0,z:-14,site:'A',remaining:16};
 // The first graph edge crosses the real site crate. Verdant stops that runner,
 // while the second runner's route skirts it on the eastern side.
 m.nav.nodes=[
  {x:-20,z:-14,links:[1]}, {x:-16,z:-14,links:[0,2]},
  {x:-15,z:-12,links:[1,3]}, {x:-15,z:-10,links:[2,4]},
  {x:-15,z:-8,links:[3,5]}, {x:-15,z:-6,links:[4]},
 ];
 assert.equal(m.botDefuser(),d.id);
 for(let n=0;n<60;n++)m.step(dt);
 assert.equal(m.botDefuser(),d.id);
 assert.ok(d.x< -19.8);
 for(let n=0;n<15*60&&m.phase==='live';n++)m.step(dt);
 assert.equal(m.winner,'defend');
 assert.equal(m.events.find(e=>e.type==='defuse')?.actor,backup.id);
});

test('a completed bot defuse survives the original fuse deadline and the next round reset',()=>{
 const {m,a,d}=setup();
 Object.assign(a,{x:0,z:23});
 Object.assign(d,{x:-16,z:-11,kit:true});
 m.bomb={state:'planted',carrier:null,x:-16,y:0,z:-11,site:'A',remaining:12};
 m.phaseLeft=1;
 const original=m.bomb;
 for(let n=0;n<300;n++)m.step(dt);
 assert.equal(m.phase,'ended');
 assert.equal(original.terminal,'defused');
 const remaining=original.remaining;
 assert.ok(remaining>0);
 const result=m.events.find(e=>e.type==='round'&&e.text==='Device defused');
 assert.equal(result?.team,'defend');
 for(let n=0;n<Math.ceil(remaining/dt)+2;n++)m.step(dt);
 assert.equal(m.round,2);
 assert.equal(m.bomb?.state,'carried');
 assert.equal(m.bomb?.terminal,undefined);
 assert.equal(original.remaining,remaining);
 assert.deepEqual(m.score,{attack:0,defend:1});
 assert.equal(m.events.filter(e=>e.type==='defuse').length,1);
 assert.equal(m.events.filter(e=>e.type==='explode').length,0);
});

test('a bot recovering the device near the opposite site plants there without retracing the opening route',()=>{
 const {m,a,d}=setup();
 const runner=m.join('runner','Runner','attack',true)!;
 // Round one normally opens at B. A pickup on A's approach is already
 // past the entry waypoint and should reach A well inside this deadline.
 Object.assign(a,{x:0,z:22});
 Object.assign(d,{bot:false,x:0,z:-24});
 Object.assign(runner,{alive:true,x:-16,z:-7});
 m.bomb={state:'dropped',carrier:null,x:runner.x,y:0,z:runner.z,site:null,remaining:40};
 m.step(dt);
 assert.equal(m.bomb.carrier,runner.id);
 for(let n=0;n<7*60&&m.bomb.state==='carried';n++)m.step(dt);
 assert.equal(m.bomb.site,'A');
 assert.equal(m.events.find(e=>e.type==='plant')?.actor,runner.id);
});

test('an interrupted kit runner reclaims when the backup cannot finish before expiry',()=>{
 const {m,a,d}=setup();
 const backup=m.join('backup','Backup','defend',true)!;
 Object.assign(a,{x:0,z:23});
 Object.assign(d,{x:-16,z:-11,kit:true});
 Object.assign(backup,{alive:true,x:-15,z:-10,kit:false});
 m.bomb={state:'planted',carrier:null,x:-16,y:0,z:-11,site:'A',remaining:7};
 for(let n=0;n<30;n++)m.step(dt);
 assert.equal(m.bomb.defuser,d.id);
 m.cancelInteraction(d);
 m.step(dt);
 assert.equal(m.bomb.defuser,d.id);
 assert.ok(d.progress<=dt/5+1e-9);
 for(let n=0;n<300&&m.phase==='live';n++)m.step(dt);
 assert.equal(m.winner,'defend');
 assert.equal(m.events.find(e=>e.type==='defuse')?.actor,d.id);
});
