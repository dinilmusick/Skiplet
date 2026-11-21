import type { ReactNode } from 'react';
import type { AudioEngine } from '../../utils/audio';

export interface DirectionalCarouselItem {
  id: string;
  title: string;
}

/** 0° horizontal; 90° vertical; any other angle gives diagonal travel. */
export interface DirectionalCarousel3DProps<T extends DirectionalCarouselItem> {
  items: readonly T[];
  activeIndex: number;
  directionDegrees?: number;
  reducedMotion?: boolean;
  audioEngine?: AudioEngine;
  onSelect: (index: number) => void;
  renderScene: (item: T, index: number, active: boolean) => ReactNode;
}
