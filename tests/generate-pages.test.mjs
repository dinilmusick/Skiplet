import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { generatePages } from '../scripts/generate-pages.mjs';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'skiplet-chapters-'));
  mkdirSync(join(root, 'exposition'));
  try { return run(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function chapter(root, name, firstLine) {
  writeFileSync(join(root, 'exposition', name), `${firstLine}\n\nBody remains in the markdown source.\n`);
}

test('regenerates stable numeric order independent of filesystem order', () => fixture(root => {
  chapter(root, '02-second-part.md', '# 02 — Second Part');
  chapter(root, '01-first-question.md', '# 01 — First Question');
  writeFileSync(join(root, 'exposition', 'README.md'), '# Book index\n');
  const entries = generatePages(root);
  assert.deepEqual(entries.map(x => x.title), ['First Question', 'Second Part']);
  assert.equal(entries[0].file, '01-first-question.md');
  assert.deepEqual(generatePages(root, true), entries);
  const before = readFileSync(join(root, 'src/generated/pages.json'), 'utf8');
  generatePages(root);
  assert.equal(readFileSync(join(root, 'src/generated/pages.json'), 'utf8'), before);
}));

test('addition, removal, and rename invalidate generated pages', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One');
  generatePages(root);
  chapter(root, '02-two.md', '# 02 — Two');
  assert.throws(() => generatePages(root, true), /out of date/);
  generatePages(root);
  assert.equal(generatePages(root, true).length, 2);
}));

test('rejects malformed names and titles rather than silently dropping chapters', () => fixture(root => {
  chapter(root, 'opening.md', '# 01 — Opening');
  assert.throws(() => generatePages(root), /filename/);
}));

test('rejects non-contiguous or duplicate chapter numbering', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One');
  chapter(root, '03-three.md', '# 03 — Three');
  assert.throws(() => generatePages(root), /consecutively/);
  chapter(root, '02-two.md', '# 02 — Two');
  chapter(root, '02-other.md', '# 02 — Other');
  assert.throws(() => generatePages(root), /consecutively/);
}));

test('rejects filename/header disagreement', () => fixture(root => {
  chapter(root, '01-one.md', '# 02 — One');
  assert.throws(() => generatePages(root), /differs/);
}));

test('supports an empty exposition as an empty carousel', () => fixture(root => {
  assert.deepEqual(generatePages(root), []);
  assert.deepEqual(generatePages(root, true), []);
}));
