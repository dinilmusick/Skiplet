import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createStarterScene } from './createStarterScene';

export interface ExhibitionCanvasProps {
  onUnavailable: () => void;
}

export function ExhibitionCanvas({ onUnavailable }: ExhibitionCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
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

    const world = createStarterScene();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frameId = 0;
    let disposed = false;

    const draw = (time: number) => {
      if (disposed) return;
      world.update(reducedMotion.matches ? 0 : time / 1000);
      renderer.render(world.scene, world.camera);
      frameId = reducedMotion.matches ? 0 : requestAnimationFrame(draw);
    };
    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      world.camera.aspect = width / height;
      world.camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (reducedMotion.matches) renderer.render(world.scene, world.camera);
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
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="exhibition-canvas" ref={mountRef} />;
}
