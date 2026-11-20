import * as THREE from 'three';

export function createOrbitSphere(palette: { surface: string; highlight: string }) {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(7, 48, 28);
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: palette.surface, metalness: 0.5, roughness: 0.48,
    transparent: true, opacity: 0.42, side: THREE.FrontSide,
  });
  group.add(new THREE.Mesh(geometry, shellMaterial));
  const gridMaterial = new THREE.MeshBasicMaterial({
    color: palette.highlight, transparent: true, opacity: 0.11, wireframe: true,
  });
  group.add(new THREE.Mesh(geometry, gridMaterial));
  return {
    group,
    dispose: () => { geometry.dispose(); shellMaterial.dispose(); gridMaterial.dispose(); },
  };
}
