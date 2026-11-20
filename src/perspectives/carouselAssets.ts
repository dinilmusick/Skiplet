import * as THREE from 'three';
import config from '../../meditations.config.json';
import { createOrbitSphere } from '../libraries/components/3d/OrbitSphere';
import { createExhibit } from '../libraries/components/3d/ExhibitSculpture';
import { createSceneLighting } from '../libraries/components/3d/SceneLighting';
import type { CarouselElement, CarouselVisuals } from '../libraries/components/Carousel3D';
import { perspectives } from './content';

export const carouselElements: readonly CarouselElement[] = perspectives.map((item, index) => ({
  id: item.slug,
  title: item.title,
  subtitle: 'Enter to explore this perspective',
  destination: '?perspective=' + encodeURIComponent(item.slug) + '&view=' + encodeURIComponent(item.views[0]?.slug ?? 'overview'),
  createMesh: () => createExhibit(index, config.palette),
}));
export const carouselVisuals: CarouselVisuals = {
  createBase: () => createOrbitSphere(config.palette),
  createBackground: scene => {
    scene.background = new THREE.Color(config.palette.base);
    scene.fog = new THREE.FogExp2(config.palette.base, 0.016);
  },
  createLighting: () => createSceneLighting(config.palette),
};
