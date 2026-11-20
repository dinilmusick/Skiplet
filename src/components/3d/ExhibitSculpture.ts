import * as THREE from 'three';

export interface Exhibit {
  group: THREE.Group;
  update: (seconds: number, active: boolean) => void;
  dispose: () => void;
}

export function createExhibit(index: number, palette: {
  highlight: string; surface: string; text: string;
}): Exhibit {
  const group = new THREE.Group();
  const detail = 1 + index % 3;
  const coreGeometry = new THREE.IcosahedronGeometry(0.85, detail);
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: palette.surface, emissive: palette.highlight, emissiveIntensity: 0.32,
    metalness: 0.52, roughness: 0.22, clearcoat: 0.8,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);
  const ringGeometry = new THREE.TorusGeometry(1.36, 0.018, 7, 108);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: palette.highlight });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = 0.4;
  group.add(ring);
  const satelliteGeometry = new THREE.SphereGeometry(0.16, 16, 12);
  const satelliteMaterial = new THREE.MeshBasicMaterial({ color: palette.text });
  const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
  satellite.position.set(1.37, 0, 0);
  group.add(satellite);

  return {
    group,
    update: (seconds, active) => {
      core.rotation.y = seconds * (active ? 0.13 : 0.025);
      core.rotation.x = seconds * 0.032;
      ring.rotation.z = seconds * 0.05;
      satellite.position.set(Math.cos(seconds * 0.05) * 1.37,
        Math.sin(seconds * 0.05) * 1.37, 0);
    },
    dispose: () => {
      coreGeometry.dispose(); coreMaterial.dispose();
      ringGeometry.dispose(); ringMaterial.dispose();
      satelliteGeometry.dispose(); satelliteMaterial.dispose();
    },
  };
}
