import * as THREE from 'three';
import { buildLandscapeTextures, buildUnderglowTexture } from './landscapeTextures';
import { PALETTE, threeColor } from '../../utils/palette';
export type LandscapeElevation = (u: number, v: number, distortion: number) => number;

export interface ContextLandscapeHandle {
  group: THREE.Group;
  setDistortion: (distortion: number) => void;
  update: (elapsed: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

const SIZE = 5.4;
const HALF = SIZE * 0.5;

export function createContextLandscape(
  maxAnisotropy: number, lowPoly: boolean, elevation: LandscapeElevation,
): ContextLandscapeHandle {
  const SEG = lowPoly ? 24 : 64;
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  const { map, emissiveMap } = buildLandscapeTextures(maxAnisotropy);
  const topGeo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  const topMat = new THREE.MeshPhysicalMaterial({
    map,
    emissive: threeColor(PALETTE.highlight),
    emissiveMap,
    emissiveIntensity: 1.45,
    roughness: 0.14,
    metalness: 0.42,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    reflectivity: 0.95,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  group.add(topMesh);
  disposables.push(map, emissiveMap, topGeo, topMat);

  const skirtPos = new Float32Array(SEG * 4 * 2 * 3 * 3);
  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.BufferAttribute(skirtPos, 3));
  const skirtMat = new THREE.MeshPhysicalMaterial({
    color: threeColor(PALETTE.surface),
    roughness: 0.18,
    metalness: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
  });
  group.add(new THREE.Mesh(skirtGeo, skirtMat));
  disposables.push(skirtGeo, skirtMat);

  const rimPts = new Float32Array((SEG * 4 + 1) * 3);
  const rimGeo = new THREE.BufferGeometry();
  rimGeo.setAttribute('position', new THREE.BufferAttribute(rimPts, 3));
  const rimMat = new THREE.LineBasicMaterial({ color: threeColor(PALETTE.amberBright) });
  group.add(new THREE.Line(rimGeo, rimMat));
  disposables.push(rimGeo, rimMat);

  const glowTex = buildUnderglowTexture();
  const floorGeo = new THREE.PlaneGeometry(SIZE * 1.75, SIZE * 1.75);
  const floorMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const floorGlow = new THREE.Mesh(floorGeo, floorMat);
  floorGlow.position.z = -0.05;
  group.add(floorGlow);
  disposables.push(glowTex, floorGeo, floorMat);

  const cols = SEG + 1;
  const edgeIndices: number[] = [];
  for (let i = 0; i < SEG; i++) edgeIndices.push(i);
  for (let i = 0; i < SEG; i++) edgeIndices.push(i * cols + SEG);
  for (let i = SEG; i > 0; i--) edgeIndices.push(SEG * cols + i);
  for (let i = SEG; i > 0; i--) edgeIndices.push(i * cols);

  let lastDistortion = -1;

  const setDistortion = (distortion: number) => {
    if (Math.abs(distortion - lastDistortion) < 0.0005) return;
    lastDistortion = distortion;

    const pos = topGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, elevation(pos.getX(i) / HALF, pos.getY(i) / HALF, distortion));
    }
    pos.needsUpdate = true;
    topGeo.computeVertexNormals();

    let sPtr = 0;
    for (let e = 0; e < edgeIndices.length; e++) {
      const a = edgeIndices[e];
      const b = edgeIndices[(e + 1) % edgeIndices.length];
      const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
      const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
      rimPts[e * 3] = ax; rimPts[e * 3 + 1] = ay; rimPts[e * 3 + 2] = az + 0.008;
      skirtPos.set([ax, ay, az, bx, by, bz, ax, ay, 0, bx, by, bz, bx, by, 0, ax, ay, 0], sPtr);
      sPtr += 18;
    }
    const first = edgeIndices[0];
    rimPts[edgeIndices.length * 3] = pos.getX(first);
    rimPts[edgeIndices.length * 3 + 1] = pos.getY(first);
    rimPts[edgeIndices.length * 3 + 2] = pos.getZ(first) + 0.008;

    (rimGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (skirtGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    skirtGeo.computeVertexNormals();
  };

  const update = (elapsed: number, reducedMotion: boolean) => {
    group.position.y = reducedMotion ? 0 : Math.sin(elapsed * 0.6) * 0.085;
    group.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 0.42) * 0.04;
    floorMat.opacity = reducedMotion ? 0.62 : 0.54 + Math.sin(elapsed * 0.9) * 0.14;
  };

  setDistortion(0);
  return { group, setDistortion, update, dispose: () => { for (const d of disposables) d.dispose(); } };
}
