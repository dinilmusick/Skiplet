import assert from 'node:assert/strict';
import test from 'node:test';
import { computeSpatialParams } from '../src/libraries/utils/audio/spatial3d.ts';
import { createAudioEngine } from '../src/libraries/utils/audio/soundEngine.ts';
import { createInteractionBus } from '../src/libraries/utils/interactionEvents.ts';

test('computeSpatialParams increases gain and cutoff as camera approaches and faces source', () => {
  const forward = { x: 0, y: 0, z: -1 };
  const right = { x: 1, y: 0, z: 0 };
  const source = { x: 0, y: 0, z: 0 };

  const far = computeSpatialParams({ x: 0, y: 0, z: 18 }, right, forward, source, 24, 3);
  const near = computeSpatialParams({ x: 0, y: 0, z: 4 }, right, forward, source, 24, 3);

  assert.ok(near.gain > far.gain, 'closer source is louder');
  assert.ok(near.cutoffHz > far.cutoffHz, 'closer source is brighter');
  assert.ok(Math.abs(near.pan) < 0.05, 'centered source pans near center');

  const offLeft = computeSpatialParams({ x: 6, y: 0, z: 6 }, right, forward, source, 24, 3);
  const offRight = computeSpatialParams({ x: -6, y: 0, z: 6 }, right, forward, source, 24, 3);
  assert.ok(offLeft.pan < -0.3, 'source to camera left pans negative');
  assert.ok(offRight.pan > 0.3, 'source to camera right pans positive');
});

test('audio engine and interaction bus handle headless fallback, mute, and long clip envelopes', () => {
  const audio = createAudioEngine();
  const events = [];
  const bus = createInteractionBus(audio);
  const unsub = bus.subscribe(e => events.push(e.kind));

  assert.equal(audio.isMuted(), false);
  assert.equal(audio.toggleMuted(), true);
  assert.equal(audio.toggleMuted(), false);

  bus.emitScroll(1, 1);
  bus.emitClick('button-click');
  bus.emitLandmarkEnter('lm-1', {
    id: 'clip-1',
    durationSeconds: 10,
    baseHz: 140,
    intervals: [1, 1.5],
    pulseHz: 1,
  });

  const env = audio.getClipEnvelope();
  assert.equal(env.active, true);
  assert.equal(env.clipId, 'clip-1');
  assert.ok(env.amplitude >= 0 && env.amplitude <= 1);

  bus.emitLandmarkExit('lm-1');
  assert.equal(audio.getClipEnvelope().active, false);
  assert.deepEqual(events, ['scroll', 'click', 'landmark-enter', 'landmark-exit']);

  unsub();
  audio.dispose();
});
