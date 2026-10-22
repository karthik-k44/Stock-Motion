import type { BoxType, DirType, IsoGroupType, XZType } from '../../types';
import { ColorOf, Shade } from './palette';

const COS30 = 0.866;

/** Quarter turns that take a +x facing model to `dir`. */
export const TURNS_OF: Record<DirType, number> = { 'x+': 0, 'z+': 1, 'x-': 2, 'z-': 3 };

/** A box turned by quarter turns about the origin: (x, z) → (−z, x) per turn. */
export const RotateBoxAtOrigin = (b: BoxType, turns: number): BoxType => {
  let r = b;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) r = { ...r, x: -(r.z + r.d), z: r.x, w: r.d, d: r.w };
  return r;
};

/** The scene turned by quarter turns about its own footprint, so it stays at 0..size. */
export const RotateBox = (b: BoxType, turns: number, size: XZType): BoxType => {
  let r = b;
  let [sx, sz] = size;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) {
    r = { ...r, x: sz - (r.z + r.d), z: r.x, w: r.d, d: r.w };
    [sx, sz] = [sz, sx];
  }
  return r;
};

export const RotatePoint = ([x, z]: XZType, turns: number, size: XZType): XZType => {
  let p: XZType = [x, z];
  let [sx, sz] = size;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) {
    p = [sz - p[1], p[0]];
    [sx, sz] = [sz, sx];
  }
  return p;
};

export const RotateSize = ([sx, sz]: XZType, turns: number): XZType => (turns % 2 ? [sz, sx] : [sx, sz]);

export const DIRS: DirType[] = ['x+', 'z+', 'x-', 'z-'];

/** The direction a mover heading `dir` is facing once the scene is turned. */
export const RotateDir = (dir: DirType, turns: number): DirType => DIRS[(TURNS_OF[dir] + turns) % 4];

export type ProjectorType = {
  /** Picture size in SVG units */
  W: number;
  H: number;
  /** World units → px */
  S: number;
  pt: (x: number, z: number, y: number) => [number, number];
  /** Screen offset of a move by (dx, dz) on the floor — the projection is linear, so a mover is one translate. */
  delta: (dx: number, dz: number) => [number, number];
};

/** Isometric projection that fits a `size` world into a picture `width` wide. */
export const Projector = (size: XZType, width = 1200, pad = 18, top = 5): ProjectorType => {
  const [sx, sz] = size;
  const S = (width - pad * 2) / (COS30 * (sx + sz));
  const CX = pad + COS30 * sz * S;
  const CY = pad + top * S;
  const H = Math.round(CY + 0.5 * (sx + sz) * S + 0.6 * S + pad);
  return {
    W: width,
    H,
    S,
    pt: (x, z, y) => [CX + COS30 * (x - z) * S, CY + 0.5 * (x + z) * S - y * S],
    delta: (dx, dz) => [COS30 * (dx - dz) * S, 0.5 * (dx + dz) * S],
  };
};

export type PolyType = { points: string; fill: string; stroke: string };

const str = (ps: [number, number][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

/** The three visible faces of a box (front, right, top), lit from the top-left. */
export const Faces = (b: BoxType, pt: ProjectorType['pt']): PolyType[] => {
  const { x, z, w, d, h, y } = b;
  const c = ColorOf(b.c);
  return [
    { points: str([pt(x, z + d, y), pt(x + w, z + d, y), pt(x + w, z + d, y + h), pt(x, z + d, y + h)]), fill: Shade(c, 0.93), stroke: Shade(c, 0.84) },
    { points: str([pt(x + w, z, y), pt(x + w, z + d, y), pt(x + w, z + d, y + h), pt(x + w, z, y + h)]), fill: Shade(c, 0.8), stroke: Shade(c, 0.72) },
    { points: str([pt(x, z, y + h), pt(x + w, z, y + h), pt(x + w, z + d, y + h), pt(x, z + d, y + h)]), fill: Shade(c, 1.02), stroke: Shade(c, 0.9) },
  ];
};

const EPS = 1e-6;

/** Painter's order for boxes: anything wholly behind on x or z first; on a shared footprint, lower first. */
export const BehindFirst = (a: BoxType, b: BoxType): number => {
  if (a.x + a.w <= b.x + EPS || a.z + a.d <= b.z + EPS) return -1;
  if (b.x + b.w <= a.x + EPS || b.z + b.d <= a.z + EPS) return 1;
  return a.y - b.y || a.y + a.h - (b.y + b.h);
};

export type SortedGroupType = IsoGroupType & { key: number; x1: number; z1: number; x2: number; z2: number; tall: number };

/** Groups in drawing order (back to front by their centre), with their footprints. */
export const SortGroups = (groups: IsoGroupType[]): SortedGroupType[] =>
  groups
    .filter((g) => g.parts.length)
    .map((g) => {
      const x1 = Math.min(...g.parts.map((p) => p.x));
      const z1 = Math.min(...g.parts.map((p) => p.z));
      const x2 = Math.max(...g.parts.map((p) => p.x + p.w));
      const z2 = Math.max(...g.parts.map((p) => p.z + p.d));
      const tall = Math.max(...g.parts.map((p) => p.y + p.h));
      return { ...g, key: (x1 + x2) / 2 + (z1 + z2) / 2, x1, z1, x2, z2, tall };
    })
    .sort((a, b) => a.key - b.key);

/** A soft contact shadow under a group, cast toward the viewer's right. */
export const ShadowOf = (g: SortedGroupType, pt: ProjectorType['pt']): PolyType | null => {
  if (g.tall < 0.6 || g.x2 - g.x1 > 8 || g.z2 - g.z1 > 8) return null;
  const o = Math.min(1.1, g.tall * 0.3);
  return {
    points: str([pt(g.x1 + o * 0.3, g.z1 + o, 0.17), pt(g.x2 + o, g.z1 + o * 0.3, 0.17), pt(g.x2 + o, g.z2 + o, 0.17), pt(g.x1 + o * 0.3, g.z2 + o, 0.17)]),
    fill: 'rgba(90,50,20,0.10)',
    stroke: 'none',
  };
};

/** The outline of a floor rectangle, for selection and alert rings. */
export const FloorRect = (x: number, z: number, w: number, d: number, margin: number, pt: ProjectorType['pt']): string =>
  str([pt(x - margin, z - margin, 0.2), pt(x + w + margin, z - margin, 0.2), pt(x + w + margin, z + d + margin, 0.2), pt(x - margin, z + d + margin, 0.2)]);
