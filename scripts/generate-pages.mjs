import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

const FILE_PATTERN = /^(\d{2,})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const HEADING_PATTERN = /^#\s+(\d+)\s*[\u2014\u2013:.-]\s*(\S.*)\s*$/;

export function generatePages(root = process.cwd(), check = false) {
  const directory = resolve(root, 'exposition');
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = entries.filter(entry => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md');
  const chapters = files.map(({ name }) => {
    const match = FILE_PATTERN.exec(name);
    if (!match) throw new Error(`Chapter filename must begin NN-title: exposition/${name}`);
    const number = Number(match[1]);
    const content = readFileSync(join(directory, name), 'utf8');
    const firstLine = content.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0];
    const heading = HEADING_PATTERN.exec(firstLine);
    if (!heading) throw new Error(`First line must be '# ${match[1]} — Title': exposition/${name}`);
    if (Number(heading[1]) !== number) throw new Error(`Heading number differs from filename: exposition/${name}`);
    return { number, title: heading[2].trim(), slug: name.slice(0, -3), file: name };
  }).sort((a, b) => a.number - b.number || a.slug.localeCompare(b.slug));
  for (let index = 0; index < chapters.length; index++) {
    if (chapters[index].number !== index + 1) {
      throw new Error(`Chapters must be consecutively numbered starting at 01 (at ${chapters[index].file})`);
    }
  }
  const outputPath = resolve(root, 'src/generated/pages.json');
  const output = JSON.stringify(chapters) + '\n';
  if (check) {
    let previous = '';
    try { previous = readFileSync(outputPath, 'utf8'); } catch { /* stale or missing */ }
    if (previous !== output) throw new Error('Generated pages out of date: run skiplet generate pages');
    return chapters;
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  if (!check) writeFileSync(outputPath, output);
  return chapters;
}
