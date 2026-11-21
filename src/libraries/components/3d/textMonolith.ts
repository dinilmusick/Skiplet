import * as THREE from 'three';
import { create3DTextLine } from './glyphs';
import { PALETTE, threeColor } from '../../utils/palette';

export interface TextMonolithHandle {
  group: THREE.Group;
  update: (elapsed: number, glarePhase: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w * 0.5;
  const hh = h * 0.5;
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

export function createTextMonolith(
  isSoftwareGl: boolean,
  lowPoly = false,
  lines: readonly [string, string, string],
): TextMonolithHandle {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  // 1. Floating flagship-style beveled dark twilight slab
  const slabShape = roundedRectShape(6.6, 3.85, 0.36);
  const slabGeo = new THREE.ExtrudeGeometry(slabShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: lowPoly ? 2 : 6,
    curveSegments: lowPoly ? 6 : 20,
  });
  slabGeo.center();
  slabGeo.computeVertexNormals();

  const chassisMat = new THREE.MeshPhysicalMaterial({
    color: threeColor(PALETTE.surface), metalness: 0.94, roughness: 0.12,
    clearcoat: 1.0, clearcoatRoughness: 0.04, iridescence: 0.55, iridescenceIOR: 1.4, envMapIntensity: 0.4,
  });
  const bezelEdgeMat = new THREE.MeshPhysicalMaterial({
    color: threeColor(PALETTE.purple), metalness: 0.95, roughness: 0.1, anisotropy: 0.85,
    clearcoat: 1.0, clearcoatRoughness: 0.04, emissive: threeColor(PALETTE.purpleDeep), emissiveIntensity: 0.65,
  });
  const slab = new THREE.Mesh(slabGeo, [chassisMat, bezelEdgeMat]);
  slab.position.z = -0.34;
  slab.receiveShadow = true;
  slab.castShadow = true;
  group.add(slab);
  disposables.push(slabGeo, chassisMat, bezelEdgeMat);

  // 2. Mirror-black optical sapphire display glass face
  const glassGeo = new THREE.ExtrudeGeometry(roundedRectShape(6.28, 3.55, 0.28), {
    depth: 0.02,
    bevelEnabled: false,
    curveSegments: lowPoly ? 6 : 16,
  });
  glassGeo.center();
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: threeColor(PALETTE.base), metalness: 0.14, roughness: 0.04, clearcoat: 1.0,
    clearcoatRoughness: 0.03, reflectivity: 1.0, ior: 1.65, specularIntensity: 1.0,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.z = -0.18;
  glass.receiveShadow = true;
  group.add(glass);
  disposables.push(glassGeo, glassMat);

  // 3. Glowing 3D perimeter light-pipe tracing the chamfered bezel
  const rimPts = roundedRectShape(6.72, 3.97, 0.4).getPoints(lowPoly ? 32 : 96).slice(0, -1);
  const rimCurve = new THREE.CatmullRomCurve3(rimPts.map(p => new THREE.Vector3(p.x, p.y, -0.22)), true);
  const rimGeo = new THREE.TubeGeometry(rimCurve, lowPoly ? 48 : 128, 0.022, lowPoly ? 5 : 8, true);
  const rimMat = new THREE.MeshStandardMaterial({
    color: threeColor(PALETTE.purpleBright), emissive: threeColor(PALETTE.purpleBright),
    emissiveIntensity: 2.1, roughness: 0.12, transparent: true, opacity: 0.88,
  });
  group.add(new THREE.Mesh(rimGeo, rimMat));
  disposables.push(rimGeo, rimMat);

  // 4. Sculpted glossy 3D extruded typography over the glass face
  const textFaceMat = new THREE.MeshPhysicalMaterial({
    color: threeColor(PALETTE.text), metalness: 0.42, roughness: 0.14, clearcoat: 1.0,
    clearcoatRoughness: 0.05, emissive: threeColor(PALETTE.purpleDeep), emissiveIntensity: 0.22,
  });
  const textBevelMat = new THREE.MeshPhysicalMaterial({
    color: threeColor(PALETTE.purpleBright), metalness: 0.9, roughness: 0.12, clearcoat: 1.0,
    clearcoatRoughness: 0.04, emissive: threeColor(PALETTE.purple), emissiveIntensity: 0.72,
  });
  const textMats = [textFaceMat, textBevelMat];
  disposables.push(textFaceMat, textBevelMat);

  const line1 = create3DTextLine(lines[0], 0.62, 0.22, textMats, lowPoly);
  line1.position.set(0, 0.95, 0.16);
  const line2 = create3DTextLine(lines[1], 0.62, 0.22, textMats, lowPoly);
  line2.position.set(0, 0.02, 0.16);
  const line3 = create3DTextLine(lines[2], 0.76, 0.26, textMats, lowPoly);
  line3.position.set(0, -0.96, 0.20);

  const textGroup = new THREE.Group();
  textGroup.add(line1, line2, line3);
  group.add(textGroup);
  textGroup.traverse(obj => {
    if (obj instanceof THREE.Mesh) disposables.push(obj.geometry);
  });

  // 5. Glowing orbital twilight arcs behind the monolith
  const arcGeo = new THREE.TorusGeometry(4.55, 0.024, lowPoly ? 6 : 12, lowPoly ? 48 : 120, Math.PI * 0.72);
  const arcMat = new THREE.MeshStandardMaterial({
    color: threeColor(PALETTE.purpleBright),
    emissive: threeColor(PALETTE.purple),
    emissiveIntensity: 1.7,
    roughness: 0.15,
    transparent: true,
    opacity: 0.72,
  });
  const arc1 = new THREE.Mesh(arcGeo, arcMat);
  arc1.position.z = -0.85;
  arc1.rotation.z = 0.6;
  const arc2 = new THREE.Mesh(arcGeo, arcMat);
  arc2.position.z = -1.15;
  arc2.rotation.z = Math.PI + 0.4;
  group.add(arc1, arc2);
  disposables.push(arcGeo, arcMat);

  // 6. Intense sweeping edge glare lights sculpting glossy bevels
  const glareA = new THREE.PointLight(threeColor(PALETTE.purpleBright), 7.2, 13, 2);
  const glareB = new THREE.PointLight(threeColor(PALETTE.purple), 6.4, 13, 2);
  group.add(glareA, glareB);

  let rectBar: THREE.RectAreaLight | null = null;
  if (!isSoftwareGl) {
    rectBar = new THREE.RectAreaLight(threeColor(PALETTE.purpleBright), 4.2, 6.2, 0.24);
    rectBar.position.set(0, 3.0, 0.8);
    rectBar.lookAt(0, 0, -0.2);
    group.add(rectBar);
  }

  return {
    group,
    update: (elapsed: number, glarePhase: number, reducedMotion: boolean) => {
      const t = reducedMotion ? glarePhase : elapsed * 0.42 + glarePhase;
      group.position.y = reducedMotion ? 0 : Math.sin(elapsed * 0.55) * 0.08;
      group.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.35) * 0.075;
      group.rotation.x = reducedMotion ? 0 : Math.cos(elapsed * 0.28) * 0.042;
      textGroup.position.z = reducedMotion ? 0 : Math.sin(elapsed * 0.72) * 0.045;
      rimMat.emissiveIntensity = reducedMotion ? 2.1 : 1.85 + Math.sin(elapsed * 1.15) * 0.45;
      glareA.position.set(Math.cos(t) * 4.2, Math.sin(t * 0.8) * 2.4, 0.72);
      glareB.position.set(Math.cos(t + Math.PI) * 4.2, Math.sin((t + Math.PI) * 0.8) * 2.4, -0.35);
      if (rectBar) {
        rectBar.position.set(Math.sin(t * 0.6) * 2.6, 2.9, 1.0);
        rectBar.lookAt(0, 0, -0.2);
      }
      arc1.rotation.z = 0.6 + (reducedMotion ? 0 : elapsed * 0.09);
      arc2.rotation.z = Math.PI + 0.4 - (reducedMotion ? 0 : elapsed * 0.07);
    },
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
