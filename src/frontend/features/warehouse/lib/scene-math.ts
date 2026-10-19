import { Clamp, HashString } from '@/frontend/lib/utils';
import { WORLD_H, WORLD_W } from './layout';

/** World → screen scale so the whole warehouse height fits the viewport. */
export function SceneScale(viewportH: number): number {
  return Clamp(viewportH / WORLD_H, 0.42, 1);
}

/** Furthest the camera can pan (world units) for a viewport width. */
export function MaxCamera(viewportW: number, scale: number): number {
  return Math.max(0, WORLD_W - viewportW / scale);
}

/** Camera position that centres world x in the viewport. */
export function CameraFor(x: number, viewportW: number, scale: number): number {
  return Clamp(x - viewportW / scale / 2, 0, MaxCamera(viewportW, scale));
}

/** Number of cartons to draw for a bin: 0 when empty, 1–6 scaled to cover vs reorder level. */
export function CartonCount(onHand: number, reorderLevel: number): number {
  if (onHand <= 0) return 0;
  return Clamp(Math.ceil((6 * onHand) / Math.max(1, reorderLevel * 3)), 1, 6);
}

/** Deterministic small offsets so stacks look hand-placed. */
export function CartonJitter(sku: string, i: number): { dx: number; rot: number } {
  const h = HashString(`${sku}:${i}`);
  return { dx: ((h % 5) - 2) * 0.8, rot: (((h >> 3) % 5) - 2) * 0.5 };
}
