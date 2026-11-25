import * as T from 'three';
import type {VerdantEngine} from '../shared/engine';
import type {PublicPlayer} from '../shared/protocol';
import {RULES} from '../shared/config';

const forward = new T.Vector3();

/** Distance under the center pixel, against the same map and upright player
 * bounds the match uses. Weapon poses are presentation only. */
export function crosshairDepth(camera:T.PerspectiveCamera, engine:VerdantEngine | null,
                              players:readonly PublicPlayer[], self:string, limit:number) {
  if (!engine) return limit;
  forward.set(0,0,-1).applyQuaternion(camera.quaternion);
  const {x,y,z} = camera.position;
  let depth = engine.ray(x,y,z,forward.x,forward.y,forward.z,limit);
  for (const p of players) {
    if (p.id===self || !p.alive) continue;
    const hit = engine.hitbox(x,y,z,forward.x,forward.y,forward.z,p.x,p.y,p.z,
      .31,p.crouch ? RULES.crouchHeight : RULES.standingHeight);
    if (hit >= 0 && hit < depth) depth = hit;
  }
  return depth;
}

/** Local -Z is the weapon axis. Place its pivot at barrel height for hip fire,
 * or at the sight line when sighted. In YXZ order roll rotates around that
 * axis and cannot break convergence. Near-field rendering uses a short virtual
 * working distance so the overlay doesn't turn back through the player's eye. */
export function convergeViewmodel(gun:T.Group, depth:number, roll:number) {
  const {x,y,z}=gun.position;
  const dz=Math.max(2.25,depth)+z;
  const pitch=Math.atan2(-y,Math.hypot(x,dz));
  const yaw=Math.atan2(x,dz);
  gun.rotation.set(pitch,yaw,roll,'YXZ');
}

/** Match screen coordinates across the independently lensed overlay and world
 * cameras. A close surface clips the visual trace, preserving its screen origin. */
export function muzzleToWorld(muzzle:T.Vector3, overlay:T.PerspectiveCamera,
                             world:T.PerspectiveCamera, hit:T.Vector3) {
  const end=world.worldToLocal(hit.clone());
  if(end.z>=-world.near) return null;
  const depth=Math.min(-muzzle.z,-end.z*.84);
  const lens=Math.tan(world.fov*Math.PI/360)/Math.tan(overlay.fov*Math.PI/360);
  const scale=depth/-muzzle.z;
  return world.localToWorld(new T.Vector3(muzzle.x*scale*lens,muzzle.y*scale*lens,-depth));
}
