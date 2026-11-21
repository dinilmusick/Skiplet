import assert from 'node:assert/strict';
import test from 'node:test';
import { angleFor, validateCarousel } from '../src/libraries/utils/carouselMath.ts';

test('carousel accepts any item count and custom angles', () => {
  for (const count of [1, 2, 8, 32]) {
    const items = Array.from({ length: count }, (_, i) => ({ id: 'item-' + i }));
    assert.equal(validateCarousel(items), count);
    assert.equal(angleFor(items, count - 1, 0.3), (count - 1) * 0.3);
  }
  assert.equal(angleFor([{ id: 'custom', angle: 1.27 }], 0), 1.27);
});
test('carousel rejects duplicate IDs and nonfinite angles', () => {
  assert.throws(() => validateCarousel([{ id: 'x' }, { id: 'x' }]), /unique/);
  assert.throws(() => validateCarousel([{ id: 'x', angle: Infinity }]), /angle/);
  assert.throws(() => angleFor([{ id: 'x' }], 1), RangeError);
});
test('carousel renderer is separated from Meditation assets', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/libraries/components/Carousel3D/Carousel3D.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /perspectives|exposition|meditation|STATIONS|createSphereWorld/);
  for (const name of ['baseMesh', 'background', 'elements', 'onActivate', 'placeElement']) {
    assert.match(src, new RegExp(name));
  }
});
