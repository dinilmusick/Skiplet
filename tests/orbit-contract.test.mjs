import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const source = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');

test('starter composes the same reusable 3D carousel API as Meditations', () => {
  const app = source('App.tsx');
  const assets = source('perspectives/carouselAssets.ts');
  for (const prop of ['baseMesh', 'background', 'elements', 'placeElement', 'onActivate']) {
    assert.match(app, new RegExp(prop));
  }
  assert.match(assets, /createStarfield/);
  assert.match(assets, /createExhibit/);
  assert.match(app, /Canvas2DFallback/);
});
test('starter perspective renders scenes through generic view carousel', () => {
  const stage = source('perspectives/PerspectiveStage.tsx');
  assert.match(stage, /DirectionalCarousel3D/);
  assert.match(stage, /Annotated3DScene/);
  assert.match(stage, /createViewLandmarks/);
  assert.match(stage, /createScaffoldViewScene/);
});
