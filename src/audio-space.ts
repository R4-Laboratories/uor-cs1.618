import {BOXES, groundSurfaceAt} from '../shared/map';
import type {ContactSurface} from './audio-foley';

/** The contact point is the actor's feet, in the same collision space as movement. */
export function footSurface(x:number, y:number, z:number):ContactSurface {
  if(y>.08){
    const top=BOXES.find(b=>Math.abs(y-b.y-b.h)<.12 && Math.abs(x-b.x)<=b.w/2+.05 && Math.abs(z-b.z)<=b.d/2+.05);
    if(top)return top.material==='crate'?'wood':top.material==='metal'?'metal':'stone';
  }
  return groundSurfaceAt(x,z);
}

/** Stronger first returns between nearby hard walls. Cached audio samples stay dry
 * so the same voice can open up when its emitter moves from the arcade into a yard. */
export function enclosureAt(x:number, y:number, z:number) {
  let acrossX=12, acrossZ=12;
  for(const b of BOXES){
    if(y<b.y || y>b.y+b.h)continue;
    const dx=Math.abs(x-b.x)-b.w/2, dz=Math.abs(z-b.z)-b.d/2;
    if(dz<=0 && dx>=0)acrossX=Math.min(acrossX,dx);
    if(dx<=0 && dz>=0)acrossZ=Math.min(acrossZ,dz);
  }
  return 1-(acrossX+acrossZ)/24;
}
