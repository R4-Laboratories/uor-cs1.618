import {quality} from '../model/verdant-3d.json';
import type {VerdantEngine} from '../shared/engine';
/** Cadence measurement, not a GPU benchmark. Deadband absorbs normal vsync jitter. */
export class HdBudget {
 private seconds=0;private frames=0;
 constructor(private engine:VerdantEngine){}
 reset(){this.seconds=0;this.frames=0;}
 sample(lod:number,dt:number,active:boolean){
  if(!active){this.reset();return lod;}
  if(!Number.isFinite(dt)||dt<=0||dt>=.25)return lod;
  this.seconds+=dt;this.frames++;
  if(this.seconds<quality.sampleSeconds)return lod;
  const micros=this.seconds/this.frames*1e6;this.reset();
  const deadband=micros>=quality.headroomMicros&&micros<=quality.overloadMicros;
  return this.engine.recommendLod(lod,micros,deadband);
 }
}
