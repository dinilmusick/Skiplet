/** Carousel indexing without dependencies on any particular renderer. */
export interface CarouselIndexedItem { id: string; angle?: number }
export function angleFor(items: readonly CarouselIndexedItem[], index: number, step = 0.44) {
  if (index < 0 || index >= items.length) throw new RangeError('Carousel index out of bounds');
  return items[index].angle ?? index * step;
}
export function validateCarousel(items: readonly CarouselIndexedItem[]) {
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id.trim() || ids.has(item.id)) throw new Error('Carousel IDs must be unique and non-empty');
    if (item.angle !== undefined && !Number.isFinite(item.angle)) throw new Error('Invalid carousel angle');
    ids.add(item.id);
  }
  return items.length;
}
