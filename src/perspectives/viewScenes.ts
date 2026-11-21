import * as THREE from 'three';
import config from '../../meditations.config.json';
import { createExhibit } from '../libraries/components/3d/ExhibitSculpture';
import { createParticleDrift } from '../libraries/components/3d/ParticleDrift';
import { extractLandmarkItems } from '../libraries/utils/landmarkMarkdown';
import type { SceneBuildContext, SceneAsset, SceneLandmark } from '../libraries/components/Annotated3DScene';
import type { ViewData } from './types';

const POSITIONS: readonly (readonly [number, number, number])[] = [
  [1.25, 0.8, 0.9], [-1.3, 0.4, 1.1],
  [0.3, -1.05, 1.2], [-0.8, -0.6, 0.95],
];
export function createScaffoldViewScene(perspectiveNumber: number, viewIndex: number) {
  return ({ lowPoly }: SceneBuildContext): SceneAsset => {
    const exhibit = createExhibit(perspectiveNumber + viewIndex, config.palette);
    const drift = createParticleDrift(config.palette.highlight, lowPoly,
      perspectiveNumber * 37 + viewIndex);
    const group = new THREE.Group();
    group.add(exhibit.group, drift.group);
    return {
      group,
      update: (time, reducedMotion) => {
        exhibit.update(time, !reducedMotion);
        drift.update(time, reducedMotion);
      },
      dispose: () => { exhibit.dispose(); drift.dispose(); },
    };
  };
}
export function createViewLandmarks(view: ViewData): readonly SceneLandmark[] {
  return extractLandmarkItems(view.markdown).map((item, index) => ({
    id: view.slug + '-landmark-' + index,
    title: view.title,
    body: item.body,
    ariaLabel: 'Reveal ' + view.title + ', point ' + (index + 1),
    position: POSITIONS[index % POSITIONS.length],
    textPosition: [54, 20],
  }));
}
