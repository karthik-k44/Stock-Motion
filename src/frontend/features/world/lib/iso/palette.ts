/** Scene colours: the bright warehouse look, with orange wherever the reference design used blue. */
export const PALETTE = {
  ground: '#ece7e1',
  grass: '#d6e9d4',
  grassDark: '#b9d8b5',
  yard: '#f4f0eb',
  road: '#dcd6cf',
  dash: '#ffffff',
  line: '#f2c94c',
  floor: '#faf8f5',
  woodFloor: '#ecd9bf',
  concrete: '#e4ded6',
  stone: '#efe9df',
  wall: '#ede8e2',
  rib: '#ddd3c8',
  orange: '#ff7900',
  orangeDark: '#e66d00',
  rust: '#8c4300',
  upright: '#ff7900',
  beam: '#3f3a36',
  deck: '#efe9e2',
  carton: '#dba86e',
  tape: '#c38b4c',
  low: '#f5b041',
  out: '#e5484d',
  opening: '#2b2622',
  shade: '#d8cfc5',
  rubber: '#1f1c1a',
  white: '#ffffff',
  glass: '#c9e1ea',
  tire: '#26221f',
  bench: '#c9965f',
  pallet: '#c49a64',
  wood: '#b98352',
  woodDark: '#8a5a36',
  brown: '#7a4a2a',
  cream: '#f2e6d3',
  steel: '#b4b1ad',
  dark: '#2f2a27',
  glow: '#ffd27a',
  screen: '#2f9e6d',
  mint: '#bfe3cf',
  pink: '#e7a7b8',
  sky: '#e3ebef',
  roof: '#9b4d3b',
  skin: '#e2b48f',
  leaf: '#7fbf73',
  leafDark: '#5fa456',
  trunk: '#8a6a4a',
  bollard: '#f2c94c',
} as const;

export type PaletteKeyType = keyof typeof PALETTE;

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** A colour lightened or darkened by `f` (1 = as is), for the lit and shaded faces of a box. */
export const Shade = (color: string, f: number): string => {
  const [r, g, b] = hex(color);
  const k = (v: number) => Math.min(255, Math.round(v * f));
  return `rgb(${k(r)},${k(g)},${k(b)})`;
};

/** Palette key or any `#rrggbb` (team members' own colours). */
export const ColorOf = (c: string): string => (c in PALETTE ? PALETTE[c as PaletteKeyType] : c);
