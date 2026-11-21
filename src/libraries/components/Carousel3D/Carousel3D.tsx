import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createStageRenderer, scheduleAfterDraw } from './renderer';
import { applySphereCamera, focusCameraView } from './camera';
import { attachStageInput } from './input';
import { attachStagePick } from './pick';
import type { Carousel3DProps, CarouselFrame } from './types';
import { angleFor, validateCarousel } from '../../utils/carouselMath';

/** Rotating 3D menu with injected world, background, meshes, spatial audio, and destinations. */
export function Carousel3D(props: Carousel3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(props);
  stateRef.current = props;

  useEffect(() => {
    const mount = mountRef.current;
    const { elements, baseMesh, background, placeElement, createLighting, configureCamera } = props;
    if (!mount || !elements.length) return;
    validateCarousel(elements);
    let stage: ReturnType<typeof createStageRenderer>;
    try { stage = createStageRenderer(mount, props.forceCanvas3D); }
    catch { stateRef.current.onError(); return; }
    const { renderer, isWebGl, isWebGl2, isSoftwareGl } = stage;
    const size = () => [mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight];
    const [w, h] = size();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 220);
    const configure = (width: number, height: number) =>
      (configureCamera ?? applySphereCamera)(camera, width, height);
    configure(w, h);
    const context = {
      lowPoly: !isWebGl, isSoftwareGl,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    };
    const core = baseMesh(context);
    const sky = background(context);
    const exhibits = elements.map((item, i) => {
      const anchor = new THREE.Group();
      anchor.userData.stationIndex = i;
      placeElement(anchor, item, i);
      const art = item.createMesh(context);
      anchor.add(art.group);
      core.group.add(anchor);
      const spatial = item.spatialAudio
        ? stateRef.current.audioEngine?.registerSpatialSource(item.spatialAudio) ?? null
        : null;
      return { anchor, art, spatial };
    });
    scene.add(core.group, sky.group);
    const webGlRenderer = renderer instanceof THREE.WebGLRenderer ? renderer : null;
    const lighting = createLighting?.(scene, webGlRenderer, isSoftwareGl);
    let composer: EffectComposer | null = null;
    let bloom: UnrealBloomPass | null = null;
    if (webGlRenderer && isWebGl2 && !isSoftwareGl) {
      try {
        composer = new EffectComposer(webGlRenderer);
        composer.addPass(new RenderPass(scene, camera));
        bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.58, 0.56, 0.58);
        composer.addPass(bloom);
        webGlRenderer.compile(scene, camera);
      } catch { composer?.dispose(); composer = null; bloom = null; }
    }
    const step = props.stepAngle ?? 0.44;
    let currentAngle = angleFor(elements, stateRef.current.activeIndex, step);
    let lastActiveIndex = stateRef.current.activeIndex;
    let scrollImpulse = 0;
    core.group.rotation.z = currentAngle;

    const input = attachStageInput(
      renderer.domElement,
      dir => {
        scrollImpulse = 1;
        stateRef.current.audioEngine?.unlock();
        stateRef.current.audioEngine?.playSmallCue('scroll-step');
        stateRef.current.onStep(dir);
      },
      dir => {
        const next = stateRef.current.activeIndex + dir;
        return next >= 0 && next < elements.length;
      },
      step,
    );
    const releasePick = attachStagePick(
      renderer.domElement, camera, exhibits.map(e => e.anchor),
      () => stateRef.current.activeIndex,
      i => {
        const item = stateRef.current.elements[i];
        if (item) {
          stateRef.current.audioEngine?.unlock();
          stateRef.current.audioEngine?.playSmallCue('landmark-enter');
          stateRef.current.onActivate(item, i);
        }
      },
    );
    const lost = (event: Event) => { event.preventDefault(); stateRef.current.onError(); };
    if (isWebGl) renderer.domElement.addEventListener('webglcontextlost', lost);
    const resize = () => {
      const [nw, nh] = size();
      camera.aspect = nw / nh; configure(nw, nh);
      renderer.setSize(nw, nh); composer?.setSize(nw, nh); bloom?.resolution.set(nw, nh);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    const startedAt = performance.now();
    let previousFrameAt = startedAt;
    const _worldPos = new THREE.Vector3();
    let raf = 0, timer = 0, disposed = false;

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(Math.max(0, (now - previousFrameAt) / 1000), 0.08);
      previousFrameAt = now;
      const elapsed = (now - startedAt) / 1000;
      const state = stateRef.current;
      if (state.activeIndex !== lastActiveIndex) {
        lastActiveIndex = state.activeIndex;
        scrollImpulse = 1;
      }
      const offset = input.getOffsetAngle(dt);
      scrollImpulse = Math.max(scrollImpulse * Math.exp(-dt * 4.5), Math.min(1, Math.abs(offset) * 3.5));
      const target = angleFor(elements, state.activeIndex, step) + offset;
      currentAngle = state.reducedMotion ? angleFor(elements, state.activeIndex, step)
        : THREE.MathUtils.damp(currentAngle, target, 5.2, dt);
      core.group.rotation.z = currentAngle;
      const frame: CarouselFrame = {
        elapsed, dt, angle: currentAngle,
        activeIndex: state.activeIndex, reducedMotion: state.reducedMotion, scrollImpulse,
      };
      sky.update?.(frame); core.update?.(frame);
      exhibits.forEach(e => e.art.update?.(frame));
      lighting?.update(frame);
      focusCameraView(camera, 0, dt, elapsed, state.reducedMotion);
      scene.updateMatrixWorld(true);
      exhibits.forEach(e => {
        if (!e.spatial) return;
        e.anchor.getWorldPosition(_worldPos);
        e.spatial.update(camera, _worldPos, dt);
      });
      if (composer) composer.render(); else renderer.render(scene, camera);
      if (isSoftwareGl) scheduleAfterDraw(renderer, tick, id => { timer = id; });
      else raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      disposed = true; cancelAnimationFrame(raf); clearTimeout(timer);
      observer.disconnect(); input.dispose(); releasePick();
      if (isWebGl) renderer.domElement.removeEventListener('webglcontextlost', lost);
      exhibits.forEach(e => { e.spatial?.dispose(); e.art.dispose(); });
      lighting?.dispose(); core.dispose(); sky.dispose();
      composer?.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [props.elements, props.baseMesh, props.background, props.placeElement,
      props.createLighting, props.configureCamera, props.forceCanvas3D, props.stepAngle]);
  return <div ref={mountRef} className="stage-canvas" aria-hidden="true" />;
}
