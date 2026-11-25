import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RemoteMotion} from '../src/remote-motion';
import type {PublicPlayer, Snapshot} from '../shared/protocol';

const player={id:'guest',alive:true,team:'attack',x:0,y:0,z:0,pitch:0,yaw:Math.PI-.1} as PublicPlayer;
const packet=(p:PublicPlayer,tick:number,round=1)=>({players:[p],self:{id:'host'},tick,round,time:tick/60,room:'r'} as Snapshot);

test('20 Hz remote poses stay continuous through packet jitter and short-arc yaw',()=>{
 const motion=new RemoteMotion();motion.receive(packet(player,3),100);
 const b={...player,x:1,yaw:-Math.PI+.1};motion.receive(packet(b,6),150);
 const middle=motion.sample(b,175);assert(Math.abs(middle.x-.5)<1e-6);assert(Math.abs(middle.yaw-Math.PI)<1e-6);
 const c={...b,x:1.4};motion.receive(packet(c,9),175);
 assert(Math.abs(motion.sample(c,175).x-middle.x)<1e-6);
 assert.equal(motion.sample(c,240).x,1.4);
 assert.equal(b.x,1);
});
test('round transitions, new lives, teleports and cleared sessions snap immediately',()=>{
 const motion=new RemoteMotion();motion.receive(packet(player,3),100);
 const far={...player,x:16};motion.receive(packet(far,6),150);assert.equal(motion.sample(far,151).x,16);
 const dead={...far,alive:false,x:17};motion.receive(packet(dead,9),200);assert.equal(motion.sample(dead,200).x,17);
 const respawn={...far,x:18};motion.receive(packet(respawn,12),250);assert.equal(motion.sample(respawn,250).x,18);
 motion.receive(packet(far,15,2),300);assert.equal(motion.sample(far,300).x,16);
 motion.clear();assert.equal(motion.sample(player,301),player);
});
