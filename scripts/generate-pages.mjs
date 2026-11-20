import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

const filePattern = /^(\d{2,})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const headingPattern = /^#\s+(\d+)\s*[\u2014\u2013:.-]\s*(\S.*)\s*$/;
const slugify = value => value.toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function extractViews(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').split('\n').slice(1);
  const preamble = [], sections = [];
  let fence = '';
  for (const line of lines) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = '';
    }
    const heading = !fence && /^##\s+(.+?)\s*$/.exec(line);
    if (heading) sections.push(heading[1].trim());
    else if (!sections.length) preamble.push(line);
  }
  const titles = [];
  if (preamble.join('\n').trim() || sections.length === 0) titles.push('Overview');
  titles.push(...sections);
  const seen = new Map();
  return titles.map((title, index) => {
    const base = slugify(title) || 'view';
    const occurrence = (seen.get(base) || 0) + 1;
    seen.set(base, occurrence);
    return { ordinal: index + 1, title, slug: occurrence === 1 ? base : base + '-' + occurrence };
  });
}

const perspectiveTemplate = `import type { ComponentType } from 'react';
import { PerspectiveStage } from '../PerspectiveStage';
import type { PerspectiveProps, ViewProps } from '../types';

const modules = import.meta.glob<{ default: ComponentType<ViewProps> }>('./views/*.tsx', { eager: true });
const views: Record<string, ComponentType<ViewProps>> = Object.fromEntries(
  Object.entries(modules).map(([path, entry]) => [path.split('/').pop()!.replace(/\.tsx$/, ''), entry.default]),
);
export default function Perspective(props: PerspectiveProps) {
  return <PerspectiveStage {...props} viewComponents={views} />;
}
`;
const viewTemplate = "export { MarkdownView as default } from '../../MarkdownView';\n";

function syncPerspective(root, chapter, check) {
  const folder = resolve(root, 'src/perspectives', chapter.slug);
  const expected = new Set(['Perspective.tsx', ...chapter.views.map(view => 'views/' + view.slug + '.tsx')]);
  if (!check) mkdirSync(join(folder, 'views'), { recursive: true });
  for (const path of expected) {
    const file = join(folder, path);
    if (check && !existsSync(file)) throw new Error('Missing ' + file + '; run skiplet generate perspectives');
    if (!check && !existsSync(file)) writeFileSync(file, path === 'Perspective.tsx' ? perspectiveTemplate : viewTemplate);
  }
  if (!check) return;
  for (const item of readdirSync(join(folder, 'views'))) {
    if (item.endsWith('.tsx') && !expected.has('views/' + item))
      throw new Error('Stale view ' + join(folder, 'views', item) + '; reconcile with meditation headings');
  }
}

export function generatePages(root = process.cwd(), check = false) {
  const directory = resolve(root, 'meditation');
  const files = readdirSync(directory, { withFileTypes: true })
    .filter(item => item.isFile() && item.name.endsWith('.md') && item.name !== 'README.md');
  const perspectives = files.map(({ name }) => {
    const match = filePattern.exec(name);
    if (!match) throw new Error('Chapter filename must begin NN-title: meditation/' + name);
    const number = Number(match[1]);
    const content = readFileSync(join(directory, name), 'utf8');
    const heading = headingPattern.exec(content.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0]);
    if (!heading) throw new Error('First heading must be # NN — Title: meditation/' + name);
    if (Number(heading[1]) !== number) throw new Error('Heading number differs from filename: meditation/' + name);
    return { number, title: heading[2].trim(), slug: name.slice(0, -3), file: name, views: extractViews(content) };
  }).sort((a, b) => a.number - b.number || a.slug.localeCompare(b.slug));
  for (let i = 0; i < perspectives.length; i++) {
    if (perspectives[i].number !== i + 1)
      throw new Error('Chapters must be consecutively numbered starting at 01 (at ' + perspectives[i].file + ')');
  }
  const outputPath = resolve(root, 'src/generated/perspectives.json');
  const output = JSON.stringify(perspectives) + '\n';
  if (check) {
    let previous = '';
    try { previous = readFileSync(outputPath, 'utf8'); } catch { /* missing */ }
    if (previous !== output) throw new Error('Generated perspectives out of date: run skiplet generate perspectives');
  } else {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, output);
  }
  const folder = resolve(root, 'src/perspectives');
  if (!check) mkdirSync(folder, { recursive: true });
  for (const chapter of perspectives) syncPerspective(root, chapter, check);
  if (check && existsSync(folder)) {
    const slugs = new Set(perspectives.map(item => item.slug));
    for (const item of readdirSync(folder, { withFileTypes: true })) {
      if (item.isDirectory() && /^\d{2,}-/.test(item.name) && !slugs.has(item.name))
        throw new Error('Orphan perspective ' + item.name + '; reconcile with meditation chapters');
    }
  }
  return perspectives;
}
