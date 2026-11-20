import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

const filePattern = /^(\d{2,})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const headingPattern = /^#\s+(\d+)\s*[\u2014\u2013:.-]\s*(\S.*)\s*$/;
const slugify = value => value.toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function extractViews(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').split('\n').slice(1);
  const preamble = [];
  const sections = [];
  let fenceChar = '';
  for (const line of lines) {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (!fenceChar) fenceChar = fence[1][0];
      else if (fenceChar === fence[1][0]) fenceChar = '';
    }
    const heading = !fenceChar && /^##\s+(.+?)\s*$/.exec(line);
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

export function generatePages(root = process.cwd(), check = false) {
  const directory = resolve(root, 'exposition');
  const files = readdirSync(directory, { withFileTypes: true })
    .filter(item => item.isFile() && item.name.endsWith('.md') && item.name !== 'README.md');
  const perspectives = files.map(({ name }) => {
    const match = filePattern.exec(name);
    if (!match) throw new Error('Chapter filename must begin NN-title: exposition/' + name);
    const number = Number(match[1]);
    const content = readFileSync(join(directory, name), 'utf8');
    const firstLine = content.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0];
    const heading = headingPattern.exec(firstLine);
    if (!heading) throw new Error('First heading must be # NN — Title: exposition/' + name);
    if (Number(heading[1]) !== number) throw new Error('Heading number differs from filename: exposition/' + name);
    return { number, title: heading[2].trim(), slug: name.slice(0, -3), file: name, views: extractViews(content) };
  }).sort((a, b) => a.number - b.number || a.slug.localeCompare(b.slug));
  for (let i = 0; i < perspectives.length; i++) {
    if (perspectives[i].number !== i + 1) {
      throw new Error('Chapters must be consecutively numbered starting at 01 (at ' + perspectives[i].file + ')');
    }
  }
  const outputPath = resolve(root, 'src/generated/perspectives.json');
  const output = JSON.stringify(perspectives) + '\n';
  if (check) {
    let previous = '';
    try { previous = readFileSync(outputPath, 'utf8'); } catch { /* stale or missing */ }
    if (previous !== output) throw new Error('Generated perspectives out of date: run skiplet generate perspectives');
    return perspectives;
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output);
  return perspectives;
}
