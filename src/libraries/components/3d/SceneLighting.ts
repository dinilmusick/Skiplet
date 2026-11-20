import * as THREE from 'three';

export function createSceneLighting(palette: { text: string; surface: string; highlight: string }) {
  const lights = new THREE.Group();
  lights.add(new THREE.HemisphereLight(palette.text, palette.surface, 1.6));
  const key = new THREE.PointLight(palette.highlight, 110);
  key.position.set(5, 7, 8);
  lights.add(key);
  const fill = new THREE.PointLight(palette.text, 24);
  fill.position.set(-6, 2, 3);
  lights.add(fill);
  return lights;
}
