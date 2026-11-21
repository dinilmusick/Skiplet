import * as THREE from 'three';
import { projectScene } from './canvas3dProjector.ts';
import { rgbStr } from './canvas3dShading.ts';

export class Canvas3DRenderer {
  readonly domElement: HTMLCanvasElement;
  readonly capabilities = { isWebGL2: false, getMaxAnisotropy: () => 1 };
  private ctx: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private dpr = 1;

  constructor(mount?: HTMLElement) {
    this.domElement = document.createElement('canvas');
    const ctx = this.domElement.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    if (mount) {
      this.setSize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight);
      mount.appendChild(this.domElement);
    }
  }

  setPixelRatio(ratio: number) {
    this.dpr = Math.max(1, Math.min(1.5, ratio));
    this.applyDims();
  }

  setSize(w: number, h: number) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.applyDims();
  }

  private applyDims() {
    this.domElement.width = Math.round(this.width * this.dpr);
    this.domElement.height = Math.round(this.height * this.dpr);
    this.domElement.style.width = `${this.width}px`;
    this.domElement.style.height = `${this.height}px`;
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const bg = scene.background instanceof THREE.Color ? scene.background : new THREE.Color(0x000000);
    ctx.fillStyle = rgbStr(bg.r, bg.g, bg.b);
    ctx.fillRect(0, 0, this.width, this.height);

    const items = projectScene(scene, camera, this.width, this.height);
    let lastAlpha = 1;
    let lastOp: GlobalCompositeOperation = 'source-over';
    ctx.lineJoin = 'round';

    for (const item of items) {
      const targetOp: GlobalCompositeOperation = item.kind === 'aura' ? 'lighter' : 'source-over';
      if (targetOp !== lastOp) {
        ctx.globalCompositeOperation = targetOp;
        lastOp = targetOp;
      }
      if (item.alpha !== lastAlpha) {
        ctx.globalAlpha = item.alpha;
        lastAlpha = item.alpha;
      }
      if (item.kind === 'tri') {
        ctx.beginPath();
        ctx.moveTo(item.x0, item.y0);
        ctx.lineTo(item.x1, item.y1);
        ctx.lineTo(item.x2, item.y2);
        ctx.closePath();
        ctx.fillStyle = item.fill;
        ctx.fill();
        ctx.strokeStyle = item.fill;
        ctx.lineWidth = 0.65;
        ctx.stroke();
      } else if (item.kind === 'wire') {
        ctx.beginPath();
        ctx.moveTo(item.x0, item.y0);
        ctx.lineTo(item.x1, item.y1);
        ctx.lineTo(item.x2, item.y2);
        ctx.closePath();
        ctx.strokeStyle = item.stroke;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      } else if (item.kind === 'line') {
        ctx.beginPath();
        ctx.moveTo(item.pts[0], item.pts[1]);
        for (let i = 2; i < item.pts.length; i += 2) ctx.lineTo(item.pts[i], item.pts[i + 1]);
        ctx.strokeStyle = item.stroke;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      } else if (item.kind === 'dot') {
        ctx.fillStyle = item.fill;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.kind === 'aura') {
        if (item.img) {
          const d = item.r * 2;
          ctx.drawImage(item.img, item.x - item.r, item.y - item.r, d, d);
        } else {
          const grad = ctx.createRadialGradient(item.x, item.y, item.r * 0.78, item.x, item.y, item.r * 1.12);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(0.55, item.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.r * 1.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  dispose() {
    this.domElement.width = 0;
    this.domElement.height = 0;
  }
}
