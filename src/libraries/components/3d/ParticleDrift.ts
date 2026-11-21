import * as THREE from 'three';

/** Palette-colored moving particles; owned and disposed by the hosting scene. */
export function createParticleDrift(color: string, lowPoly: boolean, seed = 1) {
  const count = lowPoly ? 32 : 120;
  const positions = new Float32Array(count * 3);
  let n = (seed + 1) >>> 0;
  const random = () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const distance = 2.8 + random() * 8;
    const azimuth = random() * Math.PI * 2;
    const height = (random() - 0.5) * 7;
    positions[i * 3] = Math.cos(azimuth) * distance;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(azimuth) * distance;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color), size: 0.06, sizeAttenuation: true,
    transparent: true, opacity: 0.7, depthWrite: false,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));
  return {
    group,
    update: (seconds: number, reducedMotion: boolean) => {
      group.rotation.y = reducedMotion ? 0 : seconds * 0.011;
      group.rotation.z = reducedMotion ? 0 : Math.sin(seconds * 0.12) * 0.016;
    },
    dispose: () => { geometry.dispose(); material.dispose(); },
  };
}
