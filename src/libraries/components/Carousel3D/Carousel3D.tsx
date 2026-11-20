import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCarouselWorld, type CarouselWorld } from './world';
import type { Carousel3DProps } from './types';

export function Carousel3D({ elements, visuals, activeIndex, onActivate, onUnavailable }: Carousel3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<CarouselWorld | null>(null);
  const redraw = useRef<(() => void) | null>(null);
  const callbacks = useRef({ onActivate, onUnavailable });
  callbacks.current = { onActivate, onUnavailable };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { callbacks.current.onUnavailable(); return; }
    const world = createCarouselWorld(elements, visuals);
    worldRef.current = world;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let frameId = 0, disposed = false;
    const render = () => renderer.render(world.scene, world.camera);
    const draw = (time: number) => {
      if (disposed) return;
      world.update(reduced.matches ? 0 : time / 1000, reduced.matches);
      render();
      if (!reduced.matches) frameId = requestAnimationFrame(draw);
    };
    redraw.current = () => { if (reduced.matches) draw(0); };
    const resize = () => {
      const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight);
      world.camera.aspect = w / h; world.camera.updateProjectionMatrix();
      renderer.setSize(w, h, false); render();
    };
    const onMotion = () => { cancelAnimationFrame(frameId); frameId = requestAnimationFrame(draw); };
    const onLost = (event: Event) => { event.preventDefault(); callbacks.current.onUnavailable(); };
    const onDoubleClick = (event: MouseEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height * 2 - 1));
      raycaster.setFromCamera(pointer, world.camera);
      const intersection = raycaster.intersectObjects(world.hitTargets, true)[0];
      let current = intersection?.object;
      while (current && !Number.isInteger(current.userData.carouselIndex)) current = current.parent ?? undefined;
      const index: number | undefined = current?.userData.carouselIndex;
      if (index !== undefined && elements[index]) callbacks.current.onActivate(elements[index]);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    reduced.addEventListener('change', onMotion);
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
    resize(); frameId = requestAnimationFrame(draw);
    return () => {
      disposed = true; cancelAnimationFrame(frameId); observer.disconnect();
      reduced.removeEventListener('change', onMotion);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      redraw.current = null; worldRef.current = null;
      world.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [elements, visuals]);
  useEffect(() => { worldRef.current?.focus(activeIndex); redraw.current?.(); }, [activeIndex]);
  return <div className="exhibition-canvas" ref={mountRef} />;
}
