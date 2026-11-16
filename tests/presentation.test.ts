import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {WorldView} from '../src/world';
import {audioProfile} from '../shared/experience';
import {GameAudio} from '../src/audio';
import {UI} from '../src/ui';

test('weapon replacement disposes owned resources once and keeps shared geometry and flash alive',()=>{
 const world=Object.create(WorldView.prototype) as WorldView;
 Object.assign(world,{gun:new T.Group(),gunId:'',flash:new T.Mesh(new T.ConeGeometry(),new T.MeshBasicMaterial())});
 for(let cycle=0;cycle<12;cycle++){
  world.setWeapon('scout');const materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>(),shared=new Set<T.BufferGeometry>();
  world.gun.traverse(o=>{if(o instanceof T.Mesh&&o!==world.flash){for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);if(o.geometry.type!=='BoxGeometry')geometries.add(o.geometry);else shared.add(o.geometry);}});
  let materialDisposals=0,geometryDisposals=0,flashDisposals=0,sharedDisposals=0;for(const g of shared)g.addEventListener('dispose',()=>sharedDisposals++);for(const m of materials)m.addEventListener('dispose',()=>materialDisposals++);for(const g of geometries)g.addEventListener('dispose',()=>geometryDisposals++);world.flash.geometry.addEventListener('dispose',()=>flashDisposals++);
  world.setWeapon('sidearm');assert.equal(materialDisposals,materials.size);assert.equal(geometryDisposals,geometries.size);assert.equal(flashDisposals,0);assert.equal(sharedDisposals,0);assert(world.gun.children.includes(world.flash));
 }
});
test('objective, reload and result cues have distinct bounded signatures',()=>{
 const types=['reload-start','reload-complete','reload-cancel','interaction-start','interaction-cancel','bomb-pickup','bomb-drop','plant','defuse','round','bomb-warning','bomb-critical'];
 const profiles=types.map(type=>audioProfile(type,undefined,false));assert.equal(new Set(profiles.map(p=>JSON.stringify(p))).size,types.length);
 for(const p of profiles){assert(p.duration>0&&p.duration<=.9);assert(p.level>0&&p.level<=.5);}
});
test('bomb clock emits spatial warning, accelerates late and resets on terminal and round change',()=>{
 const audio=new GameAudio({} as any),events:any[]=[];audio.event=(...args:any[])=>{events.push(args);};const listener={x:1,y:0,z:0,yaw:0};
 const snapshot:any={round:1,phase:'live',bomb:{state:'planted',x:8,y:0,z:2,remaining:30},self:{id:'self'}};
 for(let i=0;i<20;i++)(audio as any).update(.1,snapshot,listener);assert.equal(events.length,2);assert.equal(events[0][0].x,8);assert.equal(events[0][0].z,2);assert.equal(events[0][0].type,'bomb-warning');
 events.length=0;snapshot.bomb.remaining=5;for(let i=0;i<10;i++)(audio as any).update(.1,snapshot,listener);assert.equal(events.length,2);assert.equal(events[0][0].type,'bomb-critical');
 snapshot.bomb.terminal='defused';(audio as any).update(2,snapshot,listener);assert.equal(events.length,2);delete snapshot.bomb.terminal;snapshot.round=2;(audio as any).update(.1,snapshot,listener);assert.equal(events.length,2);
});
test('blast killfeed identifies the bomb rather than inventing a killer',()=>{
 const ui=Object.create(UI.prototype) as UI;ui.killLines=[];ui.event({id:1,type:'kill',target:'victim',text:'Device blast'},{self:{id:'self'},players:[{id:'victim',name:'Vega'}]} as any);assert.match(ui.killLines[0].text,/Bomb blast/);assert.doesNotMatch(ui.killLines[0].text,/Operator/);
});
