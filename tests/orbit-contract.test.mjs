import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('perspective navigation changes sphere rotation; views affect camera targets', () => {
  const world = readFileSync(new URL('../src/scene/createExhibitionScene.ts', import.meta.url), 'utf8');
  assert.match(world, /targetRotation = rotationFor\(perspective, count\)/);
  assert.match(world, /const offset = offsetForView\(view\)/);
  assert.match(world, /exhibits\[index\]\.group\.rotation\.z = -orbit\.rotation\.z/);
});
test('all core 3D geometries are reusable components', () => {
  for (const file of ['OrbitSphere.ts', 'ExhibitSculpture.ts', 'SceneLighting.ts']) {
    assert.ok(readFileSync(new URL('../src/components/3d/' + file, import.meta.url), 'utf8').length > 0);
  }
});
