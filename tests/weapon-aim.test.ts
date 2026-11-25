import assert from 'node:assert/strict';
import test from 'node:test';
import * as T from 'three';
import {convergeViewmodel,muzzleToWorld} from '../src/weapon-aim';
import {WEAPONS} from '../shared/config';
import {carriedLength} from '../src/operator-kit';
import {createViewmodel} from '../src/viewmodel';

test('the animated weapon axis converges on the reticle even with movement and roll',()=>{
  const gun=new T.Group();
  for(const depth of [2.25,6,38,130]){
    for(const lateral of [0,.04,.31]){
      gun.position.set(lateral,-lateral*.7,-.53);
      convergeViewmodel(gun,depth,.22);
      const axis=new T.Vector3(0,0,-1).applyQuaternion(gun.quaternion);
      const target=gun.position.clone().addScaledVector(axis,(-depth-gun.position.z)/axis.z);
      assert(Math.hypot(target.x,target.y)<1e-10);
    }
  }
});

test('world tracers and overlay share their muzzle pixel across lenses, aspects, and close obstructions',()=>{
  for(const aspect of [.48,1.5,2.4]){
    for(const fov of [32,65,76]){
      const overlay=new T.PerspectiveCamera(58,aspect,.01,10);
      const world=new T.PerspectiveCamera(fov,aspect,.05,200);
      world.position.set(-5,.96,12);world.rotation.set(.27,.75,0,'YXZ');
      world.updateMatrixWorld();
      const muzzle=new T.Vector3(.10,-.08,-1.22);
      for(const depth of [.18,.32,3,110]){
        const end=world.localToWorld(new T.Vector3(0,0,-depth));
        const origin=muzzleToWorld(muzzle,overlay,world,end)!;
        const a=muzzle.clone().project(overlay),b=origin.clone().project(world);
        assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-10);
        assert(-world.worldToLocal(origin).z<depth);
      }
    }
  }
});

test('every buyable model has distinct fitted geometry and a clear sight line over the barrel',()=>{
  const shapes=new Set<string>();
  for(const id of Object.keys(WEAPONS)){
    const model=createViewmodel(id);
    const points=model.root.getObjectByName('coated-chassis') as T.Mesh;
    points.geometry.computeBoundingBox();
    const position=points.geometry.getAttribute('position');
    let sum=0;
    for(let i=0;i<position.count;i++)sum+=position.getZ(i)**2;
    shapes.add(position.count+'/'+sum.toFixed(4));
    assert(model.sightHeight>.016&&model.muzzle<-.45);
    assert(carriedLength(id)>.1);
    model.root.traverse(part=>{if(part instanceof T.Mesh){part.geometry.dispose();part.material.map?.dispose();part.material.dispose();}});
  }
  assert.equal(shapes.size,Object.keys(WEAPONS).length);
});
