import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { projectScene } from '../src/libraries/components/3d/canvas3dProjector.ts';
import { detectWebGlProfile } from '../src/libraries/components/Carousel3D/renderer.ts';
import { PALETTE, threeColor } from '../src/libraries/utils/palette.ts';

test('detectWebGlProfile degrades gracefully when WebGL is unavailable', () => {
  const profile = detectWebGlProfile();
  assert.equal(profile.supported, false);
  assert.equal(profile.isWebGl2, false);
  assert.equal(profile.isSoftwareGl, true);
});

test('projectScene projects meshes, lines, and points in depth order for Canvas3DRenderer', () => {
  const scene = new THREE.Scene();
  scene.background = threeColor(PALETTE.base);
  const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  const hemi = new THREE.HemisphereLight(threeColor(PALETTE.purpleBright), threeColor(PALETTE.purpleDeep), 0.5);
  const dir = new THREE.DirectionalLight(threeColor(PALETTE.text), 1.2);
  dir.position.set(4, 6, 8);
  scene.add(hemi, dir, dir.target);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: threeColor(PALETTE.highlight), roughness: 0.2, metalness: 0.6 }),
  );
  scene.add(box);

  const ptsGeo = new THREE.BufferGeometry();
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -5, 1, 1, -2]), 3));
  const pts = new THREE.Points(ptsGeo, new THREE.PointsMaterial({ color: threeColor(PALETTE.text), size: 0.2 }));
  scene.add(pts);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-2, 0, 0, 2, 0, 0]), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: threeColor(PALETTE.amberBright) }));
  scene.add(line);

  scene.updateMatrixWorld();
  const items = projectScene(scene, camera, 800, 600);

  assert.ok(items.some(i => i.kind === 'tri'), 'produces shaded triangles');
  assert.ok(items.some(i => i.kind === 'dot'), 'produces projected points');
  assert.ok(items.some(i => i.kind === 'line'), 'produces projected lines');
  for (let i = 1; i < items.length; i++) {
    assert.ok(items[i - 1].z <= items[i].z, 'draw items are depth-sorted back-to-front');
  }
});
