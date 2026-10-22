/**
 * The landing page's scenario illustrations: small isometric sets drawn with the live world's own kit, each showing
 * one everyday problem the product handles, with the tags and notification a user would see at that moment.
 * Example data only — these are marketing pictures, not anyone's records.
 */
import { B, Carton, Door, House, Parked, PersonAt, Rack, Tree, WallX, WallZ, WOODEN } from '../../src/frontend/features/world/lib/iso/kit';
import type { BoxType, IsoGroupType, XZType } from '../../src/frontend/features/world/types';

export type ToneType = 'primary' | 'danger' | 'warning' | 'success' | 'neutral';
export type NoteIconType = 'alert' | 'truck' | 'coffee' | 'wrench' | 'box' | 'check';

export type IllustrationType = {
  id: string;
  size: XZType;
  ground: BoxType[];
  groups: IsoGroupType[];
  tags: { at: [number, number, number]; chip: string; text: string; tone: ToneType }[];
  pins: { at: [number, number, number]; tone: 'danger' | 'primary' }[];
  /** The live notification for this moment */
  note?: { icon: NoteIconType; tone: ToneType; title: string; body: string; time: string; corner: 'tl' | 'tr' | 'bl' | 'br' };
  /** A floating panel instead of / as well as a note */
  panel?: 'history' | 'dashboard';
  /** Two warm tints for the background wash */
  tint: [string, string];
};

const g = (parts: BoxType[], id: string | null = null): IsoGroupType => ({ id, parts });
const floorPlate = (w: number, d: number): BoxType[] => [B(0, 0, w, d, 0.6, 'ground', -0.6), B(1.5, 1.5, w - 3, d - 3, 0.16, 'floor')];
const backWalls = (w: number, d: number, h = 3.2) => [...WallX(1.5, w - 1.5, 1.5, h, 0.35), ...WallZ(1.5, 1.85, d - 1.5, h, 0.35)];
const dashes = (z: number, w: number) => Array.from({ length: Math.floor(w / 3.6) }, (_, i) => B(0.8 + i * 3.6, z, 1.6, 0.16, 0.06, 'dash'));

const shortages: IllustrationType = {
  id: 'shortages',
  size: [22.5, 16.5],
  ground: floorPlate(22.5, 16.5),
  groups: [
    ...backWalls(22.5, 16.5),
    Rack('a', 4.5, 4.2, [['ok', 'low', 'ok', 'out'], ['ok', 'ok', 'low', 'ok'], ['ok', 'ok', 'ok', 'empty']]),
    Rack('b', 12.5, 4.2, [['ok', 'ok', 'ok', 'ok'], ['low', 'ok', 'ok', 'ok'], ['ok', 'ok', 'empty', 'ok']]),
    Rack('c', 4.5, 10.5, [['ok', 'ok', 'ok', 'ok'], ['ok', 'ok', 'ok', 'empty'], ['ok', 'empty', 'ok', 'ok']]),
    Rack('d', 12.5, 10.5, [['ok', 'ok', 'low', 'ok'], ['ok', 'ok', 'ok', 'ok'], ['ok', 'ok', 'ok', 'empty']]),
    g(PersonAt(11.4, 7.6, 'orange')),
    g([B(19.5, 7, 2.2, 2.2, 0.22, 'pallet'), ...Carton(19.65, 7.15, 0.95, 0.95, 0.8, 0.22), ...Carton(20.65, 7.15, 0.95, 0.95, 0.65, 0.22), ...Carton(19.65, 8.15, 0.95, 0.95, 0.7, 0.22)]),
  ],
  tags: [{ at: [7.5, 4.9, 4.3], chip: 'A', text: '1 out · 2 low', tone: 'danger' }],
  pins: [{ at: [9.75, 5.6, 0.9], tone: 'danger' }],
  note: { icon: 'alert', tone: 'danger', title: 'Out of stock: Bluetooth Speaker', body: 'Reorder of 120 booked with Shenzhen Audio', time: 'just now', corner: 'tr' },
  tint: ['#ffe2c8', '#ffd0d0'],
};

const dock: IllustrationType = {
  id: 'dock',
  size: [28, 23],
  ground: [B(0, 0, 28, 23, 0.6, 'ground', -0.6), B(1.5, 1.5, 25, 11.5, 0.16, 'floor'), B(0, 13, 28, 5.5, 0.04, 'yard'), B(0, 18.5, 28, 4.5, 0.05, 'road'), ...dashes(20.6, 28), B(5.1, 13.3, 0.12, 5, 0.06, 'line'), B(9.9, 13.3, 0.12, 5, 0.06, 'line'), B(13.1, 13.3, 0.12, 5, 0.06, 'line'), B(17.9, 13.3, 0.12, 5, 0.06, 'line')],
  groups: [
    ...backWalls(28, 13, 3.4),
    Rack('r', 5, 3.5, [['ok', 'ok', 'low', 'ok'], ['ok', 'ok', 'ok', 'empty'], ['ok', 'ok', 'empty', 'empty']]),
    Rack('s', 13, 3.5, [['ok', 'ok', 'ok', 'ok'], ['ok', 'low', 'ok', 'empty'], ['ok', 'ok', 'ok', 'empty']]),
    ...WallX(1.5, 5.82, 12.6, 3.4, 0.4),
    ...WallX(9.18, 13.82, 12.6, 3.4, 0.4),
    ...WallX(17.18, 26.5, 12.6, 3.4, 0.4),
    Door('d1', 6, 13, [B(6.4, 12.55, 2.2, 0.4, 0.2, 'pallet'), ...Carton(6.5, 12.55, 1.0, 0.4, 0.75, 0.2), ...Carton(7.6, 12.55, 0.9, 0.4, 0.6, 0.2)]),
    Door('d2', 14, 13),
    Parked(null, 'truck', 7.5, 17.9, 'z+'),
    Parked(null, 'truck', 21.5, 20.6, 'x-'),
    g([B(5.4, 13.2, 0.3, 0.3, 0.9, 'bollard'), B(9.5, 13.2, 0.3, 0.3, 0.9, 'bollard'), B(13.4, 13.2, 0.3, 0.3, 0.9, 'bollard'), B(17.5, 13.2, 0.3, 0.3, 0.9, 'bollard')]),
  ],
  tags: [
    { at: [7.5, 13.1, 4.2], chip: 'Door 1', text: 'DLV-2041 arrived', tone: 'warning' },
    { at: [21.5, 20.6, 3.5], chip: 'DLV-2042', text: 'on the way · 14:30', tone: 'primary' },
  ],
  pins: [{ at: [15.5, 15.8, 0.1], tone: 'primary' }],
  note: { icon: 'truck', tone: 'primary', title: 'Truck at Door 1', body: 'Shenzhen Audio · 260 units to count in', time: '2 min ago', corner: 'tl' },
  tint: ['#ffe6cc', '#ffd8b5'],
};

const cafe: IllustrationType = {
  id: 'cafe',
  size: [21, 17.5],
  ground: [B(0, 0, 21, 17.5, 0.6, 'ground', -0.6), B(1.5, 1.5, 18, 14.5, 0.15, 'woodFloor')],
  groups: [
    ...backWalls(21, 17.5, 2.8),
    Rack('dry', 7.5, 2.2, [['ok'], ['low'], ['ok']], 3.2, WOODEN),
    g([B(2.5, 2.1, 3.2, 1.6, 3.0, 'white'), B(2.7, 3.66, 2.8, 0.06, 2.5, 'glass', 0.25), B(2.9, 3.7, 1.1, 0.3, 0.35, 'low', 0.4), B(4.2, 3.7, 0.9, 0.3, 0.4, 'carton', 1.25), B(2.9, 3.7, 0.9, 0.3, 0.3, 'carton', 2.1)], 'fridge'),
    g([B(5.5, 6.5, 10, 1.3, 1.0, 'brown'), B(5.4, 6.4, 10.2, 1.5, 0.1, 'stone', 1.0)], 'counter'),
    g([B(6.4, 6.6, 1.5, 0.9, 0.9, 'steel', 1.1), B(6.5, 6.65, 1.3, 0.7, 0.12, 'dark', 2.0), B(6.7, 7.45, 0.3, 0.12, 0.25, 'dark', 1.4), B(7.3, 7.45, 0.3, 0.12, 0.25, 'dark', 1.4)]),
    g([B(13, 6.7, 0.9, 0.7, 0.35, 'dark', 1.1), B(13.1, 6.8, 0.7, 0.06, 0.45, 'screen', 1.45)]),
    g([B(16.4, 6.4, 2.7, 1.5, 1.0, 'brown'), B(16.5, 6.5, 2.5, 1.3, 0.06, 'glass', 1.75), B(16.8, 6.9, 0.5, 0.5, 0.25, 'carton', 1.02), B(17.6, 6.9, 0.5, 0.5, 0.25, 'pink', 1.02)]),
    g(PersonAt(9.6, 5.4, 'orange')),
    ...[[5, 11], [9.5, 11], [14, 11], [7, 14.5], [11.5, 14.5]].map(([x, z], i) =>
      g([B(x - 0.9, z + 0.3, 0.6, 0.6, 0.5, 'brown'), B(x, z, 1.3, 1.3, 0.85, 'cream'), B(x + 1.6, z + 0.3, 0.6, 0.6, 0.5, 'brown'), ...(i % 2 === 0 ? PersonAt(x - 0.6, z + 0.6, ['beam', 'pink', 'screen'][i % 3], 0.5) : [])]),
    ),
  ],
  tags: [
    { at: [10.5, 7.1, 2.5], chip: 'TKT-1042', text: 'preparing', tone: 'primary' },
    { at: [4.1, 2.9, 3.7], chip: 'Fridge', text: 'oat milk low', tone: 'warning' },
  ],
  pins: [],
  note: { icon: 'coffee', tone: 'success', title: 'Ticket served · Table 3', body: 'Espresso beans and oat milk used — stock updated', time: 'just now', corner: 'br' },
  tint: ['#ffe9d6', '#f9d9c9'],
};

const trades: IllustrationType = {
  id: 'trades',
  size: [30, 21],
  ground: [B(0, 0, 30, 21, 0.6, 'grass', -0.6), B(0, 14.5, 30, 3.2, 0.05, 'road'), ...dashes(16, 30), B(1.5, 2, 9, 7, 0.12, 'concrete')],
  groups: [
    g([B(2, 2.5, 6.5, 4.5, 2.4, 'white'), B(1.8, 2.3, 6.9, 4.9, 0.32, 'orange', 2.4), B(4, 6.97, 2, 0.08, 1.8, 'opening'), B(2.6, 6.97, 1, 0.08, 0.7, 'glow', 1.1)]),
    g(House(16, 4, 'cream', true), 'site'),
    g(House(22.5, 5, 'sky', false)),
    Parked(null, 'van', 15.2, 11.2, 'x+'),
    g([...PersonAt(19.4, 9.3, 'orange'), ...Carton(19.05, 9.75, 0.7, 0.35, 0.45, 0.55)]),
    Parked(null, 'vanDark', 7, 16.1, 'x+'),
    g(Tree(11.5, 2)),
    g(Tree(27, 11)),
    g(Tree(1.5, 10.5)),
    g(Tree(12.5, 9.5)),
  ],
  tags: [
    { at: [15.2, 11.2, 2.9], chip: 'Van 1', text: 'on site', tone: 'primary' },
    { at: [18, 5.7, 4.1], chip: 'J-204', text: 'in progress', tone: 'warning' },
    { at: [7, 16.1, 2.9], chip: 'Van 2', text: 'to J-207', tone: 'neutral' },
  ],
  pins: [],
  note: { icon: 'wrench', tone: 'primary', title: 'Materials logged to J-204', body: '12 m copper pipe and 8 fittings from Van 1', time: '5 min ago', corner: 'bl' },
  tint: ['#ffe8cf', '#e9f0d8'],
};

const picking: IllustrationType = {
  id: 'picking',
  size: [20.5, 16],
  ground: floorPlate(20.5, 16),
  groups: [
    ...backWalls(20.5, 16),
    Rack('a', 3.5, 3, [['ok', 'ok', 'low', 'ok'], ['ok', 'ok', 'ok', 'ok'], ['ok', 'empty', 'ok', 'ok']]),
    Rack('b', 10.5, 3, [['ok', 'ok', 'ok', 'ok'], ['ok', 'ok', 'ok', 'empty'], ['ok', 'ok', 'ok', 'ok']]),
    g([B(13.5, 8.5, 4.2, 1.5, 0.95, 'bench'), ...Carton(13.9, 8.8, 1.0, 0.9, 0.6, 0.95), ...Carton(15.2, 8.85, 0.8, 0.7, 0.45, 0.95), ...Carton(16.4, 8.8, 0.9, 0.8, 0.55, 0.95)]),
    g([B(14, 11.8, 2.2, 2.2, 0.22, 'pallet'), ...Carton(14.15, 11.95, 0.95, 0.95, 0.8, 0.22), ...Carton(15.15, 11.95, 0.95, 0.95, 0.65, 0.22), ...Carton(14.15, 12.95, 0.95, 0.95, 0.7, 0.22), ...Carton(15.15, 12.95, 0.95, 0.95, 0.85, 0.22), ...Carton(14.3, 12.1, 0.8, 0.8, 0.5, 1.0)]),
    g(PersonAt(12.9, 9.4, 'orange')),
    g([B(6.5, 8, 1.8, 1.1, 0.5, 'steel', 0.15), ...Carton(6.6, 8.1, 0.8, 0.8, 0.45, 0.65), ...Carton(7.45, 8.1, 0.75, 0.8, 0.35, 0.65), B(6.5, 8, 0.1, 1.1, 1.3, 'steel')]),
    g(PersonAt(8.9, 8.6, 'beam')),
  ],
  tags: [
    { at: [15.6, 9.2, 2.5], chip: 'SO-10231', text: '6 / 20 picked', tone: 'primary' },
    { at: [15.1, 12.9, 2.3], chip: 'SO-10234', text: 'packed', tone: 'success' },
  ],
  pins: [],
  note: { icon: 'box', tone: 'success', title: 'SO-10234 packed', body: '40 units ready to ship from Door 4', time: 'just now', corner: 'tr' },
  tint: ['#ffe4c9', '#ffe9dc'],
};

const history: IllustrationType = {
  id: 'history',
  size: [18, 12.5],
  ground: floorPlate(18, 12.5),
  groups: [
    ...backWalls(18, 12.5),
    Rack('a', 3, 3, [['ok', 'ok', 'ok', 'low'], ['ok', 'ok', 'ok', 'ok'], ['ok', 'ok', 'empty', 'ok']]),
    g(PersonAt(9.8, 6.4, 'orange')),
    g([...Carton(10.8, 6.2, 0.9, 0.8, 0.55, 0), ...Carton(10.95, 7.2, 0.8, 0.7, 0.4, 0)]),
    g([B(13, 4, 3, 1.5, 1.0, 'wood'), B(13.3, 4.2, 1.1, 0.8, 0.06, 'dark', 1.0), B(13.35, 4.25, 1.0, 0.04, 0.6, 'screen', 1.06)]),
  ],
  tags: [{ at: [6, 3.7, 4.2], chip: 'A-1-4', text: 'count updated', tone: 'neutral' }],
  pins: [],
  panel: 'history',
  tint: ['#ffe7d2', '#fde3c3'],
};

const receiving: IllustrationType = {
  id: 'receiving',
  size: [24, 23],
  ground: [B(0, 0, 24, 23, 0.6, 'ground', -0.6), B(1.5, 1.5, 21, 11, 0.16, 'floor'), B(0, 13, 24, 10, 0.04, 'yard')],
  groups: [
    ...backWalls(24, 13),
    Rack('r', 3, 3, [['ok', 'ok', 'ok', 'empty'], ['ok', 'ok', 'low', 'empty'], ['ok', 'empty', 'empty', 'empty']]),
    ...WallX(1.5, 8.82, 12.6, 3.4, 0.4),
    ...WallX(12.18, 22.5, 12.6, 3.4, 0.4),
    Door('d', 9, 13),
    g([B(8.6, 9, 2.2, 2.2, 0.22, 'pallet'), ...Carton(8.75, 9.15, 0.95, 0.95, 0.8, 0.22), ...Carton(9.75, 9.15, 0.95, 0.95, 0.65, 0.22), ...Carton(8.75, 10.15, 0.95, 0.95, 0.75, 0.22), ...Carton(9.75, 10.15, 0.95, 0.95, 0.7, 0.22)]),
    g([B(5.6, 9.5, 2.2, 2.2, 0.22, 'pallet'), ...Carton(5.75, 9.65, 0.95, 0.95, 0.6, 0.22), ...Carton(6.75, 9.65, 0.95, 0.95, 0.7, 0.22)]),
    g([...PersonAt(12.4, 9.9, 'orange'), B(12.05, 10.15, 0.06, 0.35, 0.45, 'white', 0.55)]),
    Parked(null, 'truck', 10.5, 17.9, 'z+'),
  ],
  tags: [
    { at: [6.7, 10.6, 1.6], chip: '+120', text: 'counted', tone: 'success' },
    { at: [10.5, 13.1, 4.9], chip: 'DLV-2041', text: 'receiving', tone: 'primary' },
  ],
  pins: [],
  note: { icon: 'check', tone: 'success', title: 'Delivery received', body: 'DLV-2041 · 3 lines checked · stock updated', time: 'just now', corner: 'tr' },
  tint: ['#ffe5cc', '#fff0dd'],
};

const today: IllustrationType = {
  id: 'today',
  size: [24, 18],
  ground: [B(0, 0, 24, 18, 0.6, 'ground', -0.6), B(1.5, 1.5, 15, 10, 0.16, 'floor'), B(0, 13, 24, 5, 0.05, 'road'), ...dashes(15.3, 24)],
  groups: [
    ...WallX(1.5, 16.5, 1.5, 3, 0.35),
    ...WallZ(1.5, 1.85, 11.5, 3, 0.35),
    Rack('a', 3.5, 3, [['ok', 'ok', 'ok', 'ok'], ['ok', 'low', 'ok', 'ok'], ['ok', 'ok', 'empty', 'ok']]),
    Rack('b', 10, 3, [['ok', 'ok', 'ok', 'ok'], ['ok', 'ok', 'ok', 'ok'], ['ok', 'ok', 'ok', 'empty']]),
    g([B(10.5, 8, 4.2, 1.5, 0.95, 'bench'), ...Carton(10.9, 8.3, 1.0, 0.9, 0.6, 0.95), ...Carton(12.2, 8.35, 0.8, 0.7, 0.45, 0.95)]),
    g(PersonAt(9.6, 8.8, 'orange')),
    Parked(null, 'van', 19, 15.2, 'x+'),
    g(Tree(20, 3)),
    g(Tree(21.5, 8)),
  ],
  tags: [{ at: [19, 15.2, 2.9], chip: 'SO-10234', text: 'shipped', tone: 'success' }],
  pins: [],
  panel: 'dashboard',
  tint: ['#ffe3c6', '#ffeedd'],
};

export const ILLUSTRATIONS: IllustrationType[] = [shortages, dock, cafe, trades, picking, history, receiving, today];
