import * as THREE from 'three';
import { createLandmarkParticles, type LandmarkParticlesHandle } from '../3d/LandmarkParticles';
import type { SceneLandmark } from './types';

export interface SceneEffectsRig {
  particles: LandmarkParticlesHandle;
  triggerTransitionPulse: () => void;
  applyLandmark: (landmark: SceneLandmark | null) => void;
  update: (dt: number, elapsed: number, audioAmplitude: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

export function createSceneEffectsRig(
  scene: THREE.Scene,
  baseBgHex: string,
  baseLightHex: string,
  lowPoly: boolean,
): SceneEffectsRig {
  const baseBg = new THREE.Color(baseBgHex);
  const baseLight = new THREE.Color(baseLightHex);
  scene.background = baseBg.clone();

  const ambient = new THREE.AmbientLight(baseLight.clone(), 1.55);
  const keyLight = new THREE.DirectionalLight(baseLight.clone(), 3.1);
  keyLight.position.set(4, 6, 8);
  const rimLight = new THREE.DirectionalLight(baseLight.clone(), 0.75);
  rimLight.position.set(-5, -2, -6);
  scene.add(ambient, keyLight, rimLight);

  const particles = createLandmarkParticles(baseLightHex, lowPoly);
  scene.add(particles.group);

  let activeLandmark: SceneLandmark | null = null;
  let scrollPulse = 0;

  const targetBg = baseBg.clone();
  const targetAmb = baseLight.clone();
  const targetKey = baseLight.clone();
  const targetRim = baseLight.clone();

  return {
    particles,
    triggerTransitionPulse: () => {
      scrollPulse = 1;
    },
    applyLandmark: landmark => {
      activeLandmark = landmark;
      const pfx = landmark?.events?.particles;
      if (landmark && pfx) {
        particles.trigger(landmark.position, pfx.color, pfx.mode);
      } else {
        particles.clear();
      }
    },
    update: (dt, elapsed, audioAmplitude, reducedMotion) => {
      scrollPulse *= Math.exp(-dt * 4.5);
      const lfx = activeLandmark?.events?.lighting;
      const factor = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.2);

      targetBg.set(lfx?.backgroundColor ?? baseBgHex);
      targetAmb.set(lfx?.ambientColor ?? baseLightHex);
      targetKey.set(lfx?.keyColor ?? baseLightHex);
      targetRim.set(lfx?.rimColor ?? baseLightHex);

      (scene.background as THREE.Color).lerp(targetBg, factor);
      ambient.color.lerp(targetAmb, factor);
      keyLight.color.lerp(targetKey, factor);
      rimLight.color.lerp(targetRim, factor);

      const pulseSpeed = lfx?.pulseSpeed ?? 1.6;
      const pulseDepth = reducedMotion ? 0 : (lfx?.pulseDepth ?? 0.32) * (0.4 + audioAmplitude * 0.85);
      const mod = lfx ? Math.sin(elapsed * pulseSpeed) * pulseDepth : 0;

      const targetAmbI = (lfx?.ambientIntensity ?? 1.55) + mod * 0.4 + scrollPulse * 0.55;
      const targetKeyI = (lfx?.keyIntensity ?? 3.1) + mod * 0.8 + scrollPulse * 1.1;
      const targetRimI = (lfx?.rimIntensity ?? 0.75) + audioAmplitude * 1.3 + scrollPulse * 1.4;

      ambient.intensity = THREE.MathUtils.lerp(ambient.intensity, targetAmbI, factor);
      keyLight.intensity = THREE.MathUtils.lerp(keyLight.intensity, targetKeyI, factor);
      rimLight.intensity = THREE.MathUtils.lerp(rimLight.intensity, targetRimI, factor);

      particles.update(dt, elapsed, audioAmplitude, reducedMotion);
    },
    dispose: () => {
      particles.dispose();
    },
  };
}
