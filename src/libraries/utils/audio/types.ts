import type * as THREE from 'three';

export type AudioCueCategory = 'scroll' | 'click' | 'landmark' | 'ambient' | 'spatial';

export type SmallCueKind =
  | 'scroll-step'
  | 'scroll-tick'
  | 'button-click'
  | 'landmark-enter'
  | 'landmark-exit';

export interface SmallCueSpec {
  category: AudioCueCategory;
  frequency: number;
  endFrequency?: number;
  durationMs: number;
  gain: number;
  waveform?: OscillatorType;
  harmonicRatio?: number;
  filterHz?: number;
}

export interface LongAudioClipSpec {
  id: string;
  durationSeconds: number;
  baseHz: number;
  intervals: readonly number[];
  pulseHz: number;
  gain?: number;
  shimmer?: number;
  loop?: boolean;
}

export interface AmbientLayerSpec {
  baseHz: number;
  fifthHz: number;
  shimmerHz: number;
  gain: number;
}

export interface SpatialAudioSpec {
  id: string;
  baseHz: number;
  harmonicRatio?: number;
  maxDistance?: number;
  refDistance?: number;
  gain?: number;
}

export interface AudioEnvelopeFrame {
  active: boolean;
  clipId: string | null;
  progress: number;
  amplitude: number;
  beatPhase: number;
}

export interface SpatialAudioHandle {
  update: (camera: THREE.Camera, worldPosition: THREE.Vector3, dt?: number) => void;
  getProximity: () => number;
  dispose: () => void;
}

export interface AudioEngine {
  unlock: () => void;
  isMuted: () => boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => boolean;
  subscribe: (listener: (muted: boolean) => void) => () => void;
  playSmallCue: (kind: SmallCueKind, overrides?: Partial<SmallCueSpec>) => void;
  playLongClip: (spec: LongAudioClipSpec) => void;
  stopLongClip: (fadeSeconds?: number) => void;
  getClipEnvelope: () => AudioEnvelopeFrame;
  startAmbient: (spec?: AmbientLayerSpec) => void;
  setAmbientMood: (mood: number) => void;
  stopAmbient: () => void;
  registerSpatialSource: (spec: SpatialAudioSpec) => SpatialAudioHandle;
  dispose: () => void;
}
