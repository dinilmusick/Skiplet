import * as THREE from 'three';

type GlyphSpec = { w: number; build: () => THREE.Shape };

const S = 0.20;

function poly(pts: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();
  return shape;
}

function holePath(pts: [number, number][]): THREE.Path {
  const path = new THREE.Path();
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
  path.closePath();
  return path;
}

function ellipsePoint(cx: number, cy: number, rx: number, ry: number, a: number): [number, number] {
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
}

function arcPoints(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 22) {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    out.push(ellipsePoint(cx, cy, rx, ry, a0 + ((a1 - a0) * i) / n));
  }
  return out;
}

function buildS(): THREE.Shape {
  const pts: [number, number][] = [
    [0.06, 0.14], [0.16, 0.04], [0.34, 0], [0.52, 0.04], [0.64, 0.14],
    [0.68, 0.28], [0.64, 0.42], [0.50, 0.52], [0.28, 0.60], [0.21, 0.67],
    [0.21, 0.76], [0.33, 0.81], [0.47, 0.78], [0.54, 0.72], [0.66, 0.84],
    [0.54, 0.96], [0.35, 1], [0.16, 0.96], [0.05, 0.85], [0.02, 0.71],
    [0.06, 0.56], [0.21, 0.46], [0.42, 0.38], [0.49, 0.30], [0.48, 0.22],
    [0.35, 0.18], [0.20, 0.21], [0.14, 0.27],
  ];
  return poly(pts);
}

const GLYPHS: Record<string, GlyphSpec> = {
  I: { w: 0.23, build: () => poly([[0, 0], [0.23, 0], [0.23, 1], [0, 1]]) },
  L: { w: 0.60, build: () => poly([[0, 0], [0.60, 0], [0.60, S], [S, S], [S, 1], [0, 1]]) },
  T: { w: 0.70, build: () => poly([[0.25, 0], [0.45, 0], [0.45, 1 - S], [0.70, 1 - S], [0.70, 1], [0, 1], [0, 1 - S], [0.25, 1 - S]]) },
  F: { w: 0.60, build: () => poly([[0, 0], [S, 0], [S, 0.40], [0.52, 0.40], [0.52, 0.60], [S, 0.60], [S, 1 - S], [0.60, 1 - S], [0.60, 1], [0, 1]]) },
  E: { w: 0.62, build: () => poly([[0, 0], [0.62, 0], [0.62, S], [S, S], [S, 0.40], [0.53, 0.40], [0.53, 0.60], [S, 0.60], [S, 1 - S], [0.62, 1 - S], [0.62, 1], [0, 1]]) },
  H: { w: 0.70, build: () => poly([[0, 0], [S, 0], [S, 0.40], [0.50, 0.40], [0.50, 0], [0.70, 0], [0.70, 1], [0.50, 1], [0.50, 0.60], [S, 0.60], [S, 1], [0, 1]]) },
  N: { w: 0.72, build: () => poly([[0, 0], [S, 0], [S, 0.62], [0.52, 0], [0.72, 0], [0.72, 1], [0.52, 1], [0.52, 0.38], [S, 1], [0, 1]]) },
  M: { w: 0.88, build: () => poly([[0, 0], [0.19, 0], [0.19, 0.64], [0.44, 0.16], [0.69, 0.64], [0.69, 0], [0.88, 0], [0.88, 1], [0.67, 1], [0.44, 0.54], [0.21, 1], [0, 1]]) },
  A: {
    w: 0.76,
    build: () => {
      const sh = poly([[0, 0], [0.21, 0], [0.27, 0.22], [0.49, 0.22], [0.55, 0], [0.76, 0], [0.49, 1], [0.27, 1]]);
      sh.holes.push(holePath([[0.31, 0.40], [0.38, 0.74], [0.45, 0.40]]));
      return sh;
    },
  },
  O: {
    w: 0.78,
    build: () => {
      const sh = new THREE.Shape();
      sh.absellipse(0.39, 0.5, 0.39, 0.5, 0, Math.PI * 2, false, 0);
      const hole = new THREE.Path();
      hole.absellipse(0.39, 0.5, 0.19, 0.30, 0, Math.PI * 2, true, 0);
      sh.holes.push(hole);
      return sh;
    },
  },
  C: {
    w: 0.72,
    build: () => {
      const outer = arcPoints(0.41, 0.5, 0.41, 0.5, 0.65, Math.PI * 2 - 0.65);
      const inner = arcPoints(0.41, 0.5, 0.21, 0.30, Math.PI * 2 - 0.65, 0.65);
      return poly([...outer, ...inner]);
    },
  },
  G: {
    w: 0.76,
    build: () => {
      const outer = arcPoints(0.40, 0.5, 0.40, 0.5, 0.65, Math.PI * 2 - 0.08, 26);
      const bar: [number, number][] = [[0.76, 0.46], [0.42, 0.46], [0.42, 0.29], [0.58, 0.29]];
      const inner = arcPoints(0.40, 0.5, 0.20, 0.30, Math.PI * 2 - 0.48, 0.65, 22);
      return poly([...outer, ...bar, ...inner]);
    },
  },
  D: {
    w: 0.72,
    build: () => {
      const outer: [number, number][] = [[0, 0], ...arcPoints(0.32, 0.5, 0.40, 0.5, -Math.PI / 2, Math.PI / 2), [0, 1]];
      const sh = poly(outer);
      const hole = holePath([[S, S], ...arcPoints(0.31, 0.5, 0.21, 0.30, -Math.PI / 2, Math.PI / 2).reverse()]);
      sh.holes.push(hole);
      return sh;
    },
  },
  P: {
    w: 0.68,
    build: () => {
      const outer: [number, number][] = [[0, 0], [S, 0], [S, 0.38], ...arcPoints(0.38, 0.69, 0.30, 0.31, -Math.PI / 2, Math.PI / 2), [0, 1]];
      const sh = poly(outer);
      const hole = holePath([[S, 0.56], ...arcPoints(0.36, 0.69, 0.13, 0.13, -Math.PI / 2, Math.PI / 2).reverse()]);
      sh.holes.push(hole);
      return sh;
    },
  },
  R: {
    w: 0.72,
    build: () => {
      const outer: [number, number][] = [
        [0, 0], [S, 0], [S, 0.40], [0.27, 0.40], [0.50, 0], [0.72, 0], [0.47, 0.42],
        ...arcPoints(0.38, 0.70, 0.30, 0.30, -Math.PI / 2 + 0.25, Math.PI / 2), [0, 1],
      ];
      const sh = poly(outer);
      const hole = holePath([[S, 0.57], ...arcPoints(0.36, 0.70, 0.13, 0.13, -Math.PI / 2, Math.PI / 2).reverse()]);
      sh.holes.push(hole);
      return sh;
    },
  },
  S: { w: 0.68, build: buildS },
};

export function create3DTextLine(
  text: string,
  scale: number,
  depth: number,
  materials: THREE.Material[],
  lowPoly = false,
): THREE.Group {
  const group = new THREE.Group();
  const tracking = 0.09;
  const spaceW = 0.32;
  const upper = text.toUpperCase();
  let cursor = 0;

  for (const ch of upper) {
    if (ch === ' ') {
      cursor += spaceW;
      continue;
    }
    const spec = GLYPHS[ch];
    if (!spec) continue;
    const geo = new THREE.ExtrudeGeometry(spec.build(), {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.042,
      bevelSize: 0.026,
      bevelSegments: lowPoly ? 1 : 5,
      curveSegments: lowPoly ? 4 : 16,
    });
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, materials);
    mesh.scale.set(scale, scale, 1);
    mesh.position.set(cursor * scale, -0.5 * scale, -depth * 0.5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    cursor += spec.w + tracking;
  }

  const totalWidth = Math.max(0, cursor - tracking) * scale;
  for (const child of group.children) {
    child.position.x -= totalWidth * 0.5;
  }
  return group;
}
