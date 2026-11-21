import * as THREE from 'three';
import { PALETTE, threeColor } from '../../utils/palette';

export interface PerspectiveSculpture {
  group: THREE.Group;
  update: (elapsed: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

function makeMaterials(accentHex: string, deepHex: string, track: { dispose: () => void }[]) {
  const titanium = new THREE.MeshPhysicalMaterial({
    color: threeColor(PALETTE.surface), metalness: 0.95, roughness: 0.1,
    clearcoat: 1.0, clearcoatRoughness: 0.04, iridescence: 0.55, iridescenceIOR: 1.4, envMapIntensity: 0.4,
  });
  const obsidian = new THREE.MeshPhysicalMaterial({
    color: threeColor(PALETTE.base), metalness: 0.45, roughness: 0.14,
    clearcoat: 1.0, clearcoatRoughness: 0.04, reflectivity: 1.0,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: threeColor(accentHex), metalness: 0.14, roughness: 0.04, clearcoat: 1.0,
    clearcoatRoughness: 0.03, reflectivity: 1.0, transparent: true, opacity: 0.56,
    emissive: threeColor(deepHex), emissiveIntensity: 0.68,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: threeColor(accentHex), emissive: threeColor(accentHex),
    emissiveIntensity: 2.1, roughness: 0.12, metalness: 0.3,
  });
  track.push(titanium, obsidian, glass, rim);
  return { titanium, obsidian, glass, rim };
}

function addGlowAura(group: THREE.Group, accentHex: string, disposables: { dispose: () => void }[]) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 124);
  g.addColorStop(0, accentHex); g.addColorStop(0.42, PALETTE.surface); g.addColorStop(1, 'transparent');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(5.6, 5.6);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -1.1;
  group.add(mesh);
  disposables.push(tex, geo, mat);
}

export function createPerspectiveSculpture(index: number, lowPoly = false): PerspectiveSculpture {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const warm = index % 2 === 0;
  const accent = warm ? PALETTE.amberBright : PALETTE.purpleBright;
  const mats = makeMaterials(accent, warm ? PALETTE.amberDeep : PALETTE.purpleDeep, disposables);
  addGlowAura(group, accent, disposables);
  const motif = index % 6;
  const tSeg = lowPoly ? 8 : 16, rSeg = lowPoly ? 32 : 96;
  const updaters: ((t: number) => void)[] = [];
  const add = <T extends THREE.BufferGeometry>(geo: T, mat: THREE.Material) => { disposables.push(geo); return new THREE.Mesh(geo, mat); };

  if (motif === 1) {
    // Gyroscopic Compression Rings (Predictability & Compressibility)
    const core = add(new THREE.OctahedronGeometry(1.15, 0), mats.obsidian);
    const shell = add(new THREE.OctahedronGeometry(1.38, lowPoly ? 0 : 1), mats.glass);
    group.add(core, shell);
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const r = add(new THREE.TorusGeometry(1.85 + i * 0.42, 0.055 - i * 0.01, tSeg, rSeg), i === 1 ? mats.rim : mats.titanium);
      r.rotation.set(i * 0.7, i * 0.9, 0.4);
      group.add(r);
      rings.push(r);
    }
    updaters.push(t => {
      core.rotation.y = t * 0.38;
      core.rotation.x = Math.sin(t * 0.45) * 0.3;
      const pulse = 1 + Math.sin(t * 1.1) * 0.06;
      shell.scale.setScalar(pulse);
      shell.rotation.y = -t * 0.24;
      rings.forEach((r, i) => {
        r.rotation.x = i * 0.7 + t * (0.28 - i * 0.07);
        r.rotation.y = i * 0.9 + Math.sin(t * 0.5 + i) * 0.45;
      });
    });
  } else if (motif === 2) {
    // Split Aperture Lens (The Context That Is Missing)
    const core = add(new THREE.IcosahedronGeometry(0.88, lowPoly ? 0 : 1), mats.glass);
    const arcGeo = new THREE.TorusGeometry(1.85, 0.16, tSeg, rSeg, Math.PI * 0.78);
    const leftArc = add(arcGeo, mats.titanium);
    const rightArc = new THREE.Mesh(arcGeo, mats.titanium);
    const halo = add(new THREE.TorusGeometry(2.55, 0.024, tSeg, rSeg), mats.rim);
    group.add(core, leftArc, rightArc, halo);
    updaters.push(t => {
      const gap = 0.25 + Math.sin(t * 0.75) * 0.18;
      leftArc.position.x = -gap;
      leftArc.rotation.z = Math.PI * 0.62 + Math.sin(t * 0.4) * 0.25;
      rightArc.position.x = gap;
      rightArc.rotation.z = -Math.PI * 0.38 + Math.sin(t * 0.4) * 0.25;
      core.rotation.y = t * 0.42;
      core.rotation.z = Math.cos(t * 0.5) * 0.25;
      halo.rotation.x = 0.55 + Math.sin(t * 0.32) * 0.2;
      halo.rotation.y = t * 0.22;
    });
  } else if (motif === 4) {
    // Synchronized Twin Resonance Prisms (Encoder & Decoder Must Agree)
    const pA = add(new THREE.CylinderGeometry(0.15, 0.95, 2.2, 6), mats.titanium);
    const pB = add(new THREE.CylinderGeometry(0.95, 0.15, 2.2, 6), mats.glass);
    const band = add(new THREE.TorusGeometry(2.25, 0.042, tSeg, rSeg), mats.rim);
    const nodeGeo = new THREE.SphereGeometry(0.14, tSeg, tSeg);
    disposables.push(nodeGeo);
    const n1 = new THREE.Mesh(nodeGeo, mats.rim);
    const n2 = new THREE.Mesh(nodeGeo, mats.rim);
    group.add(pA, pB, band, n1, n2);
    updaters.push(t => {
      const sep = 0.75 + Math.sin(t * 0.8) * 0.22;
      pA.position.set(-sep, Math.sin(t * 0.8) * 0.18, 0);
      pB.position.set(sep, -Math.sin(t * 0.8) * 0.18, 0);
      pA.rotation.set(0.35, t * 0.55, 0.25);
      pB.rotation.set(-0.35, t * 0.55 + Math.PI / 6, -0.25);
      band.rotation.set(Math.PI * 0.38 + Math.sin(t * 0.3) * 0.15, t * 0.2, 0);
      n1.position.set(Math.cos(t * 0.9) * 2.25, Math.sin(t * 0.9) * 1.1, Math.sin(t * 0.9) * 1.9);
      n2.position.set(-n1.position.x, -n1.position.y, -n1.position.z);
    });
  } else if (motif === 5) {
    // Orbital Data Lattice Helix (Clues Inside the Data)
    const spine = add(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 16), mats.rim);
    group.add(spine);
    const shardGeo = new THREE.BoxGeometry(0.46, 0.18, 0.46);
    disposables.push(shardGeo);
    const shards: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(shardGeo, i % 2 === 0 ? mats.titanium : mats.glass);
      group.add(m);
      shards.push(m);
    }
    updaters.push(t => {
      group.rotation.z = Math.sin(t * 0.3) * 0.16;
      shards.forEach((s, i) => {
        const a = t * 0.65 + i * 0.68;
        const r = 1.15 + Math.sin(t * 0.9 + i) * 0.2;
        s.position.set(Math.cos(a) * r, (i - 4.5) * 0.36, Math.sin(a) * r);
        s.rotation.set(a * 0.5, a, 0.3);
      });
    });
  } else if (motif === 0) {
    // Kinetic Selector Blades (Intelligence Chooses the Transformer)
    const core = add(new THREE.SphereGeometry(0.72, lowPoly ? 14 : 32, lowPoly ? 10 : 24), mats.glass);
    group.add(core);
    const bladeGeo = new THREE.BoxGeometry(2.5, 0.12, 0.92);
    disposables.push(bladeGeo);
    const blades: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(bladeGeo, i === 2 ? mats.rim : mats.titanium);
      group.add(b);
      blades.push(b);
    }
    updaters.push(t => {
      core.scale.setScalar(1 + Math.sin(t * 1.3) * 0.08);
      blades.forEach((b, i) => {
        const offset = i - 2;
        b.position.y = offset * 0.52;
        b.rotation.y = Math.sin(t * 0.65 + i * 0.45) * 0.72;
        b.rotation.z = Math.cos(t * 0.42 + i * 0.3) * 0.14;
      });
    });
  } else {
    // Horizon Wave Pendulum (Context Before the Next Token)
    const ring = add(new THREE.TorusGeometry(2.35, 0.032, tSeg, rSeg), mats.rim);
    ring.rotation.x = Math.PI * 0.42;
    group.add(ring);
    const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.45, tSeg);
    disposables.push(rodGeo);
    const rods: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const rod = new THREE.Mesh(rodGeo, i % 3 === 0 ? mats.glass : mats.titanium);
      group.add(rod);
      rods.push(rod);
    }
    updaters.push(t => {
      ring.rotation.z = t * 0.22;
      rods.forEach((rod, i) => {
        const a = (i / 12) * Math.PI * 2 + t * 0.25;
        rod.position.set(Math.cos(a) * 1.75, Math.sin(t * 1.4 + i * 0.55) * 0.62, Math.sin(a) * 1.75);
        rod.rotation.z = Math.sin(t * 0.8 + i) * 0.16;
      });
    });
  }

  return {
    group,
    update: (elapsed, reducedMotion) => {
      const t = reducedMotion ? 0 : elapsed + index * 1.3;
      group.position.y = reducedMotion ? 0 : Math.sin(t * 0.62) * 0.14;
      group.rotation.x = reducedMotion ? 0.12 : 0.14 + Math.cos(t * 0.31) * 0.08;
      for (const fn of updaters) fn(t);
    },
    dispose: () => { for (const item of disposables) item.dispose(); },
  };
}
