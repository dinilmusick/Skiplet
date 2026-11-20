import * as THREE from 'three';
import config from '../../meditations.config.json';
import { createOrbitSphere } from '../components/3d/OrbitSphere';
import { createExhibit } from '../components/3d/ExhibitSculpture';
import { createSceneLighting } from '../components/3d/SceneLighting';
import { angleFor, offsetForView, rotationFor } from './orbitMath';

export interface ExhibitionWorld {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  focus: (perspective: number, view: number) => void;
  update: (seconds: number, instant?: boolean) => void;
  dispose: () => void;
}

export function createExhibitionScene(count: number): ExhibitionWorld {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.palette.base);
  scene.fog = new THREE.FogExp2(config.palette.base, 0.016);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const orbit = new THREE.Group();
  orbit.position.y = -7.05;
  scene.add(orbit);
  const sphere = createOrbitSphere(config.palette);
  orbit.add(sphere.group);
  scene.add(createSceneLighting(config.palette));

  const exhibits = Array.from({ length: count }, (_, index) => {
    const exhibit = createExhibit(index, config.palette);
    const angle = angleFor(index, count);
    const distance = 9.2;
    exhibit.group.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance, 0);
    orbit.add(exhibit.group);
    return exhibit;
  });

  const desiredCamera = new THREE.Vector3(0, 3.25, 12.3);
  const desiredLook = new THREE.Vector3(0, 2.25, 0);
  const currentLook = desiredLook.clone();
  let targetRotation = 0;
  let selected = 0;
  camera.position.copy(desiredCamera);
  camera.lookAt(currentLook);

  return {
    scene,
    camera,
    focus: (perspective, view) => {
      selected = perspective;
      targetRotation = rotationFor(perspective, count);
      const offset = offsetForView(view);
      desiredCamera.set(offset.x * 0.72, 3.25 + offset.y, 12.3 - offset.zoom);
      desiredLook.set(offset.x, 2.25 + offset.y, 0);
    },
    update: (seconds, instant = false) => {
      const alpha = instant ? 1 : 0.095;
      orbit.rotation.z += (targetRotation - orbit.rotation.z) * alpha;
      camera.position.lerp(desiredCamera, alpha);
      currentLook.lerp(desiredLook, alpha);
      camera.lookAt(currentLook);
      for (let index = 0; index < exhibits.length; index++) {
        exhibits[index].group.rotation.z = -orbit.rotation.z;
        exhibits[index].update(instant ? 0 : seconds, index === selected);
      }
    },
    dispose: () => {
      exhibits.forEach(exhibit => exhibit.dispose());
      sphere.dispose();
      scene.clear();
    },
  };
}
