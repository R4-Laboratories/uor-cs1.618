import type {Weapon} from '../shared/config';
import {shotSpread} from '../shared/experience';
import type {GameEvent, Motion} from '../shared/protocol';

/** Screen-space inner gap, using the same movement spread as the host. Recoil
 * opens the marks further while the weapon recovers from confirmed shots. */
export function reticleGap(weapon: Weapon, motion: Motion, recoil: number, height: number, fov: number) {
  const spread = shotSpread(weapon, Math.hypot(motion.vx, motion.vz), motion.grounded, motion.crouch, false);
  const focalLength = height / (2 * Math.tan(fov * Math.PI / 360));
  const projected = focalLength * Math.tan(spread + Math.max(0, recoil) * 0.18);
  return Math.min(30, Math.max(2, projected + 1));
}

/** A hit directly follows its host shot. Reconstruct the incoming direction
 * from that ray, even if the shooter has moved since it was fired. */
export function incomingBearing(hit: GameEvent, events: readonly GameEvent[], receiver: string) {
  if (hit.type !== 'hit' || hit.target !== receiver || !hit.actor) return null;
  const shot = events.find(event => event.id === hit.id - 1);
  if (shot?.type !== 'shot' || shot.actor !== hit.actor || shot.at !== hit.at) return null;
  if (shot.x === undefined || shot.z === undefined || shot.ex === undefined || shot.ez === undefined) return null;
  const dx = shot.x - shot.ex;
  const dz = shot.z - shot.ez;
  if (!Number.isFinite(dx) || !Number.isFinite(dz) || Math.hypot(dx, dz) < 0.01) return null;
  return Math.atan2(dx, -dz);
}

export function screenBearing(bearing: number, cameraYaw: number) {
  const relative = bearing + cameraYaw;
  return Math.atan2(Math.sin(relative), Math.cos(relative));
}
