import { useEffect, useRef } from 'react';
import type { CarouselElement } from './types';
import { angleFor } from '../../utils/carouselMath';

interface Palette {
  base: string; surface: string; text: string; highlight: string;
  amberDeep: string; amberBright: string; purpleDeep: string; purple: string;
}
interface Props {
  elements: readonly CarouselElement[];
  palette: Palette;
  activeIndex: number;
  stepAngle?: number;
  onSelect: (index: number) => void;
  onActivate: (index: number) => void;
}
export function Canvas2DFallback({ elements, palette: c, activeIndex, stepAngle = 0.44, onSelect, onActivate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !elements.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animation = 0, w = 1, h = 1;
    const resize = () => {
      w = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      h = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    let offset = -angleFor(elements, Math.min(activeIndex, elements.length - 1), stepAngle);
    const start = performance.now();
    const positions = () => {
      const cx = w / 2, cy = h * 0.65, radius = Math.min(w, h) * 0.42;
      return elements.map((_, i) => {
        const a = angleFor(elements, i, stepAngle) + offset - Math.PI / 2;
        return { x: cx + Math.cos(a) * radius * 0.85, y: cy + Math.sin(a) * radius * 0.85 * 0.45 };
      });
    };
    const render = (now: number) => {
      const elapsed = (now - start) * 0.001;
      const target = -angleFor(elements, Math.min(activeIndex, elements.length - 1), stepAngle);
      offset += (target - offset) * 0.08;
      ctx.fillStyle = c.base; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.65, radius = Math.min(w, h) * 0.42;
      ctx.save(); ctx.translate(cx, cy);
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath(); ctx.arc(0, 0, radius * i * 0.38, 0, Math.PI * 2);
        ctx.strokeStyle = i === 1 ? c.amberDeep : i === 2 ? c.purpleDeep : c.purple;
        ctx.lineWidth = 1.5; ctx.stroke();
      }
      const pts = positions();
      elements.forEach((element, i) => {
        const x = pts[i].x - cx, y = pts[i].y - cy;
        const active = i === activeIndex;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x, y);
        ctx.strokeStyle = active ? c.highlight : c.amberDeep;
        ctx.lineWidth = active ? 2 : 1; ctx.stroke();
        if (active) {
          const glow = ctx.createRadialGradient(x, y, 2, x, y, 35);
          glow.addColorStop(0, c.amberBright); glow.addColorStop(1, c.base);
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 35, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x, y, active ? 14 : 8, 0, Math.PI * 2);
        ctx.fillStyle = active ? c.amberBright : c.surface;
        ctx.strokeStyle = active ? c.text : c.amberDeep;
        ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
        ctx.font = (active ? '600 13px' : '400 11px') + ' system-ui, sans-serif';
        ctx.fillStyle = active ? c.text : c.highlight; ctx.textAlign = 'center';
        ctx.fillText(String(i + 1).padStart(2, '0') + '. ' + element.title.slice(0, 24),
          x, y + (y < 0 ? -22 : 28));
      });
      ctx.beginPath(); ctx.arc(0, 0, 24 + Math.sin(elapsed * 2) * 2, 0, Math.PI * 2);
      ctx.fillStyle = c.purpleDeep; ctx.fill(); ctx.strokeStyle = c.amberBright;
      ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      animation = requestAnimationFrame(render);
    };
    animation = requestAnimationFrame(render);
    const hit = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      return positions().findIndex(p => Math.hypot(x - rect.left - p.x, y - rect.top - p.y) < 32);
    };
    const click = (e: MouseEvent) => { const i = hit(e.clientX, e.clientY); if (i >= 0) onSelect(i); };
    const dbl = (e: MouseEvent) => { const i = hit(e.clientX, e.clientY); if (i >= 0) onActivate(i); };
    canvas.addEventListener('click', click); canvas.addEventListener('dblclick', dbl);
    return () => {
      cancelAnimationFrame(animation); observer.disconnect();
      canvas.removeEventListener('click', click); canvas.removeEventListener('dblclick', dbl);
    };
  }, [elements, c, activeIndex, stepAngle, onSelect, onActivate]);
  return <div className="canvas-fallback-container" style={{
    width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: c.base,
  }}><canvas ref={canvasRef} style={{
    display: 'block', width: '100%', height: '100%', cursor: 'pointer',
  }} /></div>;
}
