import assert from 'node:assert/strict';
import test from 'node:test';
import { directionVector, swipeDirection } from '../src/libraries/utils/directionalCarousel.ts';

test('configurable direction supports horizontal, vertical, and diagonal travel', () => {
  const horizontal = directionVector(0);
  const vertical = directionVector(90);
  const diagonal = directionVector(45);
  assert.ok(Math.abs(horizontal.x - 1) < 0.00001);
  assert.ok(Math.abs(vertical.y - 1) < 0.00001);
  assert.ok(Math.abs(diagonal.x - diagonal.y) < 0.00001);
});
test('swipe advances opposite the configured travel axis', () => {
  assert.equal(swipeDirection(-90, 0, 0), 1);
  assert.equal(swipeDirection(90, 0, 0), -1);
  assert.equal(swipeDirection(0, -90, 90), 1);
  assert.equal(swipeDirection(-80, -80, 45), 1);
  assert.equal(swipeDirection(-10, 0, 0), 0);
});
test('any finite angle is valid; invalid direction is rejected', () => {
  assert.equal(swipeDirection(-90, 0, 360), 1);
  assert.throws(() => directionVector(Number.NaN), /finite/);
});
