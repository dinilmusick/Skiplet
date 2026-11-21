import { useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { directionVector, swipeDirection } from '../../utils/directionalCarousel';
import type { DirectionalCarousel3DProps, DirectionalCarouselItem } from './types';

/** Full-bleed directional carousel: wheel/swipe navigation with audio feedback. */
export function DirectionalCarousel3D<T extends DirectionalCarouselItem>({
  items, activeIndex, directionDegrees = 90, reducedMotion = false,
  audioEngine, onSelect, renderScene,
}: DirectionalCarousel3DProps<T>) {
  const startRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const wheelRef = useRef({ total: 0, last: 0 });
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const axis = directionVector(directionDegrees);
  const active = Math.max(0, Math.min(items.length - 1, activeIndex));

  const step = (direction: -1 | 1) => {
    const next = active + direction;
    if (next >= 0 && next < items.length) {
      audioEngine?.unlock();
      audioEngine?.playSmallCue('scroll-step');
      onSelect(next);
    }
  };

  const interactive = (target: EventTarget | null) => (
    target instanceof Element && Boolean(target.closest(
      '[data-scene-orbit], [data-annotation-copy], button, a, input, textarea',
    ))
  );

  const hasOpenLandmark = (container: Element, target: EventTarget | null) => Boolean(
    container.querySelector('[data-landmark-open]:not([data-landmark-open="none"])')
    || (target instanceof Element && target.closest('[data-landmark-open]:not([data-landmark-open="none"])')),
  );

  const onDown = (event: PointerEvent<HTMLElement>) => {
    if (hasOpenLandmark(event.currentTarget, event.target) || interactive(event.target)) return;
    startRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onMove = (event: PointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    const projected = dx * axis.x + dy * axis.y;
    setDrag({ x: axis.x * projected * 0.22, y: axis.y * projected * 0.22 });
  };

  const onUp = (event: PointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || event.pointerId !== start.id) return;
    startRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0 });
    const direction = swipeDirection(
      event.clientX - start.x, event.clientY - start.y, directionDegrees,
    );
    if (direction) step(direction);
  };

  const onWheel = (event: WheelEvent<HTMLElement>) => {
    if (hasOpenLandmark(event.currentTarget, event.target)) return;
    if (event.target instanceof Element &&
        event.target.closest('[data-annotation-copy], button, a, input, textarea')) return;
    const now = performance.now();
    const state = wheelRef.current;
    if (now < state.last) return;
    if (now - state.last > 450) state.total = 0;
    state.last = now;
    const dominant = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
      ? event.deltaY : event.deltaX;
    state.total += dominant;
    if (Math.abs(state.total) >= 65) {
      step(state.total > 0 ? 1 : -1);
      state.total = 0;
      state.last = now + 300;
    }
  };

  if (!items.length) return null;
  return (
    <section className="directional-carousel" aria-label="Scenes inside this perspective"
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      onPointerCancel={onUp} onWheel={onWheel}>
      {items.map((item, index) => {
        if (Math.abs(index - active) > 1) return null;
        const relative = index - active;
        const shiftX = relative * axis.x * 100;
        const shiftY = relative * axis.y * 100;
        const transform = 'translate3d(calc(' + shiftX + '% + ' + drag.x +
          'px), calc(' + shiftY + '% + ' + drag.y + 'px), 0)';
        return (
          <div key={item.id} className="directional-carousel-slide"
            aria-hidden={relative !== 0}
            style={{ transform, transition: reducedMotion ? 'none' : undefined,
              pointerEvents: relative === 0 ? 'auto' : 'none' }}>
            {renderScene(item, index, relative === 0)}
          </div>
        );
      })}
    </section>
  );
}
