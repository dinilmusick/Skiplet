import * as THREE from 'three';
import { threeColor } from '../../utils/palette';

export interface SphereWorldOptions {
  radius: number;
  center: readonly [number, number, number];
  exhibitDepth: number;
  trackAltitude: number;
  palette: { base: string; purple: string; purpleBright: string; purpleDeep: string; highlight: string; amberDeep: string };
}

export interface SphereWorldHandle {
  group: THREE.Group;
  update: (elapsed: number, moodBlend: number) => void;
  dispose: () => void;
}

export function createSphereWorld(lowPoly: boolean, options: SphereWorldOptions): SphereWorldHandle {
  const { radius, center, exhibitDepth, trackAltitude, palette } = options;
  const group = new THREE.Group();
  group.position.set(center[0], center[1], center[2]);
  const disposables: { dispose: () => void }[] = [];

  // Glossy black-glass sphere core catching sweeping studio reflections
  const sphereGeo = new THREE.SphereGeometry(radius, lowPoly ? 28 : 80, lowPoly ? 20 : 64);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: threeColor(palette.base),
    metalness: 0.88,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    envMapIntensity: 0.36,
    emissive: threeColor(palette.purpleDeep),
    emissiveIntensity: 0.11,
  });
  const core = new THREE.Mesh(sphereGeo, sphereMat);
  core.receiveShadow = true;
  group.add(core);
  disposables.push(sphereGeo, sphereMat);

  // Precision wireframe meridian grid locked to sphere rotation
  const wireGeo = new THREE.SphereGeometry(radius + 0.05, lowPoly ? 20 : 48, lowPoly ? 14 : 32);
  const wireMat = new THREE.MeshBasicMaterial({
    color: threeColor(palette.purple),
    wireframe: true,
    transparent: true,
    opacity: 0.13,
  });
  group.add(new THREE.Mesh(wireGeo, wireMat));
  disposables.push(wireGeo, wireMat);

  // Glowing orbital track on the sphere skin directly beneath every exhibit collar
  const trackDist = Math.hypot(trackAltitude, exhibitDepth);
  const trackR = (radius * trackAltitude) / trackDist;
  const trackZ = (radius * exhibitDepth) / trackDist;
  const trackGeo = new THREE.TorusGeometry(trackR, 0.036, lowPoly ? 6 : 12, lowPoly ? 64 : 160);
  const trackMat = new THREE.MeshStandardMaterial({
    color: threeColor(palette.purpleBright),
    emissive: threeColor(palette.purple),
    emissiveIntensity: 1.75,
    roughness: 0.18,
  });
  const track = new THREE.Mesh(trackGeo, trackMat);
  track.position.z = trackZ;
  group.add(track);
  disposables.push(trackGeo, trackMat);

  // Intensified Fresnel twilight limb shell
  const haloGeo = new THREE.SphereGeometry(radius + 0.65, lowPoly ? 12 : 64, lowPoly ? 8 : 48);
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uGlowColor: { value: threeColor(palette.purple) },
      uIntensity: { value: 0.78 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uGlowColor;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float rim = pow(clamp(1.0 - abs(dot(vNormal, vViewDir)), 0.0, 1.0), 3.1);
        gl_FragColor = vec4(uGlowColor, rim * uIntensity);
      }
    `,
  });
  group.add(new THREE.Mesh(haloGeo, haloMat));
  disposables.push(haloGeo, haloMat);

  const purpleTint = threeColor(palette.purple);
  const orangeTint = threeColor(palette.highlight);
  const purpleDeep = threeColor(palette.purpleDeep);
  const amberDeep = threeColor(palette.amberDeep);

  return {
    group,
    update: (_elapsed: number, moodBlend: number) => {
      wireMat.color.copy(purpleTint).lerp(orangeTint, moodBlend);
      trackMat.color.copy(purpleTint).lerp(orangeTint, moodBlend);
      trackMat.emissive.copy(purpleTint).lerp(orangeTint, moodBlend);
      haloMat.uniforms.uGlowColor.value.copy(purpleTint).lerp(orangeTint, moodBlend);
      sphereMat.emissive.copy(purpleDeep).lerp(amberDeep, moodBlend);
    },
    dispose: () => { for (const item of disposables) item.dispose(); },
  };
}
