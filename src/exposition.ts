/// <reference types="vite/client" />
import manifest from './generated/pages.json';

const sources = import.meta.glob('../exposition/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const chapters = manifest.map(entry => {
  const markdown = sources[`../exposition/${entry.file}`];
  if (markdown === undefined) {
    throw new Error(`Missing generated exposition page: ${entry.file}. Run skiplet generate pages.`);
  }
  return { ...entry, markdown };
});
