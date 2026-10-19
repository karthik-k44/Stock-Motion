/**
 * Warehouse geometry, shared by the animated scene, the location map and the
 * crew choreography. All values are in "world units" (the scene is scaled to
 * fit the viewport height).
 */
export const WORLD_W = 3760;
export const WORLD_H = 720;
export const FLOOR_Y = 600;

export const DOCK_X = 640; // left edge of the building wall / dock door
export const WALL_W = 40;
export const TRUCK_W = 500;
export const TRUCK_PARKED_X = DOCK_X - TRUCK_W - 4;
export const STAGING_X = 760;
export const PACK_X = 3440;
export const SHIP_DOOR_X = 3700;

export const AISLES = ['A', 'B', 'C', 'D'] as const;
export type AisleId = (typeof AISLES)[number];
export const LEVELS = [1, 2, 3] as const;
export const BINS = [1, 2, 3, 4] as const;

export const AISLE_INFO: Record<AisleId, { label: string }> = {
  A: { label: 'Electronics & Office' },
  B: { label: 'Home & Kitchen' },
  C: { label: 'Apparel' },
  D: { label: 'Outdoor & Health' },
};

export const RACK_W = 440;
export const RACK_START = 1120;
export const RACK_GAP = 560;
export const LEVEL_H = 130;
export const BIN_W = 100;

export function aisleX(aisle: AisleId): number {
  return RACK_START + AISLES.indexOf(aisle) * RACK_GAP;
}
/** y of the shelf deck that boxes of this level sit on */
export function deckY(level: number): number {
  return FLOOR_Y - 10 - (level - 1) * LEVEL_H;
}
export function binX(aisle: AisleId, bin: number): number {
  return aisleX(aisle) + 14 + (bin - 1) * (BIN_W + 4);
}

export interface LocationParts {
  aisle: AisleId;
  level: number;
  bin: number;
}

export function parseLocation(code: string): LocationParts | null {
  const m = /^([A-D])-(\d)-(\d)$/.exec(code);
  if (!m) return null;
  return { aisle: m[1] as AisleId, level: Number(m[2]), bin: Number(m[3]) };
}

export function locationCode(aisle: AisleId, level: number, bin: number): string {
  return `${aisle}-${level}-${bin}`;
}

export const ALL_LOCATIONS: string[] = AISLES.flatMap((a) =>
  LEVELS.flatMap((l) => BINS.map((b) => locationCode(a, l, b))),
);

/** Horizontal centre of a location, in world units. */
export function locationCenterX(code: string): number {
  const p = parseLocation(code);
  if (!p) return RACK_START;
  return binX(p.aisle, p.bin) + BIN_W / 2;
}

export function describeLocation(code: string): string {
  const p = parseLocation(code);
  if (!p) return code;
  return `Aisle ${p.aisle} · Shelf ${p.level} · Bin ${p.bin}`;
}

export interface Zone {
  id: string;
  label: string;
  short: string;
  from: number;
  to: number;
}

export const ZONES: Zone[] = [
  { id: 'yard', label: 'Loading yard', short: 'Yard', from: 0, to: DOCK_X },
  { id: 'receiving', label: 'Receiving dock', short: 'Dock', from: DOCK_X, to: RACK_START - 20 },
  ...AISLES.map((a) => ({
    id: a,
    label: `Aisle ${a} · ${AISLE_INFO[a].label}`,
    short: `Aisle ${a}`,
    from: aisleX(a) - 20,
    to: aisleX(a) + RACK_GAP - 20,
  })),
  { id: 'packing', label: 'Packing & dispatch', short: 'Packing', from: RACK_START + 4 * RACK_GAP - 20, to: WORLD_W },
];

export function zoneAt(x: number): Zone {
  return ZONES.find((z) => x >= z.from && x < z.to) ?? ZONES[ZONES.length - 1];
}

export function zoneCenter(id: string): number {
  const z = ZONES.find((zz) => zz.id === id);
  if (!z) return 0;
  if (id === 'yard') return 380;
  return (z.from + z.to) / 2;
}
