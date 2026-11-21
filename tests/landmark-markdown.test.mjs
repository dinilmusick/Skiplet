import assert from 'node:assert/strict';
import test from 'node:test';
import { extractLandmarkItems } from '../src/libraries/utils/landmarkMarkdown.ts';

test('extractLandmarkItems creates one landmark item per bulleted line with attached equation or picture', () => {
  const md = [
    '## Mathematical explanation',
    '',
    '- First bullet explains `x` and `M`:',
    '',
    '  ```text',
    '  I_M(x) = -log2 P_M(x)',
    '  ```',
    '',
    '- Second bullet includes a diagram:',
    '  ![Landscape](ContextLandscape.png)',
    '',
    '- Third bullet has prose only.',
    '',
    '---',
    '',
    '[Next](02.md)',
  ].join('\n');

  const items = extractLandmarkItems(md);
  assert.equal(items.length, 3);
  assert.match(items[0].body, /First bullet explains/);
  assert.match(items[0].body, /I_M\(x\) = -log2 P_M\(x\)/);
  assert.doesNotMatch(items[0].body, /Second bullet/);
  assert.match(items[1].body, /!\[Landscape\]\(ContextLandscape\.png\)/);
  assert.doesNotMatch(items[1].body, /Third bullet/);
  assert.equal(items[2].body, 'Third bullet has prose only.');
  assert.doesNotMatch(items[2].body, /\[Next\]/);
});

test('extractLandmarkItems supports overview preamble bullets and plain fallback', () => {
  const overview = '# 01 — Title\n\n- *Why one claim denies the other*';
  const items = extractLandmarkItems(overview);
  assert.equal(items.length, 1);
  assert.equal(items[0].body, '*Why one claim denies the other*');

  const fallback = extractLandmarkItems('## Section\nPlain fallback paragraph.');
  assert.equal(fallback.length, 1);
  assert.equal(fallback[0].body, 'Plain fallback paragraph.');
});
