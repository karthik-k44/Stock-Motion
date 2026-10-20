import type { BoxType, DirType, IsoGroupType, SlotStatusType } from '../../types';
import { RotateBoxAtOrigin, TURNS_OF } from './project';

/** One axis-aligned box: footprint x..x+w by z..z+d, from height y up by h. */
export const B = (x: number, z: number, w: number, d: number, h: number, c: string, y = 0): BoxType => ({ x, z, w, d, h, c, y });

/** A long box cut into pieces so the painter's sort can put things between them. */
export const Split = (x: number, z: number, w: number, d: number, h: number, c: string, y: number, piece: number): BoxType[] => {
  const long = w >= d;
  const len = long ? w : d;
  const n = Math.max(1, Math.ceil(len / piece));
  return Array.from({ length: n }, (_, i) => {
    const a = (len / n) * i;
    return long ? B(x + a, z, len / n, d, h, c, y) : B(x, z + a, w, len / n, h, c, y);
  });
};

/** A cladded wall along x: panels with vertical ribs on the visible face and an orange cap. */
export const WallX = (x1: number, x2: number, z: number, h: number, t: number): IsoGroupType[] =>
  Split(x1, z, x2 - x1, t, h, 'wall', 0, 2.2).map((seg) => {
    const parts = [seg];
    for (let r = seg.x + 0.55; r < seg.x + seg.w - 0.1; r += 1.1) parts.push(B(r, z + t, 0.08, 0.04, h - 0.35, 'rib', 0.15));
    parts.push(B(seg.x, z - 0.02, seg.w, t + 0.08, 0.32, 'orange', h));
    return { id: null, parts };
  });

/** The same wall running along z. */
export const WallZ = (x: number, z1: number, z2: number, h: number, t: number): IsoGroupType[] =>
  Split(x, z1, t, z2 - z1, h, 'wall', 0, 2.2).map((seg) => {
    const parts = [seg];
    for (let r = seg.z + 0.55; r < seg.z + seg.d - 0.1; r += 1.1) parts.push(B(x + t, r, 0.04, 0.08, h - 0.35, 'rib', 0.15));
    parts.push(B(x - 0.02, seg.z, t + 0.08, seg.d, 0.32, 'orange', h));
    return { id: null, parts };
  });

/** A dock door in a wall along x: dark opening, rolled-up shutter, orange frame, rubber bumpers, door light. */
export const Door = (id: string, x: number, z: number, staged: BoxType[] = []): IsoGroupType => {
  const W = 3;
  const H = 2.6;
  const parts = [B(x, z - 0.5, W, 0.55, H, 'opening'), B(x + 0.1, z - 0.45, W - 0.2, 0.3, 0.55, 'shade', H - 0.6)];
  for (let s = 0; s < 3; s++) parts.push(B(x + 0.1, z - 0.15, W - 0.2, 0.04, 0.04, 'rib', H - 0.5 + s * 0.16));
  parts.push(...staged);
  parts.push(B(x - 0.18, z - 0.05, 0.18, 0.28, H + 0.18, 'orange'), B(x + W, z - 0.05, 0.18, 0.28, H + 0.18, 'orange'), B(x - 0.18, z - 0.05, W + 0.36, 0.28, 0.18, 'orange', H));
  parts.push(B(x + 0.25, z + 0.05, 0.35, 0.3, 0.4, 'rubber', 0.55), B(x + W - 0.6, z + 0.05, 0.35, 0.3, 0.4, 'rubber', 0.55));
  parts.push(B(x + W / 2 - 0.35, z + 0.02, 0.7, 0.1, 0.42, 'orange', H + 0.32));
  return { id, parts };
};

/**
 * Pallet racking drawn from the zone's real slots: `rows[level][bin]`, bottom level first.
 * Full slots get a taped carton, low ones a short carton and an amber shelf tag, out ones a red tag and no carton.
 */
export type RackLookType = { upright: string; beam: string; deck: string };
const STEEL: RackLookType = { upright: 'upright', beam: 'beam', deck: 'deck' };
export const WOODEN: RackLookType = { upright: 'woodDark', beam: 'woodDark', deck: 'wood' };

export const Rack = (id: string, x: number, z: number, rows: SlotStatusType[][], width = 6, look: RackLookType = STEEL): IsoGroupType => {
  const levels = Math.max(1, rows.length);
  const bins = Math.max(1, ...rows.map((r) => r.length));
  const LH = levels > 3 ? 0.9 : 1.1;
  const D = 1.35;
  const binW = (width - 0.2) / bins;
  const parts: BoxType[] = [];
  const post = (px: number, pz: number) => B(px, pz, 0.14, 0.14, levels * LH + 0.25, look.upright);
  parts.push(post(x, z), post(x + width - 0.14, z));
  for (let l = 0; l < levels; l++) {
    const y = 0.18 + l * LH;
    parts.push(B(x, z, width, D, 0.06, look.deck, y - 0.06), B(x, z, width, 0.12, 0.14, look.beam, y - 0.14));
    for (let i = 0; i < bins; i++) {
      const s = rows[l]?.[i] ?? 'empty';
      const bx = x + 0.17 + i * binW;
      if (s === 'ok' || s === 'low') {
        const h = (s === 'low' ? 0.38 : 0.78 - ((l + i) % 2) * 0.12) * (LH / 1.1);
        parts.push(B(bx, z + 0.18, binW - 0.16, D - 0.36, h, s === 'low' ? 'low' : 'carton', y));
        parts.push(B(bx + (binW - 0.16) / 2 - 0.05, z + 0.18, 0.1, D - 0.36, 0.02, 'tape', y + h));
      }
    }
    parts.push(B(x, z + D - 0.12, width, 0.12, 0.14, look.beam, y - 0.14));
    for (let i = 0; i < bins; i++) {
      const s = rows[l]?.[i] ?? 'empty';
      if (s === 'low' || s === 'out') parts.push(B(x + 0.17 + i * binW + binW / 2 - 0.22, z + D - 0.02, 0.45, 0.06, 0.12, s, y - 0.13));
    }
  }
  parts.push(post(x, z + D - 0.14), post(x + width - 0.14, z + D - 0.14));
  return { id, parts };
};

/** A box truck facing +x, centred on the origin (wheels on both sides so it reads from any angle). */
const TRUCK: BoxType[] = (() => {
  const x = -4.2;
  const z = -1.1;
  const p: BoxType[] = [];
  [x + 1.0, x + 2.0, x + 5.0, x + 7.4].forEach((wx) => p.push(B(wx, z - 0.05, 0.75, 0.25, 0.75, 'tire'), B(wx, z + 2.05, 0.75, 0.25, 0.75, 'tire')));
  p.push(B(x, z, 6.3, 2.2, 2.4, 'white', 0.55), B(x, z + 2.2, 6.3, 0.03, 0.42, 'orange', 0.95), B(x + 0.5, z + 2.2, 0.75, 0.03, 0.75, 'orange', 1.65));
  p.push(B(x + 6.45, z + 0.1, 2.0, 2.0, 1.9, 'orange', 0.5), B(x + 8.42, z + 0.25, 0.04, 1.7, 0.8, 'glass', 1.35), B(x + 6.9, z + 2.08, 1.1, 0.04, 0.65, 'glass', 1.5));
  p.push(B(x + 6.45, z + 0.1, 2.0, 2.0, 0.12, 'rust', 2.4));
  return p;
})();

/** A delivery van facing +x, centred on the origin. */
const VAN = (body: string): BoxType[] => {
  const x = -2.35;
  const z = -1.0;
  const p: BoxType[] = [];
  [x + 0.6, x + 3.4].forEach((wx) => p.push(B(wx, z - 0.05, 0.7, 0.22, 0.7, 'tire'), B(wx, z + 1.9, 0.7, 0.22, 0.7, 'tire')));
  p.push(B(x, z, 3.4, 2.05, 1.85, 'white', 0.45), B(x + 0.3, z + 2.05, 2.8, 0.03, 0.36, body, 0.9));
  p.push(B(x + 3.4, z + 0.05, 1.3, 1.95, 1.45, body, 0.45), B(x + 4.68, z + 0.25, 0.04, 1.55, 0.6, 'glass', 1.15));
  return p;
};

export type VehicleKindType = 'truck' | 'van' | 'vanDark';

/** A vehicle's boxes facing `dir`, centred on the origin. */
export const Vehicle = (kind: VehicleKindType, dir: DirType): BoxType[] => {
  const base = kind === 'truck' ? TRUCK : VAN(kind === 'van' ? 'orange' : 'beam');
  return base.map((b) => RotateBoxAtOrigin(b, TURNS_OF[dir]));
};

/** A vehicle parked at (x, z) facing `dir`. */
export const Parked = (id: string | null, kind: VehicleKindType, x: number, z: number, dir: DirType): IsoGroupType => ({
  id,
  parts: Vehicle(kind, dir).map((b) => ({ ...b, x: b.x + x, z: b.z + z })),
});

/** A worker in a coloured vest, centred on the origin. */
export const Person = (vest: string, y = 0): BoxType[] => [B(-0.27, -0.22, 0.55, 0.45, 1.05, vest, y), B(-0.18, -0.17, 0.37, 0.35, 0.37, 'skin', y + 1.08)];

export const PersonAt = (x: number, z: number, vest: string, y = 0): BoxType[] => Person(vest, y).map((b) => ({ ...b, x: b.x + x, z: b.z + z }));

export const Tree = (x: number, z: number): BoxType[] => [B(x + 0.55, z + 0.55, 0.3, 0.3, 0.9, 'trunk'), B(x, z, 1.4, 1.4, 1.1, 'leafDark', 0.85), B(x + 0.2, z + 0.2, 1.0, 1.0, 0.7, 'leaf', 1.95)];

/** A carton with a tape strip, coloured by stock status. */
export const Carton = (x: number, z: number, w: number, d: number, h: number, y: number, c = 'carton'): BoxType[] => [B(x, z, w, d, h, c, y), B(x + w / 2 - 0.05, z, 0.1, d, 0.02, 'tape', y + h)];

/** A house on a job site; `busy` adds scaffolding. */
export const House = (x: number, z: number, wall: string, busy: boolean): BoxType[] => [
  B(x, z, 4, 3.4, 2.1, wall),
  B(x + 1.4, z + 3.35, 0.8, 0.08, 1.3, 'woodDark'),
  B(x + 0.4, z + 3.35, 0.8, 0.08, 0.7, 'glow', 0.9),
  B(x - 0.2, z - 0.2, 4.4, 3.8, 0.45, 'roof', 2.1),
  B(x + 0.4, z + 0.3, 3.2, 2.8, 0.45, 'roof', 2.55),
  B(x + 1.0, z + 0.8, 2.0, 1.8, 0.4, 'roof', 3.0),
  ...(busy ? [B(x - 0.4, z + 3.6, 0.12, 0.12, 3.0, 'steel'), B(x + 4.3, z + 3.6, 0.12, 0.12, 3.0, 'steel'), B(x - 0.4, z + 3.6, 4.8, 0.12, 0.12, 'orange', 1.5), B(x - 0.4, z + 3.6, 4.8, 0.12, 0.12, 'orange', 2.9)] : []),
];
