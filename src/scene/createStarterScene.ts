import * as THREE from 'three';
import config from '../../meditations.config.json';

export interface StarterScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (seconds: number) => void;
  dispose: () => void;
}

export function createStarterScene(): StarterScene {
  const { base, highlight, surface, text } = config.palette;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(base);
  scene.fog = new THREE.FogExp2(base, 0.032);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 70);
  camera.position.set(0, 0.4, 10);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(text, surface, 2.1));
  const key = new THREE.PointLight(highlight, 85);
  key.position.set(4, 3, 5);
  scene.add(key);

  const sculpture = new THREE.Group();
  scene.add(sculpture);
  const shellGeometry = new THREE.IcosahedronGeometry(1.72, 3);
  const shellMaterial = new THREE.MeshPhysicalMaterial({
    color: surface,
    metalness: 0.5,
    roughness: 0.23,
    transmission: 0.16,
    thickness: 1.1,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
    flatShading: true,
  });
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  sculpture.add(shell);

  const rimGeometry = new THREE.TorusGeometry(2.55, 0.024, 9, 180);
  const rimMaterial = new THREE.MeshBasicMaterial({ color: highlight });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.set(0.54, 0.34, -0.25);
  sculpture.add(rim);

  const innerGeometry = new THREE.IcosahedronGeometry(0.68, 2);
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: highlight,
    emissive: highlight,
    emissiveIntensity: 0.48,
    metalness: 0.15,
    roughness: 0.28,
    flatShading: true,
  });
  sculpture.add(new THREE.Mesh(innerGeometry, innerMaterial));

  const starCount = 120;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 9 + (i % 11) * 0.55;
    const theta = i * 2.399963229728653;
    const y = (2 * i / starCount - 1) * r;
    const radial = Math.sqrt(Math.max(0, r * r - y * y));
    positions[i * 3] = Math.cos(theta) * radial;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * radial;
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starsMaterial = new THREE.PointsMaterial({
    color: text, transparent: true, opacity: 0.5, size: 0.055,
  });
  scene.add(new THREE.Points(starsGeometry, starsMaterial));

  return {
    scene,
    camera,
    update: (seconds) => {
      sculpture.rotation.y = seconds * 0.09;
      sculpture.rotation.x = Math.sin(seconds * 0.23) * 0.08;
      shell.rotation.z = -seconds * 0.025;
      rim.rotation.z = -0.25 + seconds * 0.045;
    },
    dispose: () => {
      shellGeometry.dispose();
      shellMaterial.dispose();
      rimGeometry.dispose();
      rimMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      scene.clear();
    },
  };
}
