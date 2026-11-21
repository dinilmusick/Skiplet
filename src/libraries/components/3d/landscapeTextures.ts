import * as THREE from 'three';
import { PALETTE } from '../../utils/palette';

export function buildLandscapeTextures(maxAnisotropy: number) {
  const dim = 1024;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = dim;
  colorCanvas.height = dim;
  const cCtx = colorCanvas.getContext('2d')!;

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = dim;
  glowCanvas.height = dim;
  const gCtx = glowCanvas.getContext('2d')!;

  cCtx.fillStyle = PALETTE.base;
  cCtx.fillRect(0, 0, dim, dim);
  gCtx.fillStyle = PALETTE.base;
  gCtx.fillRect(0, 0, dim, dim);

  const radial = cCtx.createRadialGradient(dim * 0.52, dim * 0.42, 40, dim * 0.5, dim * 0.5, dim * 0.62);
  radial.addColorStop(0, PALETTE.surface);
  radial.addColorStop(1, PALETTE.base);
  cCtx.fillStyle = radial;
  cCtx.fillRect(0, 0, dim, dim);

  const drawGrid = (ctx: CanvasRenderingContext2D, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PALETTE.highlight;
    ctx.lineWidth = 2;
    const cells = 8;
    for (let i = 1; i < cells; i++) {
      const p = (i / cells) * dim;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, dim); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(dim, p); ctx.stroke();
    }
    ctx.globalAlpha = Math.min(1, alpha * 2.2);
    ctx.strokeStyle = PALETTE.amberBright;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, dim - 6, dim - 6);
    ctx.restore();
  };

  drawGrid(cCtx, 0.34);
  drawGrid(gCtx, 0.28);

  const drawTokens = (ctx: CanvasRenderingContext2D, shadowBlur: number) => {
    ctx.save();
    ctx.fillStyle = PALETTE.amberBright;
    ctx.shadowColor = PALETTE.highlight;
    ctx.shadowBlur = shadowBlur;

    ctx.beginPath();
    ctx.arc(dim * 0.5, dim * 0.29, dim * 0.118, 0, Math.PI * 2);
    ctx.fill();

    const sq = dim * 0.22;
    ctx.fillRect(dim * 0.27 - sq * 0.5, dim * 0.72 - sq * 0.5, sq, sq);

    const tx = dim * 0.73;
    const ty = dim * 0.73;
    const tw = dim * 0.132;
    ctx.beginPath();
    ctx.moveTo(tx, ty - tw * 1.05);
    ctx.lineTo(tx + tw, ty + tw * 0.86);
    ctx.lineTo(tx - tw, ty + tw * 0.86);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawTokens(cCtx, 28);
  drawTokens(gCtx, 42);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const emissiveMap = new THREE.CanvasTexture(glowCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.anisotropy = maxAnisotropy;

  return { map, emissiveMap };
}

export function buildUnderglowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(256, 256, 24, 256, 256, 248);
  grad.addColorStop(0, PALETTE.highlight);
  grad.addColorStop(0.45, PALETTE.amberDeep);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
