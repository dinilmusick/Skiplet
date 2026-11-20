import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { checkConstraints } from '../scripts/check-constraints.mjs';
import { generatePages } from '../scripts/generate-pages.mjs';

function fixture(callback) {
  const dir = mkdtempSync(join(tmpdir(), 'skiplet-constraints-'));
  try {
    for (const path of ['src/libraries/components/Carousel3D', 'src/libraries/components/3d',
      'src/libraries/utils', 'src/perspectives', 'meditation'])
      mkdirSync(join(dir, path), { recursive: true });
    writeFileSync(join(dir, 'meditations.config.json'), JSON.stringify({
      id: 'MDT-Demo', title: 'Demo', concept: 'Concept', artStyle: 'Study',
      colorScheme: 'A scheme', truthTags: ['a'], emotionTags: ['a'], artTags: ['a'],
      materials: ['a'], textures: ['a'],
      palette: { base: '#010101', highlight: '#020202', surface: '#030303', text: '#040404' },
    }));
    writeFileSync(join(dir, 'src/App.tsx'), 'export const ok = true;\n');
    writeFileSync(join(dir, 'src/main.tsx'), 'export const ok = true;\n');
    writeFileSync(join(dir, 'src/perspectives/content.ts'), 'export const ok = true;\n');
    writeFileSync(join(dir, 'meditation/01-opening.md'), '# 01 — Opening\n\n## Intro\nHi.\n');
    generatePages(dir);
    callback(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('valid generated Meditation passes constraints', () => fixture(dir => assert.doesNotThrow(() => checkConstraints(dir))));
test('root-level implementation, legacy folders, geometry and off-palette values fail', () => fixture(dir => {
  writeFileSync(join(dir, 'src/unused.ts'), 'const value = 1;\n');
  assert.throws(() => checkConstraints(dir), /src root only permits/);
  rmSync(join(dir, 'src/unused.ts'));
  mkdirSync(join(dir, 'src/scene'));
  assert.throws(() => checkConstraints(dir), /Legacy architecture/);
  rmSync(join(dir, 'src/scene'), { recursive: true });
  writeFileSync(join(dir, 'src/perspectives/bad.ts'), 'new THREE.SphereGeometry(1);\n');
  assert.throws(() => checkConstraints(dir), /reusable 3D objects/);
  rmSync(join(dir, 'src/perspectives/bad.ts'));
  writeFileSync(join(dir, 'src/App.tsx'), 'const color = "#ff0000";\n');
  assert.throws(() => checkConstraints(dir), /off-palette/);
}));
test('oversized source is rejected', () => fixture(dir => {
  writeFileSync(join(dir, 'src/App.tsx'), 'const n = 1;\n'.repeat(201));
  assert.throws(() => checkConstraints(dir), /limit 200/);
}));
test('missing perspective view and stale manifest fail', () => fixture(dir => {
  rmSync(join(dir, 'src/perspectives/01-opening/views/intro.tsx'));
  assert.throws(() => checkConstraints(dir), /Missing .*intro.tsx/);
  generatePages(dir);
  writeFileSync(join(dir, 'meditation/01-opening.md'), '# 01 — Opening\n\n## Changed\nHi.\n');
  assert.throws(() => checkConstraints(dir), /out of date/);
}));
test('carousel cannot import specific perspective content', () => fixture(dir => {
  writeFileSync(join(dir, 'src/libraries/components/Carousel3D/leak.ts'),
    "import { chapter } from '../../perspectives/content';\n");
  assert.throws(() => checkConstraints(dir), /Carousel3D must not import/);
}));
