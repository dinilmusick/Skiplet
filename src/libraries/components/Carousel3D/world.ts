import * as THREE from 'three';
import { angleFor, rotationFor } from '../../utils/orbitMath';
import type { CarouselElement, CarouselVisuals } from './types';

export function createCarouselWorld(elements: readonly CarouselElement[], visuals: CarouselVisuals) {
  const scene = new THREE.Scene();
  visuals.createBackground(scene);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const orbit = new THREE.Group();
  orbit.position.y = -7.05;
  scene.add(orbit);
  const core = visuals.createBase();
  orbit.add(core.group);
  scene.add(visuals.createLighting());
  const anchors = elements.map((item, index) => {
    const anchor = new THREE.Group();
    anchor.userData.carouselIndex = index;
    const angle = angleFor(index, elements.length);
    anchor.position.set(Math.cos(angle) * 9.2, Math.sin(angle) * 9.2, 0);
    const mesh = item.createMesh();
    anchor.add(mesh.group);
    orbit.add(anchor);
    return { anchor, mesh };
  });
  const cameraPosition = new THREE.Vector3(0, 3.25, 12.3);
  const lookAt = new THREE.Vector3(0, 2.25, 0);
  let rotation = 0, active = 0;
  camera.position.copy(cameraPosition);
  camera.lookAt(lookAt);
  return {
    scene, camera, hitTargets: anchors.map(entry => entry.anchor),
    focus(index: number) { active = index; rotation = rotationFor(index, elements.length); },
    update(seconds: number, instant = false) {
      const alpha = instant ? 1 : 0.095;
      orbit.rotation.z += (rotation - orbit.rotation.z) * alpha;
      anchors.forEach(({ anchor, mesh }, index) => {
        anchor.rotation.z = -orbit.rotation.z;
        mesh.update?.(instant ? 0 : seconds, index === active);
      });
      core.update?.(seconds, true);
    },
    dispose() {
      for (const { mesh } of anchors) mesh.dispose();
      core.dispose();
      scene.clear();
    },
  };
}
export type CarouselWorld = ReturnType<typeof createCarouselWorld>;
