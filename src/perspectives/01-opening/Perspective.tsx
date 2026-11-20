import type { ComponentType } from 'react';
import { PerspectiveStage } from '../PerspectiveStage';
import type { PerspectiveProps, ViewProps } from '../types';

const modules = import.meta.glob<{ default: ComponentType<ViewProps> }>('./views/*.tsx', { eager: true });
const views: Record<string, ComponentType<ViewProps>> = Object.fromEntries(
  Object.entries(modules).map(([path, entry]) => [path.split('/').pop()!.replace(/\.tsx$/, ''), entry.default]),
);
export default function Perspective(props: PerspectiveProps) {
  return <PerspectiveStage {...props} viewComponents={views} />;
}
