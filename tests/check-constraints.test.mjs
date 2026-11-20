import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { checkConstraints } from '../scripts/check-constraints.mjs';
import { generatePages } from '../scripts/generate-pages.mjs';

function fixture(callback) {
  const dir = mkdtempSync(join(tmpdir(), 'skiplet-constraints-'));
  try {
    for (const path of ['src/scene', 'src/components/3d', 'exposition'])
      mkdirSync(join(dir, path), { recursive: true });
    writeFileSync(join(dir, 'meditations.config.json'), JSON.stringify({
      id: 'MDT-Demo', title: 'Demo', concept: 'Concept', artStyle: 'Study',
      colorScheme: 'A scheme', truthTags: ['a'], emotionTags: ['a'], artTags: ['a'],
      materials: ['a'], textures: ['a'],
      palette: { base: '#010101', highlight: '#020202', surface: '#030303', text: '#040404' },
    }));
    writeFileSync(join(dir, 'src/exposition.ts'), 'export const ok = true;\n');
    writeFileSync(join(dir, 'exposition/01-opening.md'), '# 01 — Opening\n\n## Intro\nHi.\n');
    generatePages(dir);
    callback(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('valid canonical project passes constraints', () => fixture(dir => assert.doesNotThrow(() => checkConstraints(dir))));
test('invalid palette and oversized files fail', () => fixture(dir => {
  writeFileSync(join(dir, 'src/large.ts'), 'const a = 1;\n'.repeat(201));
  writeFileSync(join(dir, 'src/off.css'), 'a { color: #ff0000 }');
  assert.throws(() => checkConstraints(dir), /200-line limit|off-palette/);
}));
test('scene geometry is rejected, reusable component geometry allowed', () => fixture(dir => {
  writeFileSync(join(dir, 'src/scene/bad.ts'), 'new THREE.SphereGeometry(1)');
  assert.throws(() => checkConstraints(dir), /src\/components\/3d/);
  rmSync(join(dir, 'src/scene/bad.ts'));
  writeFileSync(join(dir, 'src/components/3d/Sphere.ts'), 'new THREE.SphereGeometry(1)');
  assert.doesNotThrow(() => checkConstraints(dir));
}));
test('stale perspective registry fails', () => fixture(dir => {
  writeFileSync(join(dir, 'exposition/01-opening.md'), '# 01 — Opening\n\n## Another\n');
  assert.throws(() => checkConstraints(dir), /out of date/);
}));
