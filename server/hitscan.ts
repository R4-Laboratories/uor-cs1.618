import {RULES, type Weapon} from '../shared/config';
import type {VerdantEngine} from '../shared/engine';
import type {HitZone} from '../shared/protocol';
import type {Player} from './match';

// Relative bounds follow the standing and crouching character silhouettes. Heights are
// measured from the actor's feet. The first intersection wins, including friendly bodies.
const zones: ReadonlyArray<{name:HitZone; lower:number; upper:number; radius:number}> = [
 {name:'torso', lower:.40, upper:.82, radius:.31},
 {name:'head', lower:.82, upper:1, radius:.16},
 {name:'legs', lower:0, upper:.40, radius:.245},
];

export function tracePellet(engine:VerdantEngine, players:Iterable<Player>, shooter:Player,
 eye:number, yaw:number, pitch:number, range:number) {
 const cosPitch=Math.cos(pitch);
 const dx=-Math.sin(yaw)*cosPitch, dy=Math.sin(pitch), dz=-Math.cos(yaw)*cosPitch;
 let distance=engine.ray(shooter.x,eye,shooter.z,dx,dy,dz,range);
 let target:Player|undefined, zone:HitZone='torso';
 for (const other of players) {
  if (!other.alive || other===shooter) continue;
  const height=other.crouch ? RULES.crouchHeight : RULES.standingHeight;
  const bounds=engine.hitbox(shooter.x,eye,shooter.z,dx,dy,dz,other.x,other.y,other.z,.31,height);
  if (bounds<0 || bounds>=distance) continue;
  for (const part of zones) {
   const hit=engine.hitbox(shooter.x,eye,shooter.z,dx,dy,dz,other.x,other.y+height*part.lower,other.z,
    part.radius,height*(part.upper-part.lower));
   if (hit>=0 && hit<distance) { distance=hit; target=other; zone=part.name; }
  }
 }
 return {target,zone,distance,ex:shooter.x+dx*distance,ey:eye+dy*distance,ez:shooter.z+dz*distance};
}

/** Arena balance in integer health points. One armor point absorbs one damage point. */
export function impactDamage(weapon:Weapon, distance:number, zone:HitZone, armor:number) {
 const multiplier=zone==='head' ? weapon.head : zone==='legs' ? .76 : 1;
 const scale=1-weapon.falloff*Math.min(1,Math.max(0,distance)/weapon.range);
 const raw=Math.max(1,Math.round(weapon.damage*scale*multiplier));
 const protectedHealth=Math.max(1,Math.round(raw*weapon.armorRatio));
 const armorDamage=zone==='legs' ? 0 : Math.min(armor,raw-protectedHealth);
 return {damage:raw-armorDamage,armorDamage};
}
