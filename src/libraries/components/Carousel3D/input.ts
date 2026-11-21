
export interface StageInputHandle {
  getOffsetAngle: (dt: number) => number;
  dispose: () => void;
}

export function attachStageInput(
  dom: HTMLElement,
  onSwipe: (dir: -1 | 1) => void,
  canStep: (dir: -1 | 1) => boolean,
  stepAngle = 0.44,
): StageInputHandle {
  let dragging = false;
  let lastX = 0;
  let totalDx = 0;
  let offsetAngle = 0;
  let lastInputAt = 0;
  const halfStep = stepAngle * 0.5;

  const advanceIfCrossed = () => {
    if (offsetAngle >= halfStep && canStep(1)) {
      offsetAngle = Math.max(-halfStep * 0.9, offsetAngle - stepAngle);
      onSwipe(1);
    } else if (offsetAngle <= -halfStep && canStep(-1)) {
      offsetAngle = Math.min(halfStep * 0.9, offsetAngle + stepAngle);
      onSwipe(-1);
    }
    const maxEdge = stepAngle * 0.28;
    if ((offsetAngle > 0 && !canStep(1)) || (offsetAngle < 0 && !canStep(-1))) {
      offsetAngle = Math.max(-maxEdge, Math.min(maxEdge, offsetAngle));
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    totalDx = 0;
    lastInputAt = performance.now();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    totalDx += dx;
    offsetAngle += -dx * 0.003;
    lastInputAt = performance.now();
    advanceIfCrossed();
  };

  const onPointerUp = () => {
    if (!dragging) return;
    dragging = false;
    lastInputAt = performance.now();
    if (Math.abs(totalDx) > 42 && Math.abs(offsetAngle) < halfStep) {
      const dir: -1 | 1 = totalDx < 0 ? 1 : -1;
      if (canStep(dir)) {
        offsetAngle -= dir * stepAngle;
        onSwipe(dir);
      }
    }
  };

  const onWheel = (e: WheelEvent) => {
    const target = e.target as Element | null;
    if (target?.closest('[data-carousel-ignore-wheel]')) return;
    e.preventDefault();
    const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const step = Math.max(-0.14, Math.min(0.14, raw * 0.0022));
    offsetAngle += step;
    lastInputAt = performance.now();
    advanceIfCrossed();
  };

  const wheelTarget: EventTarget = dom.parentElement ?? dom;
  dom.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  wheelTarget.addEventListener('wheel', onWheel as EventListener, { passive: false });

  return {
    getOffsetAngle: (dt: number) => {
      if (!dragging && performance.now() - lastInputAt > 110) {
        offsetAngle *= Math.exp(-dt * 8.5);
        if (Math.abs(offsetAngle) < 0.0005) offsetAngle = 0;
      }
      return offsetAngle;
    },
    dispose: () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      wheelTarget.removeEventListener('wheel', onWheel as EventListener);
    },
  };
}
