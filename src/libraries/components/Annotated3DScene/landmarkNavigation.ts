import type { AudioEngine } from '../../utils/audio';
import type { SceneLandmark } from './types';

/** Computes the next landmark index when cycling forward (+1) or backward (-1). */
export function stepLandmarkIndex(currentIndex: number, total: number, delta: -1 | 1): number {
  if (total <= 0) return -1;
  if (currentIndex < 0) return 0;
  return (currentIndex + delta + total) % total;
}

function canScrollCopy(target: EventTarget | null, deltaY: number): boolean {
  if (!(target instanceof Element) || Math.abs(deltaY) < 0.5) return false;
  const copy = target.closest('[data-annotation-copy] .movement, [data-annotation-copy]') as HTMLElement | null;
  if (!copy || copy.scrollHeight <= copy.clientHeight + 2) return false;
  if (deltaY > 0) return copy.scrollTop + copy.clientHeight < copy.scrollHeight - 2;
  return copy.scrollTop > 2;
}

export function attachLandmarkNavigation(
  container: HTMLElement | null,
  active: boolean,
  selected: SceneLandmark | null,
  annotations: readonly SceneLandmark[],
  audioEngine: AudioEngine | undefined,
  openLandmark: (note: SceneLandmark) => void,
  closeLandmark: () => void,
): (() => void) | void {
  if (!active || !selected || !container) return;

  let wheelTotal = 0;
  let lastWheelTime = 0;

  const stepLandmark = (delta: -1 | 1) => {
    if (annotations.length <= 1) return;
    const curIdx = annotations.findIndex(a => a.id === selected.id);
    const nextIdx = stepLandmarkIndex(curIdx, annotations.length, delta);
    if (nextIdx < 0 || nextIdx === curIdx) return;
    selected.events?.onExit?.();
    audioEngine?.stopLongClip(0.15);
    openLandmark(annotations[nextIdx]);
  };

  const onWheel = (e: WheelEvent) => {
    if (canScrollCopy(e.target, e.deltaY)) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const now = performance.now();
    if (now < lastWheelTime) return;
    if (now - lastWheelTime > 450) wheelTotal = 0;
    lastWheelTime = now;
    const dominant = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    wheelTotal += dominant;
    if (Math.abs(wheelTotal) >= 45) {
      const dir: -1 | 1 = wheelTotal > 0 ? 1 : -1;
      wheelTotal = 0;
      lastWheelTime = now + 220;
      stepLandmark(dir);
    }
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeLandmark();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopImmediatePropagation();
      stepLandmark(1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopImmediatePropagation();
      stepLandmark(-1);
    }
  };

  container.addEventListener('wheel', onWheel as EventListener, { passive: false });
  window.addEventListener('keydown', onKey, true);
  return () => {
    container.removeEventListener('wheel', onWheel as EventListener);
    window.removeEventListener('keydown', onKey, true);
  };
}
