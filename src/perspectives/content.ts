/// <reference types="vite/client" />
import manifest from '../generated/perspectives.json';

const sources = import.meta.glob('../../meditation/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
interface Section { title: string; markdown: string }
function splitViews(markdown: string): Section[] {
  const lines = markdown.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').split('\n');
  const intro: string[] = [], sections: { title: string; lines: string[] }[] = [];
  let fenced = '';
  for (const line of lines.slice(1)) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fenced) fenced = marker[1][0];
      else if (fenced === marker[1][0]) fenced = '';
    }
    const heading = !fenced && /^##\s+(.+?)\s*$/.exec(line);
    if (heading) sections.push({ title: heading[1].trim(), lines: [line] });
    else if (!sections.length) intro.push(line);
    else sections[sections.length - 1].lines.push(line);
  }
  const result: Section[] = [];
  if (intro.join('\n').trim() || !sections.length)
    result.push({ title: 'Overview', markdown: [lines[0], ...intro].join('\n') });
  return [...result, ...sections.map(item => ({ title: item.title, markdown: item.lines.join('\n') }))];
}
export const perspectives = manifest.map(entry => {
  const markdown = sources['../../meditation/' + entry.file];
  if (markdown === undefined) throw new Error('Missing meditation: ' + entry.file);
  const sections = splitViews(markdown);
  if (sections.length !== entry.views.length ||
      sections.some((section, index) => section.title !== entry.views[index].title))
    throw new Error('Stale perspective views: run skiplet generate perspectives');
  return { ...entry, views: entry.views.map((view, i) => ({ ...view, markdown: sections[i].markdown })) };
});
