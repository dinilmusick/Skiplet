import * as THREE from 'three';

export interface TexCache { data: Uint8ClampedArray; w: number; h: number }
export interface LightRig {
  hemiSky: [number, number, number];
  hemiGround: [number, number, number];
  hemiInt: number;
  dirs: { vx: number; vy: number; vz: number; r: number; g: number; b: number; int: number }[];
  fogDensity: number;
  bg: [number, number, number];
}

const texCache = new WeakMap<object, TexCache | null>();
const _dir = new THREE.Vector3();
const texRgb: [number, number, number] = [1, 1, 1];
const emRgb: [number, number, number] = [1, 1, 1];

export function rgbStr(r: number, g: number, b: number): string {
  const cr = Math.max(0, Math.min(255, (r * 255) | 0));
  const cg = Math.max(0, Math.min(255, (g * 255) | 0));
  const cb = Math.max(0, Math.min(255, (b * 255) | 0));
  return `rgb(${cr},${cg},${cb})`;
}

export function sampleTex(tex: THREE.Texture | null | undefined, u: number, v: number, out: [number, number, number]): boolean {
  if (!tex?.image) return false;
  let cached = texCache.get(tex.image);
  if (cached === undefined) {
    cached = null;
    if (tex.image instanceof HTMLCanvasElement) {
      const ctx = tex.image.getContext('2d');
      if (ctx) {
        const img = ctx.getImageData(0, 0, tex.image.width, tex.image.height);
        cached = { data: img.data, w: img.width, h: img.height };
      }
    }
    texCache.set(tex.image, cached);
  }
  if (!cached) return false;
  const uu = ((u % 1) + 1) % 1;
  const vv = ((v % 1) + 1) % 1;
  const px = Math.min(cached.w - 1, Math.floor(uu * cached.w));
  const py = Math.min(cached.h - 1, Math.floor((tex.flipY ? 1 - vv : vv) * cached.h));
  const i = (py * cached.w + px) * 4;
  out[0] = cached.data[i] / 255;
  out[1] = cached.data[i + 1] / 255;
  out[2] = cached.data[i + 2] / 255;
  return true;
}

export function extractLightRig(scene: THREE.Scene, camera: THREE.PerspectiveCamera): LightRig {
  const bgCol = scene.background instanceof THREE.Color ? scene.background : new THREE.Color(0x000000);
  const rig: LightRig = {
    hemiSky: [0.3, 0.3, 0.4], hemiGround: [0.05, 0.05, 0.08], hemiInt: 0.35,
    dirs: [], fogDensity: scene.fog instanceof THREE.FogExp2 ? scene.fog.density : 0,
    bg: [bgCol.r, bgCol.g, bgCol.b],
  };
  scene.traverse(obj => {
    if (obj instanceof THREE.HemisphereLight) {
      rig.hemiSky = [obj.color.r, obj.color.g, obj.color.b];
      rig.hemiGround = [obj.groundColor.r, obj.groundColor.g, obj.groundColor.b];
      rig.hemiInt = obj.intensity;
    } else if (obj instanceof THREE.DirectionalLight) {
      _dir.copy(obj.position).sub(obj.target.position).normalize().transformDirection(camera.matrixWorldInverse);
      rig.dirs.push({ vx: _dir.x, vy: _dir.y, vz: _dir.z, r: obj.color.r, g: obj.color.g, b: obj.color.b, int: obj.intensity });
    }
  });
  return rig;
}

export function shadeTriangle(
  mat: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial,
  rig: LightRig,
  nx: number, ny: number, nz: number,
  cx: number, cy: number, cz: number,
  cu: number, cv: number, hasUv: boolean,
): string {
  let ar = mat.color.r, ag = mat.color.g, ab = mat.color.b;
  if (hasUv && sampleTex(mat.map, cu, cv, texRgb)) { ar *= texRgb[0]; ag *= texRgb[1]; ab *= texRgb[2]; }

  let fr = ar, fg = ag, fb = ab;
  if (mat instanceof THREE.MeshStandardMaterial) {
    const rough = typeof mat.roughness === 'number' ? mat.roughness : 0.4;
    const metal = typeof mat.metalness === 'number' ? mat.metalness : 0.2;
    const emInt = typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : 0;
    const nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen; ny /= nLen; nz /= nLen;
    const hf = 0.5 + 0.5 * ny;
    let lr = (rig.hemiGround[0] * (1 - hf) + rig.hemiSky[0] * hf) * rig.hemiInt + 0.1;
    let lg = (rig.hemiGround[1] * (1 - hf) + rig.hemiSky[1] * hf) * rig.hemiInt + 0.1;
    let lb = (rig.hemiGround[2] * (1 - hf) + rig.hemiSky[2] * hf) * rig.hemiInt + 0.1;
    let sr = 0, sg = 0, sb = 0;
    const vLen = Math.hypot(-cx, -cy, -cz) || 1;
    const vdx = -cx / vLen, vdy = -cy / vLen, vdz = -cz / vLen;
    const shin = 10 + (1 - rough) * 58;
    for (const d of rig.dirs) {
      const ndotl = Math.max(0, nx * d.vx + ny * d.vy + nz * d.vz);
      lr += d.r * d.int * ndotl; lg += d.g * d.int * ndotl; lb += d.b * d.int * ndotl;
      const hx = d.vx + vdx, hy = d.vy + vdy, hz = d.vz + vdz;
      const hLen = Math.hypot(hx, hy, hz) || 1;
      const sp = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hLen), shin) * (0.28 + 0.72 * metal) * d.int;
      sr += d.r * sp; sg += d.g * sp; sb += d.b * sp;
    }
    fr = ar * (1 - metal * 0.45) * lr + sr * (0.4 + 0.6 * ar);
    fg = ag * (1 - metal * 0.45) * lg + sg * (0.4 + 0.6 * ag);
    fb = ab * (1 - metal * 0.45) * lb + sb * (0.4 + 0.6 * ab);
    if (mat.emissive && emInt > 0) {
      let er = mat.emissive.r * emInt, eg = mat.emissive.g * emInt, eb = mat.emissive.b * emInt;
      if (hasUv && sampleTex(mat.emissiveMap, cu, cv, emRgb)) { er *= emRgb[0]; eg *= emRgb[1]; eb *= emRgb[2]; }
      fr += er; fg += eg; fb += eb;
    }
  }
  if (rig.fogDensity > 0) {
    const fogF = Math.exp(-((rig.fogDensity * -cz) ** 2));
    fr = rig.bg[0] + (fr - rig.bg[0]) * fogF;
    fg = rig.bg[1] + (fg - rig.bg[1]) * fogF;
    fb = rig.bg[2] + (fb - rig.bg[2]) * fogF;
  }
  return rgbStr(fr, fg, fb);
}
