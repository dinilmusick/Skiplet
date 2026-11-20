import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');
test('perspective navigation rotates the reusable carousel but views live inside', () => {
  const world = read('libraries/components/Carousel3D/world.ts');
  const app = read('App.tsx');
  assert.match(world, /rotation = rotationFor\(index, elements.length\)/);
  assert.match(world, /anchor\.rotation\.z = -orbit\.rotation\.z/);
  assert.match(app, /active\.inside/);
  assert.match(app, /<Perspective/);
  assert.doesNotMatch(world, /meditation\/|perspectives\/|generated\//);
});
test('base mesh, background, entries and destinations are injectable', () => {
  const types = read('libraries/components/Carousel3D/types.ts');
  for (const field of ['createBase', 'createBackground', 'createMesh', 'destination', 'title']) {
    assert.match(types, new RegExp(field));
  }
  assert.match(read('libraries/components/Carousel3D/Carousel3D.tsx'), /dblclick/);
  for (const file of ['OrbitSphere.ts', 'ExhibitSculpture.ts', 'SceneLighting.ts'])
    assert.ok(read('libraries/components/3d/' + file).length > 0);
});
