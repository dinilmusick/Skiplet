import * as THREE from 'three';
import config from '../../meditations.config.json';
import { createOrbitSphere } from '../libraries/components/3d/OrbitSphere';
import { createExhibit } from '../libraries/components/3d/ExhibitSculpture';
import { createSceneLighting } from '../libraries/components/3d/SceneLighting';
import { createStarfield } from '../libraries/components/Carousel3D/Starfield';
import type { CarouselElement, Carousel3DProps } from '../libraries/components/Carousel3D';
import { perspectives } from './content';

const STEP = 0.44;
export const carouselElements: readonly CarouselElement[] = perspectives.map((item, index) => ({
  id: item.slug,
  title: item.title,
  subtitle: 'Enter to explore this perspective',
  angle: index * STEP,
  destination: '?perspective=' + encodeURIComponent(item.slug) +
    '&view=' + encodeURIComponent(item.views[0]?.slug ?? 'overview'),
  createMesh: () => {
    const exhibit = createExhibit(index, config.palette);
    return {
      group: exhibit.group,
      update: frame => exhibit.update(frame.elapsed, frame.activeIndex === index && !frame.reducedMotion),
      dispose: exhibit.dispose,
    };
  },
}));
export const scaffoldBaseMesh: Carousel3DProps['baseMesh'] = () => createOrbitSphere(config.palette);
export const scaffoldBackground: Carousel3DProps['background'] =
  ctx => createStarfield(config.palette.text, ctx.lowPoly);
export const scaffoldPlaceElement: Carousel3DProps['placeElement'] = (anchor, item, index) => {
  const angle = item.angle ?? index * STEP;
  anchor.position.set(Math.sin(angle) * 8.4, Math.cos(angle) * 8.4, 0);
  anchor.rotation.z = -angle;
};
export const scaffoldLighting: NonNullable<Carousel3DProps['createLighting']> = scene => {
  const group = createSceneLighting(config.palette);
  scene.add(group);
  return { update: () => {}, dispose: () => { scene.remove(group); } };
};
export const scaffoldConfigureCamera: NonNullable<Carousel3DProps['configureCamera']> =
  (camera: THREE.PerspectiveCamera, width, height) => {
    camera.aspect = Math.max(1, width) / Math.max(1, height);
    const fov = THREE.MathUtils.degToRad(camera.fov / 2);
    camera.position.set(0, 0, Math.max(24, 10 / (Math.tan(fov) * camera.aspect)));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
