import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {Match} from '../server/match';
import {BrowserMatchHost} from '../shared/browser-host';
import {RULES, type Team} from '../shared/config';
import {createEngine} from '../shared/engine';
import {MAP} from '../shared/map';
import {createRoundKernel} from '../shared/round-kernel';

const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
const kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
const tick=1/RULES.tickRate;

// Exercise the production round kernel without waiting on the live and break clocks.
function winRound(match:Match, winner:Team){
 match.phase='live';
 match.phaseLeft=winner==='defend'?0:RULES.roundSeconds;
 if(winner==='attack')for(const p of match.players.values())if(p.team==='defend')p.alive=false;
 match.step(tick);
 assert.equal(match.winner,winner);
}
function finishBreak(match:Match){
 match.phaseLeft=0;
 match.step(tick);
}

test('solo practice and browser hosts can start on either side and full bot rooms balance incoming humans',t=>{
 for(const [roll,side] of [[.49,'attack'],[.5,'defend']] as const){
  const draw=t.mock.method(Math,'random',()=>roll);
  const practice=new Match('PRACTICE',engine,kernel);
  const solo=practice.join('local','Local','auto')!;
  practice.enableBots();
  assert.equal(solo.team,side);
  assert.equal(practice.players.get(practice.bomb!.carrier!)!.team,'attack');

  const match=new Match('BROWSER',engine,kernel);
  const host=new BrowserMatchHost(match,'secret',()=>{},()=>assert.fail('unexpected rejection'));
  for(let i=0;i<RULES.maxPlayers;i++){
   const id=i===0?'host':`guest-${i}`;
   assert(host.open(id));
   host.message(id,{type:'join',token:'secret',name:id,team:'auto',bots:i===0});
   const members=[...match.players.values()];
   const humans=members.filter(p=>!p.bot);
   assert.equal(members.length,RULES.maxPlayers);
   assert.equal(members.filter(p=>p.team==='attack').length,5);
   assert.equal(humans.length,i+1);
   assert.equal(match.players.get(id)!.team,i%2===0?side:side==='attack'?'defend':'attack');
   assert(Math.abs(humans.filter(p=>p.team==='attack').length-humans.filter(p=>p.team==='defend').length)<=1);
  }
  assert.equal(match.join('extra','Extra','auto'),null);
  assert.equal(draw.mock.callCount(),6,'one solo tie and five browser ties');
  draw.mock.restore();
 }
});

test('explicit choices use a bot seat on the requested side and fall back when five humans occupy it',()=>{
 const match=new Match('CHOICE',engine,kernel);
 match.enableBots();
 for(let i=0;i<5;i++)assert.equal(match.join(`pilot-${i}`,'Pilot','defend')!.team,'defend');
 assert.equal(match.join('sixth','Pilot','defend')!.team,'attack');
 assert.equal(match.players.size,10);
});

test('the device starts with an attacker and visits every attacking seat, including bots',()=>{
 const match=new Match('DEVICE',engine,kernel);
 match.join('one','One','attack',true);
 match.join('two','Two','attack');
 match.join('three','Three','attack',true);
 match.join('four','Four','defend');
 for(const id of ['two','three','one','two']){
  assert.equal(match.bomb?.carrier,id);
  winRound(match,'defend');
  finishBreak(match);
 }
});

test('a complete first-to-eight set swaps the squads once and prepares a fresh rematch',()=>{
 const match=new Match('REMATCH',engine,kernel);
 const a=match.join('a','Alpha','attack')!,d=match.join('d','Delta','defend')!;
 match.enableBots();
 const original=[...match.players.values()].map(p=>({id:p.id,team:p.team}));
 a.kills=6;a.deaths=2;d.kills=3;d.deaths=5;
 const receipt=match.snapshot(a.id).self.career;
 for(let round=1;round<=14;round++){
  assert.equal(match.round,round);
  winRound(match,round%2===1?'attack':'defend');
  assert.equal(match.phase,'ended');
  assert.equal(a.team,'attack');assert.equal(d.team,'defend');
  finishBreak(match);
 }
 assert.deepEqual(match.score,{attack:7,defend:7});
 a.money=d.money=RULES.maxMoney;
 assert.equal(match.buy(a.id,'kestrel'),null);
 assert.equal(match.buy(d.id,'m4'),null);
 assert.equal(match.buy(d.id,'kit'),null);
 assert.equal(match.buy(d.id,'armor'),null);
 winRound(match,'defend');
 match.step(tick);
 const final=match.snapshot(a.id);
 assert.equal(final.phase,'matchEnd');
 assert.equal(final.winner,'defend');
 assert.deepEqual(final.score,{attack:7,defend:8});
 assert.deepEqual(final.players.map(({id,team})=>({id,team})),original);
 assert.deepEqual([final.self.kills,final.self.deaths],[6,2]);

 finishBreak(match);
 const next=match.snapshot(a.id);
 assert.equal(next.phase,'freeze');assert.equal(next.round,1);
 assert.deepEqual(next.score,{attack:0,defend:0});assert.equal(next.winner,null);
 assert.equal(next.bomb?.carrier,d.id);
 assert.match(next.reason,/sides switched/i);
 assert.deepEqual(next.self.career,receipt);
 for(const {id,team} of original){
  const p=match.players.get(id)!;
  assert.equal(p.team,team==='attack'?'defend':'attack');
  assert.deepEqual([p.kills,p.deaths,p.health,p.alive],[0,0,100,true]);
  assert.deepEqual([p.x,p.z],MAP.spawns[p.team][p.botSlot]);
  assert.equal(p.yaw,p.team==='attack'?0:Math.PI);
  if(p.team==='attack')assert.equal(p.kit,false);
  if(!p.bot){
   assert.deepEqual([p.money,p.armor,p.kit,p.slot],[RULES.startMoney,0,false,1]);
   assert.deepEqual(p.inventory.map(g=>g.id),['sidearm','sidearm']);
  }
 }
 assert.equal(match.buy(a.id,'kit'),null);assert.equal(match.buy(d.id,'kit'),'team');
 winRound(match,'defend');finishBreak(match);
 assert.equal(match.round,2);assert.equal(a.team,'defend');assert.equal(d.team,'attack');
});

test('a disconnect during the final scoreboard preserves the result and the surviving player switches once',()=>{
 const match=new Match('WAIT',engine,kernel);
 const p=match.join('p','Pilot','attack')!;
 match.join('d','Delta','defend');
 match.score.defend=RULES.matchWin-1;
 winRound(match,'defend');
 match.leave('d');
 assert.equal(match.phase,'matchEnd');assert.equal(match.winner,'defend');
 finishBreak(match);
 assert.equal(match.phase,'waiting');assert.equal(p.team,'defend');assert.equal(match.winner,null);
 assert.deepEqual(match.score,{attack:0,defend:0});assert.equal(match.bomb,null);
 const fresh=match.join('new','New','auto')!;
 assert.equal(fresh.team,'attack');assert.equal(match.round,1);assert.equal(p.team,'defend');
 assert.equal(match.snapshot(fresh.id).bomb?.carrier,fresh.id);
});
