import type * as THREE from 'three';

export interface CarouselAsset {
  group: THREE.Group;
  update?: (seconds: number, active: boolean) => void;
  dispose: () => void;
}
export interface CarouselElement {
  id: string;
  title: string;
  subtitle?: string;
  destination: string;
  createMesh: () => CarouselAsset;
}
export interface CarouselVisuals {
  createBase: () => CarouselAsset;
  createBackground: (scene: THREE.Scene) => void;
  createLighting: () => THREE.Object3D;
}
export interface Carousel3DProps {
  elements: readonly CarouselElement[];
  visuals: CarouselVisuals;
  activeIndex: number;
  onActivate: (element: CarouselElement) => void;
  onUnavailable: () => void;
}
