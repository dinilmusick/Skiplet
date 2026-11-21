import type * as THREE from 'three';
import { createPerspectiveSculpture } from './perspectiveSculptures';

export interface PlaceholderExhibit {
  group: THREE.Group;
  update: (time: number, reducedMotion?: boolean) => void;
  dispose: () => void;
}

export function createPlaceholderExhibit(index: number, lowPoly = false): PlaceholderExhibit {
  const sculpture = createPerspectiveSculpture(index, lowPoly);
  return {
    group: sculpture.group,
    update: (t, reducedMotion = false) => sculpture.update(t, reducedMotion),
    dispose: () => sculpture.dispose(),
  };
}
