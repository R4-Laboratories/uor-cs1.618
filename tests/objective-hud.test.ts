import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plantedObjective,objectiveHint} from '../shared/objective-hud';
import type {Snapshot,Motion} from '../shared/protocol';
const fixture=()=>({phase:'live',round:1,self:{id:'local',team:'defend',alive:true,kit:false,action:'',progress:0},bomb:{state:'planted',site:'B',remaining:12,defuser:null}} as Snapshot);
test('local defuse estimate accounts for kit and only consumes own authoritative progress',()=>{
 const s=fixture();let card=plantedObjective(s)!;assert(card);
 assert.equal(card.requiredSeconds,10);assert.equal(card.margin,2);assert.equal(card.fuseFraction,.3);
 s.self.kit=true;card=plantedObjective(s)!;assert.equal(card.requiredSeconds,5);assert.equal(card.margin,7);
 s.self.action='DEFUSING';s.self.progress=.6;s.bomb!.defuser='local';card=plantedObjective(s)!;
 assert.equal(card.mode,'defusing');assert.equal(card.defuseLeft,2);assert.equal(card.margin,10);
 s.bomb!.defuser='teammate';card=plantedObjective(s)!;assert.equal(card.mode,'cover');assert.equal(card.margin,null);assert.equal(card.requiredSeconds,null);assert.equal(card.defuseLeft,null);assert.match(objectiveHint(s,{x:0,y:0,z:0} as Motion),/TEAMMATE DEFUSING/);
 s.bomb!.defuser=null;card=plantedObjective(s)!;assert.equal(card.defuseLeft,5);assert.equal(card.margin,7);
});
test('planted card handles late fuse and hides expired, terminal and transition states',()=>{
 const s=fixture();s.bomb!.remaining=3;assert(plantedObjective(s));assert.equal(plantedObjective(s)!.margin,-7);
 s.self.alive=false;assert.equal(plantedObjective(s)!.mode,'spectating');assert.equal(plantedObjective(s)!.margin,null);
 s.self.alive=true;s.self.team='attack';assert.equal(plantedObjective(s)!.mode,'protect');assert.equal(plantedObjective(s)!.requiredSeconds,null);
 for(const remaining of [0,-1,NaN]){s.bomb!.remaining=remaining;assert.equal(plantedObjective(s),null);}
 s.bomb!.remaining=12;s.bomb!.terminal='defused';assert.equal(plantedObjective(s),null);delete s.bomb!.terminal;
 for(const phase of ['freeze','ended','matchEnd','waiting'] as const){s.phase=phase;assert.equal(plantedObjective(s),null);}
 s.phase='live';s.bomb!.state='dropped';assert.equal(plantedObjective(s),null);
});
