import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';
import {RULES as R} from '../shared/config';
import {Match} from '../server/match';
const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm')),kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
const dt=1/60;
function setup(){
 const m=new Match('SIGHT',engine,kernel),a=m.join('a','Target','attack')!,d=m.join('d','Bot','defend',true)!;
 m.phase='live';m.phaseLeft=90;m.bomb=null;
 Object.assign(a,{x:0,y:0,z:16,health:10000});Object.assign(d,{x:0,y:0,z:20,yaw:0});
 return {m,a,d};
}
function react(m:Match,p:Parameters<Match['botInput']>[0]){for(let n=0;n<20;n++){m.botInput(p,dt);if(p.input.fire)return;}}

test('bot sees an elevated torso over cover and can hit it after reacting',()=>{
 const {m,a,d}=setup();Object.assign(d,{x:0,z:12});Object.assign(a,{x:0,y:2.5,z:-6});
 // The old horizontal ray hits the overlook; the eye-to-torso segment clears it.
 assert.ok(engine.ray(0,1.4,12,0,0,-1,18)<17);
 m.botInput(d,dt);assert.equal(d.botTarget,a.id);assert.equal(d.input.fire,false);
 react(m,d);assert.equal(d.input.fire,true);d.yaw=d.input.yaw;d.pitch=d.input.pitch;m.fire(d);
 assert.ok(a.health<10000,'the elevated target must receive a real hit');
});

test('crouched bot aims from its crouched eye at a visible crouched torso',()=>{
 const {m,a,d}=setup();d.crouch=true;a.crouch=true;
 react(m,d);assert.equal(d.botTarget,a.id);assert.equal(d.input.fire,true);
 assert.ok(Math.abs(d.input.pitch-Math.atan2(.75-R.crouchEye,4))<1e-6);
});

test('actual torso cover hides a crouched target despite a clear standing-height ray',()=>{
 const {m,a,d}=setup();Object.assign(d,{x:0,z:12});Object.assign(a,{x:0,z:6,crouch:true});
 assert.equal(engine.ray(0,1.4,12,0,0,-1,6),6);
 react(m,d);assert.equal(d.botTarget,null);assert.equal(d.input.fire,false);
});

test('sight range includes vertical separation',()=>{
 const {m,a,d}=setup();Object.assign(a,{x:0,y:50,z:16});
 react(m,d);assert.equal(d.botTarget,null);assert.equal(d.input.fire,false);
});

test('overlapping targets keep finite sight, aim and friendly-hitbox inputs',()=>{
 const {m,a,d}=setup();Object.assign(a,{x:d.x,y:R.eyeHeight-1.2,z:d.z});
 const friend=m.join('friend','Friendly','defend')!;Object.assign(friend,{alive:true,x:0,y:0,z:19});
 // Inspect the boundary while retaining the actual WASM ray/hitbox implementation.
 m.engine=new Proxy(engine,{get(target,key){const value=Reflect.get(target,key);if(key==='ray'||key==='hitbox')return (...args:number[])=>{assert.ok(args.every(Number.isFinite),`${String(key)} received nonfinite geometry`);return value.apply(target,args);};return typeof value==='function'?value.bind(target):value;}});
 react(m,d);assert.equal(d.botTarget,a.id);
 assert.ok([d.input.yaw,d.input.pitch,d.input.forward,d.input.strafe].every(Number.isFinite));
 assert.ok(Math.abs(d.input.pitch)<=1.5);
 // Ordinary body overlap still has vertical eye-to-torso separation.
 a.y=0;react(m,d);assert.equal(d.botTarget,a.id);
 assert.ok([d.input.yaw,d.input.pitch].every(Number.isFinite));assert.ok(Math.abs(d.input.pitch)<=1.5);
});

test('a crouched friendly in the three-dimensional firing line prevents fire',()=>{
 const {m,a,d}=setup();Object.assign(d,{crouch:true});Object.assign(a,{crouch:true});
 const friend=m.join('friend','Friendly','defend')!;Object.assign(friend,{alive:true,x:0,y:0,z:18,crouch:true});
 react(m,d);assert.equal(d.botTarget,a.id);assert.equal(d.input.fire,false);
});

function droppedGoal(){
 const {m,a,d}=setup();a.bot=true;d.bot=false;Object.assign(a,{x:.05,y:0,z:20.05,yaw:0});Object.assign(d,{x:20,z:-24});
 m.bomb={state:'dropped',carrier:null,x:1.95,y:0,z:21.95,site:null,remaining:40};
 return {m,a,d};
}

test('changed objective goal replans before the previous plan expires',()=>{
 const {m,a}=droppedGoal();m.bomb!.x=-20;m.bomb!.z=20;
 m.botInput(a,dt);assert.ok(a.input.forward>0);assert.ok(a.input.yaw>0);
 assert.ok(a.botPlan>1,'fixture changes goal before the ordinary replan timer');
 m.bomb!.x=20;m.botInput(a,dt);
 assert.ok(a.input.forward>0);assert.ok(a.input.yaw<0,'the next input must follow the new eastern goal');
});

test('a short collision-clear same-node objective approach reaches a dropped device',()=>{
 const {m,a}=droppedGoal();
 assert.equal(m.nav.nearest(a.x,a.z),m.nav.nearest(m.bomb!.x,m.bomb!.z));
 assert.deepEqual(m.nav.path(a.x,a.z,m.bomb!.x,m.bomb!.z),[]);
 for(let n=0;n<90&&m.bomb!.state==='dropped';n++)m.step(dt);
 assert.equal(m.bomb!.state,'carried');assert.equal(m.bomb!.carrier,a.id);
});

test('a same-node diagonal blocked by a crate cannot use an axis-slide detour',()=>{
 const {m,a}=droppedGoal();Object.assign(a,{x:-17.6,z:-12});Object.assign(m.bomb!,{x:-16,z:-13.6});
 // A coarse single-node graph isolates the no-route fallback; collision stays real.
 m.nav.nodes=[{x:-16,z:-12,links:[]}];
 const moved=engine.move(a.x,a.y,a.z,1.6,-1.6,R.radius,R.standingHeight);
 assert.ok(Math.hypot(moved.x+16,moved.z+13.6)<.001,'one large axis slide reaches the endpoint around the corner');
 const distance=Math.hypot(1.6,1.6);
 assert.ok(engine.ray(a.x,.5,a.z,1.6/distance,0,-1.6/distance,distance)<distance,'the direct diagonal intersects the crate');
 m.botInput(a,dt);assert.equal(a.input.forward,0);
});

test('an unreachable different-node goal is never replaced by direct movement',()=>{
 const {m,a}=droppedGoal();Object.assign(m.bomb!,{x:2.2,z:20.05});
 m.nav.nodes=[{x:0,z:20,links:[]},{x:2,z:20,links:[]}];
 assert.notEqual(m.nav.nearest(a.x,a.z),m.nav.nearest(m.bomb!.x,m.bomb!.z));
 m.botInput(a,dt);assert.equal(a.input.forward,0);
});

test('spawn discards the previously tracked objective goal',()=>{
 const {m,a}=droppedGoal();a.botGoal=123;m.spawn(a,0);assert.equal(a.botGoal,-1);
});

test('a same-node goal beyond the short approach limit does not trigger direct movement',()=>{
 const {m,a}=droppedGoal();Object.assign(m.bomb!,{x:.05,z:24.05});
 m.nav.nodes=[{x:0,z:22,links:[]}];
 m.botInput(a,dt);assert.equal(a.input.forward,0);
});
