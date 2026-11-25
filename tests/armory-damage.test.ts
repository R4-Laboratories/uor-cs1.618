import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RULES,WEAPONS} from '../shared/config';
import {neutralInput} from '../shared/protocol';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';
import {Match} from '../server/match';
import {impactDamage,tracePellet} from '../server/hitscan';
import {incomingBearing} from '../src/combat-feedback';

const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
const round=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));

function fixture(){
 const match=new Match('ARMORY',engine,round);
 const attacker=match.join('a','Ember','attack')!, defender=match.join('d','Tidal','defend')!;
 attacker.money=12000;
 return {match,attacker,defender};
}

test('purchased sidearms survive primary replacement, slot switches and surviving rounds',()=>{
 const {match,attacker}=fixture();
 assert.equal(match.buy('a','rivet'),null);
 assert.equal(attacker.slot,1);assert.equal(attacker.input.slot,1);
 assert.equal(match.snapshot('a').self.weapon,'rivet');
 const balance=attacker.money;
 assert.equal(match.buy('a','rivet'),'owned');assert.equal(attacker.money,balance);
 assert.equal(match.buy('a','tern'),null);assert.equal(attacker.slot,0);
 assert.deepEqual(attacker.inventory.map(g=>g.id),['tern','rivet']);
 match.input('a',{...neutralInput(),seq:1,slot:1});match.step(1/60);
 assert.equal(match.snapshot('a').self.weapon,'rivet');
 assert.equal(match.buy('a','breaker'),null);
 assert.deepEqual(attacker.inventory.map(g=>g.id),['breaker','rivet']);
 assert.equal(attacker.money,12000-550-2050-1850);
 match.beginRound();
 assert.deepEqual(attacker.inventory.map(g=>g.id),['breaker','rivet']);
 attacker.alive=false;match.spawn(attacker,0);
 assert.deepEqual(attacker.inventory.map(g=>g.id),['sidearm','sidearm']);assert.equal(attacker.slot,1);
});

test('game damage has integer range falloff, limited armor absorption and uncovered lower-body hits',()=>{
 const rifle=WEAPONS.kestrel;
 assert.deepEqual(impactDamage(rifle,0,'torso',100),{damage:30,armorDamage:6});
 assert.deepEqual(impactDamage(rifle,0,'torso',2),{damage:34,armorDamage:2});
 assert.deepEqual(impactDamage(rifle,0,'legs',100),{damage:27,armorDamage:0});
 assert.deepEqual(impactDamage(rifle,0,'head',100),{damage:102,armorDamage:20});
 for(const w of Object.values(WEAPONS)){
  const near=impactDamage(w,0,'torso',0), far=impactDamage(w,w.range,'torso',0);
  assert(near.damage>far.damage && far.damage>0,w.name);
  for(const zone of ['head','torso','legs'] as const){
   const bare=impactDamage(w,8,zone,0);
   for(const armor of [1,5,100]){
    const protectedHit=impactDamage(w,8,zone,armor);
    assert.equal(protectedHit.damage+protectedHit.armorDamage,bare.damage);
    assert(protectedHit.armorDamage<=armor && protectedHit.damage>0);
   }
  }
 }
});

test('standing and crouching silhouettes leave room above shoulders and between adjacent players',()=>{
 const {match,attacker,defender}=fixture();
 Object.assign(attacker,{x:0,y:7,z:20});Object.assign(defender,{x:0,y:7,z:16});
 const fireAt=(relativeHeight:number)=>{
  const eye=attacker.y+(defender.crouch?RULES.crouchHeight:RULES.standingHeight)*relativeHeight;
  return tracePellet(engine,match.players.values(),attacker,eye,0,0,20);
 };
 for(const crouch of [false,true]){
  defender.crouch=crouch;attacker.x=0;
  assert.equal(fireAt(.92).zone,'head');assert.equal(fireAt(.67).zone,'torso');assert.equal(fireAt(.2).zone,'legs');
  attacker.x=.23;assert.equal(fireAt(.92).target,undefined);
  assert.equal(fireAt(.67).target,defender);
 }
});

test('a six-pellet discharge consumes one shell and records actual capped damage and one elimination',()=>{
 const {match,attacker,defender}=fixture();
 match.buy('a','breaker');
 Object.assign(attacker,{x:0,y:7,z:20,yaw:0,pitch:Math.atan2(1.05-RULES.eyeHeight,4)});
 Object.assign(defender,{x:0,y:7,z:16,armor:2,health:50});
 match.phase='live';const beforeMoney=attacker.money;
 match.fire(attacker);
 const shot=match.events.find(e=>e.type==='shot')!,hit=match.events.find(e=>e.type==='hit')!;
 assert.equal(shot.pellets,6);assert.equal(hit.pellets,6);assert.equal(hit.shotId,shot.id);
 assert.equal(hit.damage,50);assert.equal(hit.armorDamage,2);assert.equal(hit.zone,'torso');
 assert.equal(defender.armor,0);assert.equal(defender.health,0);assert.equal(attacker.inventory[0].ammo,4);
 assert.equal(attacker.kills,1);assert.equal(defender.deaths,1);assert.equal(attacker.money,beforeMoney+RULES.killReward);
 match.fire(attacker);assert.equal(match.events.filter(e=>e.type==='shot').length,1);
 assert.equal(match.events.filter(e=>e.type==='kill').length,1);
});

test('scatter hits on separate opponents retain a common shot origin for feedback',()=>{
 const {match,attacker,defender}=fixture();
 const adjacent=match.join('e','Tidal two','defend')!;
 match.buy('a','breaker');
 Object.assign(attacker,{x:0,y:7,z:20,yaw:0,pitch:Math.atan2(1.05-RULES.eyeHeight,9)});
 Object.assign(defender,{x:0,y:7,z:11});Object.assign(adjacent,{x:.57,y:7,z:11});
 match.random=()=>.5;
 match.fire(attacker);
 const hits=match.events.filter(e=>e.type==='hit');
 assert.equal(hits.length,2);assert.deepEqual(new Set(hits.map(h=>h.target)),new Set(['d','e']));
 assert.equal(hits[0].shotId,hits[1].shotId);
 assert.notEqual(incomingBearing(hits[1],match.events,hits[1].target!),null);
});

test('friendly bodies stop every pellet before the next opponent',()=>{
 const {match,attacker,defender}=fixture(), friendly=match.join('f','Ember two','attack')!;
 match.buy('a','breaker');
 Object.assign(attacker,{x:0,y:7,z:20,yaw:0,pitch:Math.atan2(1.2-RULES.eyeHeight,3)});
 Object.assign(friendly,{x:0,y:7,z:18});Object.assign(defender,{x:0,y:7,z:16});
 match.fire(attacker);
 assert.equal(defender.health,100);assert.equal(friendly.health,100);assert(!match.events.some(e=>e.type==='hit'));
});
