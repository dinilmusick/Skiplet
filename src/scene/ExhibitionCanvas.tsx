import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createExhibitionScene, type ExhibitionWorld } from './createExhibitionScene';

interface Props {
  perspectiveCount: number;
  perspectiveIndex: number;
  viewIndex: number;
  onUnavailable: () => void;
}

export function ExhibitionCanvas({ perspectiveCount, perspectiveIndex, viewIndex, onUnavailable }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<ExhibitionWorld | null>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const errorCallback = useRef(onUnavailable);
  errorCallback.current = onUnavailable;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      errorCallback.current();
      return;
    }
    const world = createExhibitionScene(perspectiveCount);
    worldRef.current = world;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frameId = 0;
    let disposed = false;

    const redraw = () => {
      if (!reducedMotion.matches) return;
      world.update(0, true);
      renderer.render(world.scene, world.camera);
    };
    redrawRef.current = redraw;
    const draw = (time: number) => {
      if (disposed) return;
      world.update(reducedMotion.matches ? 0 : time / 1000, reducedMotion.matches);
      renderer.render(world.scene, world.camera);
      if (!reducedMotion.matches) frameId = requestAnimationFrame(draw);
    };
    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      world.camera.aspect = width / height;
      world.camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (reducedMotion.matches) redraw();
    };
    const onMotionChange = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(draw);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      errorCallback.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    reducedMotion.addEventListener('change', onMotionChange);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    resize();
    frameId = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      reducedMotion.removeEventListener('change', onMotionChange);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      redrawRef.current = null;
      worldRef.current = null;
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [perspectiveCount]);

  useEffect(() => {
    worldRef.current?.focus(perspectiveIndex, viewIndex);
    redrawRef.current?.();
  }, [perspectiveIndex, viewIndex, perspectiveCount]);

  return <div className="exhibition-canvas" ref={mountRef} />;
}
