import type * as THREE from 'three';
import type { AudioEngine, SpatialAudioSpec } from '../../utils/audio';

export interface CarouselFrame {
  elapsed: number;
  dt: number;
  angle: number;
  activeIndex: number;
  reducedMotion: boolean;
  scrollImpulse: number;
}
export interface CarouselBuildContext {
  lowPoly: boolean;
  isSoftwareGl: boolean;
  maxAnisotropy: number;
}
export interface CarouselAsset {
  group: THREE.Object3D;
  update?: (frame: CarouselFrame) => void;
  dispose: () => void;
}
export interface CarouselElement {
  id: string;
  title: string;
  subtitle?: string;
  destination: string;
  theme?: string;
  angle?: number;
  altitude?: number;
  spatialAudio?: SpatialAudioSpec;
  createMesh: (context: CarouselBuildContext) => CarouselAsset;
}
export interface CarouselLighting {
  update: (frame: CarouselFrame) => void;
  dispose: () => void;
}
export interface Carousel3DProps {
  elements: readonly CarouselElement[];
  activeIndex: number;
  baseMesh: (context: CarouselBuildContext) => CarouselAsset;
  background: (context: CarouselBuildContext) => CarouselAsset;
  placeElement: (anchor: THREE.Group, item: CarouselElement, index: number) => void;
  createLighting?: (
    scene: THREE.Scene, renderer: THREE.WebGLRenderer | null, isSoftwareGl: boolean
  ) => CarouselLighting;
  configureCamera?: (camera: THREE.PerspectiveCamera, width: number, height: number) => void;
  stepAngle?: number;
  reducedMotion: boolean;
  forceCanvas3D?: boolean;
  audioEngine?: AudioEngine;
  onStep: (direction: -1 | 1) => void;
  onActivate: (item: CarouselElement, index: number) => void;
  onError: () => void;
}
