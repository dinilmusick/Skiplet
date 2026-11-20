import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { extractViews, generatePages } from '../scripts/generate-pages.mjs';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'skiplet-perspectives-'));
  mkdirSync(join(root, 'exposition'));
  try { return run(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function chapter(root, name, firstLine, body = 'Body of the chapter.') {
  writeFileSync(join(root, 'exposition', name), firstLine + '\n\n' + body + '\n');
}

test('generates perspectives in stable numeric order', () => fixture(root => {
  chapter(root, '02-second-part.md', '# 02 — Second Part');
  chapter(root, '01-first-question.md', '# 01 — First Question');
  writeFileSync(join(root, 'exposition', 'README.md'), '# Book index\n');
  const entries = generatePages(root);
  assert.deepEqual(entries.map(x => x.title), ['First Question', 'Second Part']);
  assert.equal(entries[0].views[0].title, 'Overview');
  assert.deepEqual(generatePages(root, true), entries);
  const before = readFileSync(join(root, 'src/generated/perspectives.json'), 'utf8');
  generatePages(root);
  assert.equal(readFileSync(join(root, 'src/generated/perspectives.json'), 'utf8'), before);
}));

test('H2 sections become views; preamble becomes Overview', () => fixture(root => {
  chapter(root, '01-first.md', '# 01 — First',
    'An introduction.\n\n## The Question\nText.\n\n## Mathematical explanation\nMath.');
  const [entry] = generatePages(root);
  assert.deepEqual(entry.views.map(x => x.slug), ['overview', 'the-question', 'mathematical-explanation']);
}));

test('chapters without an introduction start at their first section', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One', '## First\nBody.\n\n## Second\nBody.');
  assert.deepEqual(generatePages(root)[0].views.map(x => x.title), ['First', 'Second']);
}));

test('headings inside fenced code are not counted as views', () => {
  const code = ['# 01 — One', '', '## Real', '', '~~~md', '## Fake', '~~~', '', '## Last'].join('\n');
  assert.deepEqual(extractViews(code).map(x => x.title), ['Real', 'Last']);
});

test('repeated view headings have distinct stable slugs', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One', '## Example\nA.\n## Example\nB.');
  assert.deepEqual(generatePages(root)[0].views.map(x => x.slug), ['example', 'example-2']);
}));

test('perspective or section changes invalidate the manifest', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One');
  generatePages(root);
  chapter(root, '02-two.md', '# 02 — Two', '## First\nA.');
  assert.throws(() => generatePages(root, true), /out of date/);
  generatePages(root);
  assert.equal(generatePages(root, true).length, 2);
  chapter(root, '02-two.md', '# 02 — Two', '## First\nA.\n## Next\nB.');
  assert.throws(() => generatePages(root, true), /out of date/);
}));

test('body changes do not change metadata', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One', '## First\nA.');
  generatePages(root);
  chapter(root, '01-one.md', '# 01 — One', '## First\nA much longer paragraph.');
  assert.equal(generatePages(root, true).length, 1);
}));

test('rejects malformed filenames', () => fixture(root => {
  chapter(root, 'opening.md', '# 01 — Opening');
  assert.throws(() => generatePages(root), /filename/);
}));

test('rejects non-contiguous and duplicate numbers', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One');
  chapter(root, '03-three.md', '# 03 — Three');
  assert.throws(() => generatePages(root), /consecutively/);
  chapter(root, '02-two.md', '# 02 — Two');
  chapter(root, '02-other.md', '# 02 — Other');
  assert.throws(() => generatePages(root), /consecutively/);
}));

test('rejects disagreement between heading and filename', () => fixture(root => {
  chapter(root, '01-one.md', '# 02 — One');
  assert.throws(() => generatePages(root), /differs/);
}));

test('empty exposition creates empty perspective registry', () => fixture(root => {
  assert.deepEqual(generatePages(root), []);
  assert.deepEqual(generatePages(root, true), []);
}));
