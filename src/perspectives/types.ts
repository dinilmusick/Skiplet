import type { ComponentType } from 'react';
import type { perspectives } from './content';

export type PerspectiveData = (typeof perspectives)[number];
export type ViewData = PerspectiveData['views'][number];
export interface ViewProps {
  view: ViewData;
  onChapterLink: (file: string) => boolean;
}
export interface PerspectiveProps {
  perspective: PerspectiveData;
  activeView: number;
  onSelectView: (index: number) => void;
  onChapterLink: (file: string) => boolean;
  onBack: () => void;
}
export type PerspectiveComponent = ComponentType<PerspectiveProps>;
