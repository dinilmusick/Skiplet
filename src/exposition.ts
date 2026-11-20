/// <reference types="vite/client" />
import manifest from './generated/perspectives.json';

const sources = import.meta.glob('../exposition/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface Section { title: string; markdown: string }

function splitViews(markdown: string): Section[] {
  const lines = markdown.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').split('\n');
  const preamble: string[] = [];
  const sections: { title: string; lines: string[] }[] = [];
  let fenced = '';
  for (const line of lines.slice(1)) {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (!fenced) fenced = fence[1][0];
      else if (fenced === fence[1][0]) fenced = '';
    }
    const heading = !fenced && /^##\s+(.+?)\s*$/.exec(line);
    if (heading) sections.push({ title: heading[1].trim(), lines: [line] });
    else if (!sections.length) preamble.push(line);
    else sections[sections.length - 1].lines.push(line);
  }
  const result: Section[] = [];
  if (preamble.join('\n').trim() || sections.length === 0) {
    result.push({ title: 'Overview', markdown: [lines[0], ...preamble].join('\n') });
  }
  for (const section of sections) {
    result.push({ title: section.title, markdown: section.lines.join('\n') });
  }
  return result;
}

export const perspectives = manifest.map(entry => {
  const markdown = sources['../exposition/' + entry.file];
  if (markdown === undefined) {
    throw new Error('Missing exposition: ' + entry.file + '. Run skiplet generate perspectives.');
  }
  const sections = splitViews(markdown);
  if (sections.length !== entry.views.length ||
      sections.some((section, index) => section.title !== entry.views[index].title)) {
    throw new Error('Perspective views are stale: ' + entry.file + '. Run skiplet generate perspectives.');
  }
  return {
    ...entry,
    views: entry.views.map((view, index) => ({ ...view, markdown: sections[index].markdown })),
  };
});
