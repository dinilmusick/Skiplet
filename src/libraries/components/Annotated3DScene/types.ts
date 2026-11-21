import type { ReactNode } from 'react';
import type * as THREE from 'three';
import type { AudioEngine, LongAudioClipSpec, SmallCueSpec, SpatialAudioSpec } from '../../utils/audio';
import type { LandmarkParticleMode } from '../3d/LandmarkParticles';
import type { LandmarkCameraMove } from './landmarkCamera';

export interface LandmarkLightingEvent {
  ambientColor?: string;
  ambientIntensity?: number;
  keyColor?: string;
  keyIntensity?: number;
  rimColor?: string;
  rimIntensity?: number;
  backgroundColor?: string;
  pulseSpeed?: number;
  pulseDepth?: number;
}

export interface LandmarkParticleEvent {
  mode: LandmarkParticleMode;
  color: string;
}

export interface LandmarkScreenEffect {
  tintColor?: string;
  glowOpacity?: number;
  vignetteOpacity?: number;
}

export interface LandmarkAudioEvent {
  enterSfx?: Partial<SmallCueSpec>;
  exitSfx?: Partial<SmallCueSpec>;
  clip?: LongAudioClipSpec;
}

export interface LandmarkEvents {
  lighting?: LandmarkLightingEvent;
  particles?: LandmarkParticleEvent;
  screenEffect?: LandmarkScreenEffect;
  audio?: LandmarkAudioEvent;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface SceneLandmark {
  id: string;
  title: string;
  body: string;
  /** Accessible label for the landmark trigger when multiple landmarks exist in a view. */
  ariaLabel?: string;
  /** Point in the supplied scene group's local coordinates. */
  position: readonly [number, number, number];
  /** Optional text placement in percentages of the viewport. */
  textPosition?: readonly [number, number];
  /** Camera zoom/pan/orbit target when this landmark is opened. */
  cameraMove?: LandmarkCameraMove;
  /** Linked lighting, particle, screen, and audio automations. */
  events?: LandmarkEvents;
}

/** Backward-compatible alias for SceneLandmark. */
export type SceneAnnotation = SceneLandmark;

export interface SceneBuildContext {
  lowPoly: boolean;
  isSoftwareGl: boolean;
  maxAnisotropy: number;
}

export interface SceneAsset {
  group: THREE.Object3D;
  update?: (elapsed: number, reducedMotion: boolean, audioAmplitude?: number) => void;
  dispose: () => void;
}

export interface Annotated3DSceneProps {
  createScene: (context: SceneBuildContext) => SceneAsset;
  annotations: readonly SceneLandmark[];
  backgroundColor: string;
  lightingColor: string;
  active?: boolean;
  reducedMotion?: boolean;
  forceCanvas3D?: boolean;
  audioEngine?: AudioEngine;
  spatialAudio?: SpatialAudioSpec;
  transitionPulse?: number;
  onLandmarkChange?: (landmark: SceneLandmark | null) => void;
  renderText?: (annotation: SceneLandmark) => ReactNode;
}
