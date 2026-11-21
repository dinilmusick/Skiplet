import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { PALETTE, threeColor } from '../../utils/palette';

export interface StageLightingHandle {
  update: (
    moodBlend: number,
    focusPos: THREE.Vector3,
    elapsed?: number,
    reducedMotion?: boolean,
    scrollImpulse?: number,
  ) => void;
  dispose: () => void;
}

export function createStageLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer | null,
  isSoftwareGl: boolean,
): StageLightingHandle {
  const isWebGl = renderer !== null;
  if (isWebGl && !isSoftwareGl) RectAreaLightUniformsLib.init();

  let envTex: THREE.Texture | null = null;
  if (renderer) {
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      pmrem.dispose();
    } catch {
      envTex = null;
    }
  }

  const voidColor = threeColor(PALETTE.base).multiplyScalar(0.38);
  scene.background = voidColor.clone();
  scene.fog = new THREE.FogExp2(voidColor.getHex(), 0.014);

  const purpleSky = threeColor(PALETTE.purpleBright);
  const orangeSky = threeColor(PALETTE.amberBright);
  const purpleDeep = threeColor(PALETTE.purpleDeep);
  const amberDeep = threeColor(PALETTE.amberDeep);
  const purpleRim = threeColor(PALETTE.purple);
  const orangeRim = threeColor(PALETTE.highlight);

  const hemi = new THREE.HemisphereLight(purpleSky, purpleDeep, 0.14);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(threeColor(PALETTE.text), 0.85);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  const d = 7;
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  scene.add(keyLight, keyLight.target);

  const rimLight = new THREE.DirectionalLight(purpleRim, 1.65);
  scene.add(rimLight, rimLight.target);

  let studioBarA: THREE.RectAreaLight | null = null;
  let studioBarB: THREE.RectAreaLight | null = null;
  if (isWebGl && !isSoftwareGl) {
    studioBarA = new THREE.RectAreaLight(purpleSky, 4.8, 9.0, 0.24);
    studioBarB = new THREE.RectAreaLight(orangeSky, 3.4, 7.6, 0.22);
    scene.add(studioBarA, studioBarB);
  }

  const _offset = new THREE.Vector3();

  return {
    update: (moodBlend: number, focusPos: THREE.Vector3, elapsed = 0, reducedMotion = false, scrollImpulse = 0) => {
      hemi.color.copy(purpleSky).lerp(orangeSky, moodBlend);
      hemi.groundColor.copy(purpleDeep).lerp(amberDeep, moodBlend);
      rimLight.color.copy(purpleRim).lerp(orangeRim, moodBlend);
      rimLight.intensity = 1.65 + (reducedMotion ? 0 : scrollImpulse * 1.45);
      keyLight.intensity = 0.85 + (reducedMotion ? 0 : scrollImpulse * 0.45);

      const sweep = reducedMotion ? 0 : Math.sin(elapsed * 0.38) * 1.6 + scrollImpulse * 1.8;
      _offset.copy(focusPos).normalize();
      keyLight.position.copy(focusPos).addScaledVector(_offset, 9);
      keyLight.position.y += 5.2;
      keyLight.position.x -= 4.2 - sweep * 0.5;
      keyLight.target.position.copy(focusPos);

      rimLight.position.copy(focusPos).addScaledVector(_offset, -3.5);
      rimLight.position.x += 7.2 + sweep * 0.6;
      rimLight.position.y -= 1.8;
      rimLight.target.position.copy(focusPos);

      if (studioBarA && studioBarB) {
        studioBarA.color.copy(purpleSky).lerp(orangeSky, moodBlend);
        studioBarA.intensity = 4.8 + (reducedMotion ? 0 : scrollImpulse * 2.4);
        studioBarA.position.set(focusPos.x - 3.4 + sweep, focusPos.y + 3.8, focusPos.z + 4.4);
        studioBarA.lookAt(focusPos);

        studioBarB.color.copy(purpleRim).lerp(orangeRim, moodBlend);
        studioBarB.intensity = 3.4 + (reducedMotion ? 0 : scrollImpulse * 2.0);
        studioBarB.position.set(focusPos.x + 3.9 - sweep, focusPos.y - 2.1, focusPos.z + 3.6);
        studioBarB.lookAt(focusPos);
      }
    },
    dispose: () => {
      envTex?.dispose();
    },
  };
}
