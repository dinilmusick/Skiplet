import type { CarouselElement } from './types';

export function CarouselHud({ elements, activeIndex }: {
  elements: readonly CarouselElement[]; activeIndex: number;
}) {
  const item = elements[activeIndex];
  return (
    <div className={'hud theme-' + (item?.theme ?? 'purple')}>
      <div className="hero-caption" aria-live="polite">
        <p className="caption-eyebrow">{String(activeIndex + 1).padStart(2, '0')}</p>
        <h1>{item?.title}</h1>
      </div>
    </div>
  );
}
