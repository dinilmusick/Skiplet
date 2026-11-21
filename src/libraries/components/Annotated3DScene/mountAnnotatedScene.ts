import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { createStageRenderer, scheduleAfterDraw } from '../Carousel3D/renderer';
import type { AudioEngine, SpatialAudioSpec } from '../../utils/audio';
import {
  DEFAULT_ORBIT_STATE,
  resolveLandmarkCameraTarget,
  stepCameraRig,
  type CameraRigPose,
} from './landmarkCamera';
import { createSceneEffectsRig, type SceneEffectsRig } from './sceneEffects';
import type { SceneAsset, SceneBuildContext, SceneLandmark } from './types';

export interface MountAnnotatedArgs {
  mount: HTMLElement;
  createScene: (ctx: SceneBuildContext) => SceneAsset;
  annotations: readonly SceneLandmark[];
  backgroundColor: string;
  lightingColor: string;
  forceCanvas3D?: boolean;
  spatialAudio?: SpatialAudioSpec;
  gemsRef: MutableRefObject<Map<string, HTMLButtonElement>>;
  orbitRef: MutableRefObject<{ yaw: number; pitch: number; radius: number }>;
  landmarkDragRef: MutableRefObject<{ yaw: number; pitch: number }>;
  rigRef: MutableRefObject<SceneEffectsRig | null>;
  activeRef: MutableRefObject<boolean>;
  motionRef: MutableRefObject<boolean>;
  selectedRef: MutableRefObject<SceneLandmark | null>;
  audioRef: MutableRefObject<AudioEngine | undefined>;
  wakeRef?: MutableRefObject<(() => void) | null>;
  onError: () => void;
}

export function mountAnnotatedScene(args: MountAnnotatedArgs): () => void {
  const {
    mount, createScene, annotations, backgroundColor, lightingColor, forceCanvas3D,
    spatialAudio, gemsRef, orbitRef, landmarkDragRef, rigRef, activeRef, motionRef,
    selectedRef, audioRef, wakeRef, onError,
  } = args;

  let stage: ReturnType<typeof createStageRenderer>;
  try { stage = createStageRenderer(mount, forceCanvas3D); }
  catch { onError(); return () => {}; }

  const { renderer, isWebGl, isSoftwareGl } = stage;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(DEFAULT_ORBIT_STATE.fov, 1, 0.1, 180);
  const effects = createSceneEffectsRig(scene, backgroundColor, lightingColor, !isWebGl);
  rigRef.current = effects;

  const asset = createScene({
    lowPoly: !isWebGl, isSoftwareGl,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
  });
  scene.add(asset.group);

  const spatial = spatialAudio ? audioRef.current?.registerSpatialSource(spatialAudio) ?? null : null;
  const initPose = resolveLandmarkCameraTarget({ ...DEFAULT_ORBIT_STATE, ...orbitRef.current });
  const rigPose: CameraRigPose = {
    position: initPose.position.clone(),
    lookAt: initPose.lookAt.clone(),
    fov: initPose.fov,
  };

  let raf = 0, timer = 0, disposed = false;
  const resize = () => {
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  resize();

  const point = new THREE.Vector3();
  const focusPos = new THREE.Vector3();
  const start = performance.now();
  let prevTime = start;
  let renderedOnce = false;

  const draw = () => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.08, Math.max(0.001, (now - prevTime) / 1000));
    prevTime = now;
    const elapsed = (now - start) / 1000;

    if (!activeRef.current && renderedOnce) {
      timer = window.setTimeout(draw, isSoftwareGl ? 240 : 120);
      return;
    }

    const current = selectedRef.current;
    const env = audioRef.current?.getClipEnvelope();
    const audioAmp = env?.active ? env.amplitude : 0;

    const targetPose = resolveLandmarkCameraTarget(
      { ...orbitRef.current, fov: DEFAULT_ORBIT_STATE.fov },
      current?.cameraMove,
      landmarkDragRef.current,
    );
    stepCameraRig(rigPose, targetPose, dt, current?.cameraMove?.damping ?? 4.6, motionRef.current);

    camera.position.copy(rigPose.position);
    camera.lookAt(rigPose.lookAt);
    if (Math.abs(camera.fov - rigPose.fov) > 0.05) {
      camera.fov = rigPose.fov;
      camera.updateProjectionMatrix();
    }

    if (activeRef.current) asset.update?.(elapsed, motionRef.current, audioAmp);
    effects.update(dt, elapsed, audioAmp, motionRef.current);
    scene.updateMatrixWorld(true);

    if (activeRef.current && spatial) {
      if (current) focusPos.set(...current.position).applyMatrix4(asset.group.matrixWorld);
      else asset.group.getWorldPosition(focusPos);
      spatial.update(camera, focusPos, dt);
    }

    renderer.render(scene, camera);
    renderedOnce = true;

    for (const note of annotations) {
      const gem = gemsRef.current.get(note.id);
      if (!gem) continue;
      point.set(...note.position).applyMatrix4(asset.group.matrixWorld).project(camera);
      gem.style.left = (50 + point.x * 50) + '%';
      gem.style.top = (50 - point.y * 50) + '%';
      gem.style.visibility = point.z < -1 || point.z > 1 ? 'hidden' : 'visible';
    }
    if (isSoftwareGl) scheduleAfterDraw(renderer, draw, id => { timer = id; });
    else raf = requestAnimationFrame(draw);
  };
  draw();
  if (wakeRef) {
    wakeRef.current = () => {
      clearTimeout(timer);
      draw();
    };
  }

  return () => {
    disposed = true;
    if (wakeRef) wakeRef.current = null;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    observer.disconnect();
    rigRef.current = null;
    spatial?.dispose();
    effects.dispose();
    asset.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
