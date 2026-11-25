import * as T from 'three';
import {ImpactMarks} from './impact-marks';
import {BOXES} from '../shared/map';
import type {GameEvent} from '../shared/protocol';

// A small atlas-free sprite shared by every dust puff and flash.
function cloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 19; i++) {
    const angle = i * 2.39996;
    const offset = 23 * Math.sqrt(i / 19);
    const x = 48 + Math.cos(angle) * offset, y = 48 + Math.sin(angle) * offset;
    const radius = 23 - (i % 5);
    const plume = ctx.createRadialGradient(x,y,0,x,y,radius);
    plume.addColorStop(0,'rgba(255,255,255,.67)');
    plume.addColorStop(.45,'rgba(255,255,255,.42)');
    plume.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = plume;
    ctx.fillRect(x-radius,y-radius,2*radius,2*radius);
  }
  return new T.CanvasTexture(canvas);
}

interface Puff {
  sprite:T.Sprite;
  age:number;
  duration:number;
  start:number;
  end:number;
  opacity:number;
  drift:T.Vector3;
}

// No impact cloud in empty air or at a player's hitbox.
function touchesScenery(x:number,y:number,z:number) {
  const slop = .08;
  if (Math.abs(y) <= slop) return true;
  return BOXES.some(b => Math.abs(x-b.x)<=b.w/2+slop && Math.abs(z-b.z)<=b.d/2+slop
    && y>=b.y-slop && y<=b.y+b.h+slop);
}

export class CombatEffects {
  private readonly cloud = cloudTexture();
  private readonly puffs:Puff[] = [];
  private readonly traces:{line:T.Line<T.BufferGeometry,T.LineBasicMaterial>;age:number}[] = [];

  private readonly impactMarks:ImpactMarks;
  constructor(private scene:T.Scene) { this.impactMarks=new ImpactMarks(scene); }
  clear(){this.impactMarks.clear();}

  private puff(position:T.Vector3, color:number, start:number, end:number, duration:number,
               opacity:number, drift:T.Vector3, glow=false) {
    if (this.puffs.length>=32) this.retire(this.puffs.shift()!);
    const material=new T.SpriteMaterial({map:this.cloud,color,opacity,transparent:true,depthWrite:false,
      rotation:(position.x + position.z + this.puffs.length)*1.6,
      blending:glow?T.AdditiveBlending:T.NormalBlending});
    const sprite=new T.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.setScalar(start);
    this.scene.add(sprite);
    this.puffs.push({sprite,age:0,duration,start,end,opacity,drift});
  }

  shot(e:GameEvent, muzzle:T.Vector3|null=null) {
    const {x,y,z,ex,ey,ez}=e;
    if (x===undefined||y===undefined||z===undefined||ex===undefined||ey===undefined||ez===undefined) return;
    const origin=muzzle??new T.Vector3(x,y,z), end=new T.Vector3(ex,ey,ez);
    const distance=origin.distanceTo(end);
    if (!Number.isFinite(distance)||distance<.05) return;
    const start=muzzle??origin.clone().lerp(end,Math.min(1,.7/distance));
    const geometry=new T.BufferGeometry().setFromPoints([start,end]);
    const line=new T.Line(geometry,new T.LineBasicMaterial({color:0xffe3b2,opacity:.63,transparent:true,depthWrite:false}));
    if (this.traces.length>=24) this.removeTrace(this.traces.shift()!.line);
    this.scene.add(line);
    this.traces.push({line,age:0});
    this.impactMarks.stamp(ex,ey,ez,e.id);
    if (touchesScenery(ex,ey,ez)) {
      end.lerp(origin,Math.min(1,.075/distance));
      this.puff(end,0xbfae93,.08,.44,.28,.56,new T.Vector3(0,.46,0));
    }
  }

  explode(x:number,y:number,z:number) {
    if (![x,y,z].every(Number.isFinite)) return;
    const center=new T.Vector3(x,y+.35,z);
    this.puff(center,0xffc47c,.55,4,.19,1,new T.Vector3(0,1.6,0),true);
    for(let i=0;i<8;i++) {
      const angle=i*Math.PI/4;
      const drift=new T.Vector3(Math.cos(angle),.35+(i%3)*.35,Math.sin(angle));
      const start=center.clone().addScaledVector(drift,.18);
      this.puff(start,i%2?0x766b60:0x9e8f7c,.6,2.3+(i%3)*.3,.75+(i%3)*.15,.64,drift.multiplyScalar(2.2));
    }
  }

  update(dt:number) {
    for(let i=this.puffs.length-1;i>=0;i--) {
      const puff=this.puffs[i];
      puff.age+=dt;
      const t=puff.age/puff.duration;
      if(t>=1) { this.retire(puff); this.puffs.splice(i,1); continue; }
      puff.sprite.position.addScaledVector(puff.drift,dt*(1-t));
      puff.sprite.scale.setScalar(T.MathUtils.lerp(puff.start,puff.end,1-(1-t)**2));
      puff.sprite.material.opacity=puff.opacity*(1-t)**1.5;
    }
    for(let i=this.traces.length-1;i>=0;i--) {
      const trace=this.traces[i];
      trace.age+=dt;
      if(trace.age>=.065) { this.removeTrace(trace.line); this.traces.splice(i,1); }
      else trace.line.material.opacity=.63*(1-trace.age/.065);
    }
  }

  private retire(puff:Puff) { puff.sprite.removeFromParent(); puff.sprite.material.dispose(); }
  private removeTrace(line:T.Line<T.BufferGeometry,T.LineBasicMaterial>) {
    line.removeFromParent(); line.geometry.dispose(); line.material.dispose();
  }
}
