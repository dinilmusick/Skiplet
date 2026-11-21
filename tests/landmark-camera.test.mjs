import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_ORBIT_STATE,
  resolveLandmarkCameraTarget,
  stepCameraRig,
} from '../src/libraries/components/Annotated3DScene/landmarkCamera.ts';
import { stepLandmarkIndex } from '../src/libraries/components/Annotated3DScene/landmarkNavigation.ts';

test('resolveLandmarkCameraTarget frames default orbit vs zoomed/panned landmark pose', () => {
  const basePose = resolveLandmarkCameraTarget(DEFAULT_ORBIT_STATE);
  const landmarkPose = resolveLandmarkCameraTarget(DEFAULT_ORBIT_STATE, {
    yaw: -0.5,
    pitch: 0.25,
    radius: 4.8,
    lookAt: [0.4, 0.2, 0.2],
    panOffset: [1.1, 0, 0],
    fov: 37,
  });

  assert.equal(basePose.fov, DEFAULT_ORBIT_STATE.fov);
  assert.equal(landmarkPose.fov, 37);
  assert.ok(
    landmarkPose.position.distanceTo(landmarkPose.lookAt) < basePose.position.distanceTo(basePose.lookAt),
    'landmark pose zooms closer than default view frame',
  );
});

test('stepCameraRig smoothly transitions into landmark and back to default view frame', () => {
  const defaultTarget = resolveLandmarkCameraTarget(DEFAULT_ORBIT_STATE);
  const landmarkTarget = resolveLandmarkCameraTarget(DEFAULT_ORBIT_STATE, {
    yaw: 0.6,
    pitch: 0.2,
    radius: 4.5,
    lookAt: [0.3, 0.2, 0],
    fov: 36,
  });

  const rig = {
    position: defaultTarget.position.clone(),
    lookAt: defaultTarget.lookAt.clone(),
    fov: defaultTarget.fov,
  };

  for (let i = 0; i < 60; i++) stepCameraRig(rig, landmarkTarget, 0.03, 4.5, false);
  assert.ok(rig.position.distanceTo(landmarkTarget.position) < 0.05);
  assert.ok(Math.abs(rig.fov - 36) < 0.1);

  for (let i = 0; i < 60; i++) stepCameraRig(rig, defaultTarget, 0.03, 4.5, false);
  assert.ok(rig.position.distanceTo(defaultTarget.position) < 0.05);
  assert.ok(Math.abs(rig.fov - DEFAULT_ORBIT_STATE.fov) < 0.1);
});

test('stepCameraRig transitions directly from one landmark pose to the next without detouring to default frame', () => {
  const poseA = resolveLandmarkCameraTarget(DEFAULT_ORBIT_STATE, {
    yaw: -0.45, pitch: 0.24, radius: 5.4, lookAt: [0.3, 0.2, 0.2], panOffset: [1.15, 0.05, 0], fov: 38,
  });
  const poseB = resolveLandmarkCameraTarget(DEFAULT_ORBIT_STATE, {
    yaw: 0.58, pitch: -0.18, radius: 5.1, lookAt: [-0.2, 0.35, 0.3], panOffset: [1.05, -0.08, 0], fov: 37,
  });
  const rig = { position: poseA.position.clone(), lookAt: poseA.lookAt.clone(), fov: poseA.fov };
  const abDist = poseA.position.distanceTo(poseB.position);
  let prevDist = abDist;

  for (let i = 0; i < 60; i++) {
    stepCameraRig(rig, poseB, 0.03, 4.6, false);
    const dToB = rig.position.distanceTo(poseB.position);
    const dToA = rig.position.distanceTo(poseA.position);
    assert.ok(dToB < prevDist, 'distance to target landmark strictly decreases');
    assert.ok(Math.abs((dToA + dToB) - abDist) < 1e-4, 'camera path stays collinear between landmark A and B');
    prevDist = dToB;
  }
  assert.ok(rig.position.distanceTo(poseB.position) < 0.05);
});

test('stepLandmarkIndex cycles with wraparound and handles edge sizes', () => {
  assert.equal(stepLandmarkIndex(0, 4, 1), 1);
  assert.equal(stepLandmarkIndex(3, 4, 1), 0);
  assert.equal(stepLandmarkIndex(0, 4, -1), 3);
  assert.equal(stepLandmarkIndex(0, 1, 1), 0);
  assert.equal(stepLandmarkIndex(0, 0, 1), -1);
});
