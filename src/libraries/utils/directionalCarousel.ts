/** A signed 360-degree travel axis, where 0° points right and 90° points down. */
export function directionVector(degrees: number) {
  if (!Number.isFinite(degrees)) throw new Error('Carousel direction must be finite');
  const angle = degrees * Math.PI / 180;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

/** Swiping opposite the travel axis advances to the next entry. */
export function swipeDirection(
  dx: number, dy: number, degrees: number, threshold = 54,
): -1 | 0 | 1 {
  const axis = directionVector(degrees);
  const travel = dx * axis.x + dy * axis.y;
  return Math.abs(travel) < threshold ? 0 : travel < 0 ? 1 : -1;
}
