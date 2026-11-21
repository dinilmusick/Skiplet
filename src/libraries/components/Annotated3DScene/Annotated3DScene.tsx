import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import * as THREE from 'three';
import { DEFAULT_ORBIT_STATE } from './landmarkCamera';
import { mountAnnotatedScene } from './mountAnnotatedScene';
import { attachLandmarkNavigation } from './landmarkNavigation';
import type { SceneEffectsRig } from './sceneEffects';
import type { Annotated3DSceneProps, SceneLandmark } from './types';

/** Interactive Three.js scene with landmark camera choreography, spatial audio, and events. */
export function Annotated3DScene({
  createScene, annotations, backgroundColor, lightingColor, active = true, reducedMotion = false,
  forceCanvas3D, audioEngine, spatialAudio, transitionPulse = 0, onLandmarkChange, renderText,
}: Annotated3DSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const gemsRef = useRef(new Map<string, HTMLButtonElement>());
  const orbitRef = useRef({ yaw: DEFAULT_ORBIT_STATE.yaw, pitch: DEFAULT_ORBIT_STATE.pitch, radius: DEFAULT_ORBIT_STATE.radius });
  const landmarkDragRef = useRef({ yaw: 0, pitch: 0 });
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const rigRef = useRef<SceneEffectsRig | null>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const activeRef = useRef(active);
  const motionRef = useRef(reducedMotion);
  const selectedRef = useRef<SceneLandmark | null>(null);
  const audioRef = useRef(audioEngine);
  activeRef.current = active;
  motionRef.current = reducedMotion;
  audioRef.current = audioEngine;

  const selected = annotations.find(entry => entry.id === opened) ?? null;
  selectedRef.current = selected;

  const openLandmark = (note: SceneLandmark) => {
    landmarkDragRef.current = { yaw: 0, pitch: 0 };
    setOpened(note.id);
    const fx = note.events?.audio;
    audioEngine?.unlock();
    audioEngine?.playSmallCue('landmark-enter', fx?.enterSfx);
    if (fx?.clip) audioEngine?.playLongClip(fx.clip);
    note.events?.onEnter?.();
    onLandmarkChange?.(note);
  };

  const closeLandmark = () => {
    const prev = selectedRef.current;
    if (!prev) return;
    setOpened(null);
    audioEngine?.playSmallCue('landmark-exit', prev.events?.audio?.exitSfx);
    audioEngine?.stopLongClip(0.35);
    prev.events?.onExit?.();
    onLandmarkChange?.(null);
  };

  useEffect(() => {
    setOpened(null);
    audioEngine?.stopLongClip(0.25);
    onLandmarkChange?.(null);
  }, [annotations, active]);

  useEffect(() => {
    rigRef.current?.applyLandmark(selected);
    if (active) wakeRef.current?.();
  }, [active, selected]);

  useEffect(() => {
    if (active && transitionPulse > 0) rigRef.current?.triggerTransitionPulse();
  }, [active, transitionPulse]);

  useEffect(() => attachLandmarkNavigation(
    sceneRef.current, active, selected, annotations, audioEngine, openLandmark, closeLandmark,
  ), [active, selected, annotations, audioEngine]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    return mountAnnotatedScene({
      mount, createScene, annotations, backgroundColor, lightingColor, forceCanvas3D,
      spatialAudio, gemsRef, orbitRef, landmarkDragRef, rigRef, activeRef, motionRef,
      selectedRef, audioRef, wakeRef, onError: () => setFailed(true),
    });
  }, [createScene, annotations, backgroundColor, lightingColor, forceCanvas3D, spatialAudio]);

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    pointer.x = event.clientX; pointer.y = event.clientY;
    if (selectedRef.current) {
      landmarkDragRef.current.yaw = THREE.MathUtils.clamp(landmarkDragRef.current.yaw - dx * 0.004, -0.65, 0.65);
      landmarkDragRef.current.pitch = THREE.MathUtils.clamp(landmarkDragRef.current.pitch + dy * 0.004, -0.45, 0.45);
    } else {
      orbitRef.current.yaw -= dx * 0.006;
      orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.005, -1.3, 1.3);
    }
    event.stopPropagation();
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.id !== event.pointerId) return;
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    event.stopPropagation();
  };

  const screenFx = selected?.events?.screenEffect;
  const fxStyle = {
    '--fx-tint': screenFx?.tintColor ?? 'var(--accent)',
    '--fx-glow': String(screenFx?.glowOpacity ?? 0.24),
    '--fx-vignette': String(screenFx?.vignetteOpacity ?? 0.45),
  } as CSSProperties;

  return (
    <div ref={sceneRef} className="annotated-scene" data-landmark-open={selected ? selected.id : 'none'}>
      <div ref={mountRef} className="annotated-scene-canvas" aria-hidden="true" />
      <div className={'scene-atmosphere-fx' + (selected ? ' is-active' : '')} style={fxStyle} aria-hidden="true" />
      <div className="annotated-scene-orbit" data-scene-orbit
        onPointerDown={down} onPointerMove={move} onPointerUp={up}
        onPointerCancel={up} aria-label="Drag to orbit around the artwork" />
      {failed && <div className="annotated-scene-fallback">3D scene unavailable</div>}
      {active && !selected && annotations.map(note =>
        <button key={note.id} type="button" className="annotation-gem" data-landmark-gem={note.id}
          aria-label={note.ariaLabel ?? ('Focus landmark: ' + note.title)}
          ref={node => {
            if (node) gemsRef.current.set(note.id, node);
            else gemsRef.current.delete(note.id);
          }}
          onClick={event => { event.stopPropagation(); openLandmark(note); }} />
      )}
      {active && selected && (
        <>
          <div key={selected.id} className="annotation-copy" data-annotation-copy
            style={{ left: (selected.textPosition?.[0] ?? 54) + '%', top: (selected.textPosition?.[1] ?? 20) + '%' }}
            role="region" aria-label={selected.title}>
            <h2>{selected.title}</h2>
            {renderText ? renderText(selected) : <p>{selected.body}</p>}
          </div>
          <button type="button" className="icon-circle-btn landmark-back-btn" data-landmark-back
            aria-label="Return to default view" onClick={event => { event.stopPropagation(); closeLandmark(); }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 14L4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5A5.5 5.5 0 0 1 14.5 20H11" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
