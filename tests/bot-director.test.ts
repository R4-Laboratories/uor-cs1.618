import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Match} from '../server/match';
import {createEngine} from '../shared/engine';
import {createRoundKernel} from '../shared/round-kernel';
import {replayBotRounds} from '../scripts/bot-round-review';

const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
const kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));

test('full squads use separate map stations and assign one dropped-device recovery',()=>{
 const m=new Match('SQUAD',engine,kernel);
 m.enableBots();
 m.phase='live';
 const actors=[...m.players.values()];
 const attackers=actors.filter(p=>p.team==='attack'),defenders=actors.filter(p=>p.team==='defend');
 for(const p of actors)m.botInput(p,1/60);
 assert.equal(new Set(defenders.map(p=>p.botGoal)).size,5);
 assert.equal(new Set(attackers.map(p=>p.botLane).filter(Boolean)).size,4);
 const [owner]=attackers;
 m.bomb={state:'dropped',carrier:null,x:owner.x,y:0,z:owner.z,site:null,remaining:40};
 const pickup=m.nav.nearest(owner.x,owner.z);
 for(const p of attackers)m.botInput(p,1/60);
 assert.deepEqual(attackers.filter(p=>p.botGoal===pickup).map(p=>p.id),[owner.id]);
 owner.alive=false;
 for(const p of attackers.slice(1))m.botInput(p,1/60);
 assert.equal(attackers.slice(1).filter(p=>p.botGoal===pickup).length,1);
});

test('bot purchases use squad budgets and exhausted primaries switch to a stocked secondary',()=>{
 const m=new Match('ARMORY',engine,kernel);
 m.enableBots();
 for(const p of m.players.values()){p.alive=false;p.money=6500;}
 m.beginRound();
 const team=[...m.players.values()].filter(p=>p.team==='attack');
 assert.deepEqual(new Set(team.map(p=>p.inventory[0].id)),new Set(['kestrel','breaker','tern','smg','scout']));
 assert(team.every(p=>p.money<6500));
 const [bot]=team;
 bot.inventory[0].ammo=0;bot.inventory[0].reserve=0;m.phase='live';
 m.botInput(bot,1/60);
 assert.equal(bot.input.slot,1);
});

test('seeded rounds disperse both teams, maintain movement in contact, and reach objectives',()=>{
 const proof=replayBotRounds(engine,kernel,[0]);
 assert.equal(proof.rounds.length,3);
 assert(proof.nearTeammateFraction<.5,`crowded bot samples: ${proof.nearTeammateFraction}`);
 assert(proof.movingWithContactFraction>.4,`moving with visible contact: ${proof.movingWithContactFraction}`);
 assert(new Set(proof.rounds.flatMap(r=>r.firstContact)).size>=3);
 assert(proof.plantRounds>=1,'A normal bot round should reach the objective');
});
