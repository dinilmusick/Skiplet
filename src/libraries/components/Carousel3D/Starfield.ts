import * as THREE from 'three';
import type { CarouselAsset } from './types';

/** The original deterministic starfield, supplied as a replaceable background. */
export function createStarfield(color: string, lowPoly = false): CarouselAsset {
  const count = lowPoly ? 260 : 650;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 46 + (i % 19) * 2.4;
    const u = Math.sin(i * 12.9898) * 43758.5453;
    const v = Math.sin(i * 78.233) * 19341.123;
    const theta = (u - Math.floor(u)) * Math.PI * 2;
    const phi = Math.acos(2 * (v - Math.floor(v)) - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color), size: 0.14, transparent: true,
    opacity: 0.28, sizeAttenuation: true,
  });
  const stars = new THREE.Points(geometry, material);
  return {
    group: stars,
    update: frame => { stars.rotation.z = frame.angle * 0.12; },
    dispose: () => { geometry.dispose(); material.dispose(); },
  };
}
