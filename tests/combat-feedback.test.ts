import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WEAPONS} from '../shared/config';
import type {Motion, GameEvent} from '../shared/protocol';
import {incomingBearing, screenBearing, reticleGap} from '../src/combat-feedback';

const standing: Motion = {x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, grounded: true, crouch: false};

test('running, jumping and firing expand the reticle, crouching tightens it', () => {
  const gap = (motion: Partial<Motion>, recoil = 0) => reticleGap(WEAPONS.m4, {...standing, ...motion}, recoil, 800, 76);
  assert.ok(gap({crouch: true}) < gap({}));
  assert.ok(gap({vx: 5}) > gap({}));
  assert.ok(gap({grounded: false}) > gap({vx: 5}));
  assert.ok(gap({}, .06) > gap({}));
});

test('damage bearings follow the confirmed incoming ray as the camera turns', () => {
  const shot: GameEvent = {id: 15, type: 'shot', actor: 'enemy', at: 1.5, x: 5, z: 10, ex: 0, ez: 10};
  const hit: GameEvent = {id: 16, type: 'hit', actor: shot.actor, at: shot.at, target: 'self'};
  const direction = incomingBearing(hit, [shot, hit], 'self');
  assert.equal(direction, Math.PI / 2);
  assert.equal(screenBearing(direction!, -Math.PI / 2), 0);
  for (const previous of [{...shot, id: 14}, {...shot, actor: 'other'}, {...shot, at: 3}, {...shot, ex: shot.x}]) {
    assert.equal(incomingBearing(hit, [previous, hit], 'self'), null);
  }
  assert.equal(incomingBearing(hit, [shot, hit], 'teammate'), null);
});
