import * as THREE from 'three';
import { extractLightRig, rgbStr, shadeTriangle } from './canvas3dShading.ts';

export type DrawItem =
  | { kind: 'tri'; z: number; x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; fill: string; alpha: number }
  | { kind: 'wire'; z: number; x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; stroke: string; alpha: number }
  | { kind: 'line'; z: number; pts: number[]; stroke: string; alpha: number }
  | { kind: 'dot'; z: number; x: number; y: number; r: number; fill: string; alpha: number }
  | { kind: 'aura'; z: number; x: number; y: number; r: number; img: CanvasImageSource | null; color: string; alpha: number };

const _mv = new THREE.Matrix4();
const _c = new THREE.Vector3();
let viewBuf = new Float32Array(4096 * 3);
let scrBuf = new Float32Array(4096 * 3);

function ensureBufs(count: number) {
  if (count * 3 > viewBuf.length) {
    viewBuf = new Float32Array(count * 3);
    scrBuf = new Float32Array(count * 3);
  }
}

export function projectScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera, w: number, h: number): DrawItem[] {
  const rig = extractLightRig(scene, camera);
  const out: DrawItem[] = [];
  const pe = camera.projectionMatrix.elements;
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));

  scene.traverse(obj => {
    if (!obj.visible) return;
    _mv.multiplyMatrices(camera.matrixWorldInverse, obj.matrixWorld);
    const mve = _mv.elements;

    if (obj instanceof THREE.Points) {
      const pos = obj.geometry.getAttribute('position');
      const mat = obj.material as THREE.PointsMaterial;
      if (!pos || !mat) return;
      const fill = rgbStr(mat.color.r, mat.color.g, mat.color.b);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const vx = mve[0] * x + mve[4] * y + mve[8] * z + mve[12];
        const vy = mve[1] * x + mve[5] * y + mve[9] * z + mve[13];
        const vz = mve[2] * x + mve[6] * y + mve[10] * z + mve[14];
        if (vz > -camera.near || vz < -camera.far) continue;
        const cw = pe[3] * vx + pe[7] * vy + pe[11] * vz + pe[15];
        if (cw <= 0.05) continue;
        const sx = ((pe[0] * vx + pe[4] * vy + pe[8] * vz + pe[12]) / cw * 0.5 + 0.5) * w;
        const sy = (-(pe[1] * vx + pe[5] * vy + pe[9] * vz + pe[13]) / cw * 0.5 + 0.5) * h;
        if (sx < -4 || sx > w + 4 || sy < -4 || sy > h + 4) continue;
        const rawR = (mat.size * h) / (-vz * 2 * tanHalf);
        const nearFade = THREE.MathUtils.clamp((-vz - 0.5) / 1.1, 0, 1);
        const alpha = mat.opacity * nearFade;
        if (alpha <= 0.02) continue;
        out.push({ kind: 'dot', z: vz, x: sx, y: sy, r: Math.min(6.5, Math.max(0.8, rawR)), fill, alpha });
      }
      return;
    }

    if (obj instanceof THREE.Line) {
      const pos = obj.geometry.getAttribute('position');
      const mat = obj.material as THREE.LineBasicMaterial;
      if (!pos || !mat) return;
      const pts: number[] = [];
      let zSum = 0;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const vx = mve[0] * x + mve[4] * y + mve[8] * z + mve[12];
        const vy = mve[1] * x + mve[5] * y + mve[9] * z + mve[13];
        const vz = mve[2] * x + mve[6] * y + mve[10] * z + mve[14];
        const cw = pe[3] * vx + pe[7] * vy + pe[11] * vz + pe[15];
        if (cw <= 0.05) continue;
        pts.push(((pe[0] * vx + pe[4] * vy + pe[8] * vz + pe[12]) / cw * 0.5 + 0.5) * w);
        pts.push((-(pe[1] * vx + pe[5] * vy + pe[9] * vz + pe[13]) / cw * 0.5 + 0.5) * h);
        zSum += vz;
      }
      if (pts.length >= 4) {
        out.push({ kind: 'line', z: zSum / (pts.length * 0.5), pts, stroke: rgbStr(mat.color.r, mat.color.g, mat.color.b), alpha: mat.opacity });
      }
      return;
    }

    if (!(obj instanceof THREE.Mesh)) return;
    const geo = obj.geometry;
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    const bs = geo.boundingSphere;
    if (bs) {
      _c.copy(bs.center).applyMatrix4(_mv);
      const rad = bs.radius * Math.max(Math.hypot(mve[0], mve[1], mve[2]), Math.hypot(mve[4], mve[5], mve[6]), Math.hypot(mve[8], mve[9], mve[10]));
      if (_c.z - rad > -camera.near || _c.z + rad < -camera.far) return;
      const limY = Math.max(2, -_c.z * tanHalf + rad * 1.45);
      if (Math.abs(_c.y) > limY || Math.abs(_c.x) > limY * camera.aspect + rad * 1.45) return;
    }

    const firstMat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (firstMat instanceof THREE.ShaderMaterial && firstMat.uniforms?.uGlowColor && bs) {
      const col = firstMat.uniforms.uGlowColor.value as THREE.Color;
      const cw = pe[3] * _c.x + pe[7] * _c.y + pe[11] * _c.z + pe[15];
      if (cw > 0.1) {
        const px = ((pe[0] * _c.x + pe[4] * _c.y + pe[8] * _c.z + pe[12]) / cw * 0.5 + 0.5) * w;
        const py = (-(pe[1] * _c.x + pe[5] * _c.y + pe[9] * _c.z + pe[13]) / cw * 0.5 + 0.5) * h;
        out.push({ kind: 'aura', z: _c.z - bs.radius * 0.85, x: px, y: py, r: (bs.radius * h) / (-_c.z * 2 * tanHalf), img: null, color: rgbStr(col.r, col.g, col.b), alpha: 0.45 });
      }
      return;
    }
    if (firstMat && 'blending' in firstMat && firstMat.blending === THREE.AdditiveBlending && 'map' in firstMat && firstMat.map?.image && bs) {
      const cw = pe[3] * _c.x + pe[7] * _c.y + pe[11] * _c.z + pe[15];
      if (cw > 0.1) {
        const px = ((pe[0] * _c.x + pe[4] * _c.y + pe[8] * _c.z + pe[12]) / cw * 0.5 + 0.5) * w;
        const py = (-(pe[1] * _c.x + pe[5] * _c.y + pe[9] * _c.z + pe[13]) / cw * 0.5 + 0.5) * h;
        out.push({ kind: 'aura', z: _c.z, x: px, y: py, r: (bs.radius * 0.8 * h) / (-_c.z * 2 * tanHalf), img: firstMat.map.image as CanvasImageSource, color: '', alpha: firstMat.opacity });
      }
      return;
    }

    const pos = geo.getAttribute('position');
    if (!pos) return;
    ensureBufs(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const vx = mve[0] * x + mve[4] * y + mve[8] * z + mve[12];
      const vy = mve[1] * x + mve[5] * y + mve[9] * z + mve[13];
      const vz = mve[2] * x + mve[6] * y + mve[10] * z + mve[14];
      const b = i * 3;
      viewBuf[b] = vx; viewBuf[b + 1] = vy; viewBuf[b + 2] = vz;
      const cw = pe[3] * vx + pe[7] * vy + pe[11] * vz + pe[15];
      if (cw > 0.05) {
        scrBuf[b] = ((pe[0] * vx + pe[4] * vy + pe[8] * vz + pe[12]) / cw * 0.5 + 0.5) * w;
        scrBuf[b + 1] = (-(pe[1] * vx + pe[5] * vy + pe[9] * vz + pe[13]) / cw * 0.5 + 0.5) * h;
      }
      scrBuf[b + 2] = cw;
    }

    const uv = geo.getAttribute('uv');
    const idx = geo.getIndex();
    const total = idx ? idx.count : pos.count;
    const groups = geo.groups.length ? geo.groups : [{ start: 0, count: total, materialIndex: 0 }];

    for (const grp of groups) {
      const mat = (Array.isArray(obj.material) ? obj.material[grp.materialIndex ?? 0] : obj.material) as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
      if (!mat || !mat.visible || !('color' in mat) || !mat.color) continue;
      const isWire = Boolean(mat.wireframe);
      const end = Math.min(total, grp.start + grp.count);
      for (let t = grp.start; t + 2 < end; t += 3) {
        const i0 = idx ? idx.getX(t) : t, i1 = idx ? idx.getX(t + 1) : t + 1, i2 = idx ? idx.getX(t + 2) : t + 2;
        const b0 = i0 * 3, b1 = i1 * 3, b2 = i2 * 3;
        if (scrBuf[b0 + 2] <= 0.08 || scrBuf[b1 + 2] <= 0.08 || scrBuf[b2 + 2] <= 0.08) continue;
        const x0 = scrBuf[b0], y0 = scrBuf[b0 + 1], x1 = scrBuf[b1], y1 = scrBuf[b1 + 1], x2 = scrBuf[b2], y2 = scrBuf[b2 + 1];
        if ((x0 < -40 && x1 < -40 && x2 < -40) || (x0 > w + 40 && x1 > w + 40 && x2 > w + 40)) continue;
        if ((y0 < -40 && y1 < -40 && y2 < -40) || (y0 > h + 40 && y1 > h + 40 && y2 > h + 40)) continue;

        const e1x = viewBuf[b1] - viewBuf[b0], e1y = viewBuf[b1 + 1] - viewBuf[b0 + 1], e1z = viewBuf[b1 + 2] - viewBuf[b0 + 2];
        const e2x = viewBuf[b2] - viewBuf[b0], e2y = viewBuf[b2 + 1] - viewBuf[b0 + 1], e2z = viewBuf[b2 + 2] - viewBuf[b0 + 2];
        let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        if (mat.side === THREE.FrontSide && nz <= 0) continue;
        if (mat.side === THREE.BackSide) { if (nz >= 0) continue; nx = -nx; ny = -ny; nz = -nz; }
        else if (mat.side === THREE.DoubleSide && nz < 0) { nx = -nx; ny = -ny; nz = -nz; }

        const cz = (viewBuf[b0 + 2] + viewBuf[b1 + 2] + viewBuf[b2 + 2]) / 3;
        if (isWire) {
          out.push({ kind: 'wire', z: cz, x0, y0, x1, y1, x2, y2, stroke: rgbStr(mat.color.r, mat.color.g, mat.color.b), alpha: mat.opacity });
          continue;
        }
        const cx = (viewBuf[b0] + viewBuf[b1] + viewBuf[b2]) / 3;
        const cy = (viewBuf[b0 + 1] + viewBuf[b1 + 1] + viewBuf[b2 + 1]) / 3;
        const hasUv = Boolean(uv && (mat.map || ('emissiveMap' in mat && mat.emissiveMap)));
        const cu = hasUv ? (uv.getX(i0) + uv.getX(i1) + uv.getX(i2)) / 3 : 0;
        const cv = hasUv ? (uv.getY(i0) + uv.getY(i1) + uv.getY(i2)) / 3 : 0;
        const fill = shadeTriangle(mat, rig, nx, ny, nz, cx, cy, cz, cu, cv, hasUv);
        out.push({ kind: 'tri', z: cz, x0, y0, x1, y1, x2, y2, fill, alpha: mat.opacity });
      }
    }
  });
  out.sort((a, b) => a.z - b.z);
  return out;
}
