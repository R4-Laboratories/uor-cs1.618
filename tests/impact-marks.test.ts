import test from 'node:test';
import assert from 'node:assert/strict';
import {impactSurface} from '../src/impact-marks';
import type {Box} from '../shared/map';
const crate:Box={id:'c',x:2,y:0,z:-4,w:2,h:3,d:2,material:'crate'};
test('impact marks use the reported surface and face direction, without marking open air',()=>{
 assert.deepEqual(impactSurface(3.01,1,-4,[crate])?.normal.toArray(),[1,0,0]);
 assert.equal(impactSurface(3.01,1,-4,[crate])?.position.x,3);
 assert.deepEqual(impactSurface(2,3,-4,[crate])?.normal.toArray(),[0,1,0]);
 assert.equal(impactSurface(1,2.99,-4,[crate])!.clearance<.02,true);
 assert.equal(impactSurface(2,1,-4,[crate]),null);
 assert.equal(impactSurface(10,1,-10,[crate]),null);
 assert.equal(impactSurface(10,0,-10,[crate])?.material,'paving');
 assert.equal(impactSurface(NaN,0,3,[crate]),null);
});
