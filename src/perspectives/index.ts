import type { PerspectiveComponent } from './types';
import { perspectives } from './content';
export { perspectives } from './content';

const modules = import.meta.glob<{ default: PerspectiveComponent }>('./*/Perspective.tsx', { eager: true });
export const perspectiveComponents: readonly PerspectiveComponent[] = perspectives.map(entry => {
  const found = modules['./' + entry.slug + '/Perspective.tsx'];
  if (!found) throw new Error('Missing generated Perspective.tsx for ' + entry.slug);
  return found.default;
});
