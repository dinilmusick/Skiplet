import * as THREE from 'three';

export type LandmarkParticleMode = 'burst' | 'stream' | 'orbital';

export interface LandmarkParticlesHandle {
  group: THREE.Group;
  trigger: (origin: readonly [number, number, number], colorHex: string, mode: LandmarkParticleMode) => void;
  clear: () => void;
  update: (dt: number, elapsed: number, audioAmplitude: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

/** Reusable event-driven 3D particle system linked to landmark focus and audio energy. */
export function createLandmarkParticles(initialColor: string, lowPoly = false): LandmarkParticlesHandle {
  const count = lowPoly ? 36 : 96;
  const positions = new Float32Array(count * 3);
  const dirs = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = (i * 2.39996) % (Math.PI * 2);
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    dirs[i * 3] = Math.sin(phi) * Math.cos(theta);
    dirs[i * 3 + 1] = Math.cos(phi);
    dirs[i * 3 + 2] = Math.sin(phi) * Math.sin(theta);
    seeds[i] = (i % 13) / 13;
  }

  const geometry = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', attr);

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(initialColor),
    size: 0.095,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  const group = new THREE.Group();
  group.add(points);

  let active = false;
  let mode: LandmarkParticleMode = 'burst';
  let age = 0;
  let strength = 0;
  const originVec = new THREE.Vector3();

  return {
    group,
    trigger: (origin, colorHex, nextMode) => {
      originVec.set(origin[0], origin[1], origin[2]);
      material.color.set(colorHex);
      mode = nextMode;
      age = 0;
      active = true;
    },
    clear: () => {
      active = false;
    },
    update: (dt, elapsed, audioAmplitude, reducedMotion) => {
      const targetStrength = active ? 1 : 0;
      const damp = reducedMotion ? 1 : 1 - Math.exp(-dt * (active ? 5 : 3.5));
      strength = THREE.MathUtils.lerp(strength, targetStrength, damp);
      if (strength < 0.01 && !active) {
        material.opacity = 0;
        points.visible = false;
        return;
      }
      points.visible = true;
      age += dt;
      const pulse = 1 + audioAmplitude * 0.65;
      material.opacity = strength * (0.55 + audioAmplitude * 0.4);
      material.size = 0.045 + audioAmplitude * 0.025;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const s = seeds[i];
        const dx = dirs[idx], dy = dirs[idx + 1], dz = dirs[idx + 2];
        if (mode === 'burst') {
          const r = (0.35 + ((age * (0.7 + s * 0.5)) % 2.4)) * pulse;
          positions[idx] = originVec.x + dx * r;
          positions[idx + 1] = originVec.y + dy * r;
          positions[idx + 2] = originVec.z + dz * r;
        } else if (mode === 'stream') {
          const flow = (age * (0.9 + s * 0.6) + s * 2) % 3.2;
          positions[idx] = originVec.x + dx * (0.35 + flow * 0.35);
          positions[idx + 1] = originVec.y + (flow - 1.2) * 1.1;
          positions[idx + 2] = originVec.z + dz * (0.35 + flow * 0.35);
        } else {
          const angle = elapsed * (0.75 + s * 0.5) + i * 0.4;
          const r = (0.85 + s * 1.35) * pulse;
          positions[idx] = originVec.x + Math.cos(angle) * r;
          positions[idx + 1] = originVec.y + Math.sin(angle * 0.7 + s * 3) * 0.9;
          positions[idx + 2] = originVec.z + Math.sin(angle) * r;
        }
      }
      attr.needsUpdate = true;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
