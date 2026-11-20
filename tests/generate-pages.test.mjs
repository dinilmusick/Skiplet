import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { extractViews, generatePages } from '../scripts/generate-pages.mjs';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'skiplet-perspectives-'));
  mkdirSync(join(root, 'meditation'));
  try { return run(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function chapter(root, name, firstLine, body = 'Body of the chapter.') {
  writeFileSync(join(root, 'meditation', name), firstLine + '\n\n' + body + '\n');
}
test('generates numbered perspective modules and view entrypoints', () => fixture(root => {
  chapter(root, '02-second-part.md', '# 02 — Second Part');
  chapter(root, '01-first-question.md', '# 01 — First Question', '## First view\nText.');
  const items = generatePages(root);
  assert.deepEqual(items.map(x => x.slug), ['01-first-question', '02-second-part']);
  assert.match(readFileSync(join(root, 'src/perspectives/01-first-question/Perspective.tsx'), 'utf8'), /PerspectiveStage/);
  assert.match(readFileSync(join(root, 'src/perspectives/01-first-question/views/first-view.tsx'), 'utf8'), /MarkdownView/);
  assert.deepEqual(generatePages(root, true), items);
}));
test('view generation does not overwrite authored implementation', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One', '## My View\nBody');
  generatePages(root);
  const view = join(root, 'src/perspectives/01-one/views/my-view.tsx');
  writeFileSync(view, 'export default function Art() { return null; }\n');
  generatePages(root);
  assert.match(readFileSync(view, 'utf8'), /function Art/);
  assert.equal(generatePages(root, true).length, 1);
}));
test('H2 headings and Overview become independent views', () => fixture(root => {
  chapter(root, '01-first.md', '# 01 — First', 'Intro\n\n## Mathematical explanation\nMath.');
  assert.deepEqual(generatePages(root)[0].views.map(x => x.slug), ['overview', 'mathematical-explanation']);
}));
test('fenced fake headings are excluded; duplicate slugs are unique', () => {
  const content = ['# 01 — One', '', '## Real', '~~~md', '## Fake', '~~~', '## Real'].join('\n');
  assert.deepEqual(extractViews(content).map(x => x.slug), ['real', 'real-2']);
});
test('stale metadata, extra view, and orphan folder are detected', () => fixture(root => {
  chapter(root, '01-one.md', '# 01 — One', '## First\nA');
  generatePages(root);
  writeFileSync(join(root, 'meditation/01-one.md'), '# 01 — One\n\n## Second\nB');
  assert.throws(() => generatePages(root, true), /out of date/);
  generatePages(root);
  const first = join(root, 'src/perspectives/01-one/views/first.tsx');
  assert.throws(() => generatePages(root, true), /Stale view/);
  rmSync(first);
  assert.doesNotThrow(() => generatePages(root, true));
  mkdirSync(join(root, 'src/perspectives/99-orphan'));
  assert.throws(() => generatePages(root, true), /Orphan perspective/);
}));
test('invalid numbering and headings fail', () => fixture(root => {
  chapter(root, '02-two.md', '# 02 — Two');
  assert.throws(() => generatePages(root), /consecutively/);
  rmSync(join(root, 'meditation/02-two.md'));
  chapter(root, '01-one.md', '# 02 — Wrong');
  assert.throws(() => generatePages(root), /differs/);
}));
