/** One orbit shared by every perspective; the camera never orbits to change chapters. */
export const stepFor = (count: number) => (2 * Math.PI) / Math.max(7, count);
export const angleFor = (index: number, count: number) => Math.PI / 2 - index * stepFor(count);
export const rotationFor = (index: number, count: number) => index * stepFor(count);

/** Camera offsets pan to details within an exhibit, without advancing the sphere. */
export function offsetForView(index: number): { x: number; y: number; zoom: number } {
  if (index <= 0) return { x: 0, y: 0, zoom: 0 };
  const side = index % 2 === 1 ? 1 : -1;
  const row = Math.floor((index - 1) / 2) % 3;
  return { x: side * (0.7 + row * 0.2), y: (row - 1) * 0.34, zoom: 0.75 };
}
