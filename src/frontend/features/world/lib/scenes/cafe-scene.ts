import type { BoxType, DirType, IsoGroupType, IsoHotspotType, IsoMoverType, IsoPinType, IsoSceneType, SlotStatusType, WorldContextType, XZType } from '../../types';
import { B, Parked, Person, PersonAt, Rack, Tree, Vehicle, WallX, WallZ, WOODEN } from '../iso/kit';
import { Spread, ZoneRows, ZoneStacks } from './scene-data';

const SIZE: XZType = [34, 26];
const LANE_Z = 23.9;
const GOODS: Record<SlotStatusType, string | null> = { ok: 'carton', low: 'low', out: 'out', empty: null };
const TABLES: XZType[] = [[8, 13.2], [12, 13.2], [16, 13.2], [20, 13.2], [24, 13.2], [10, 16.6], [14, 16.6], [18, 16.6]];
const GUESTS = ['orange', 'beam', 'pink', 'screen'];
const WALKS: XZType[][] = [
  [[11.5, 7.9], [20.5, 7.9]],
  [[6, 6], [6, 11], [10, 11]],
  [[22, 11.6], [27, 11.6], [27, 18.8]],
  [[9, 19], [25, 19]],
];

/** Goods on each shelf of a cabinet, one row of boxes per level (bottom first), coloured by stock status. */
const shelfGoods = (rows: SlotStatusType[][], x: number, z: number, w: number, y0: number, lh: number): BoxType[] =>
  rows.flatMap((row, l) => {
    const c = GOODS[row[0] ?? 'empty'];
    if (!c) return [];
    const h = row[0] === 'out' ? 0.08 : row[0] === 'low' ? 0.22 : 0.4;
    return [B(x, z, w * 0.42, 0.3, h, c, y0 + l * lh), B(x + w * 0.5, z, w * 0.36, 0.3, h * 0.85, c, y0 + l * lh)];
  });

/** The café from the reference design: counter, storage at the back, tables up front, drop-offs at the curb. */
export const CafeScene = (ctx: WorldContextType, team: string[]): IsoSceneType => {
  const ground: BoxType[] = [B(0, 0, 34, 26, 0.8, 'ground', -0.8), B(0, 22.5, 34, 2.6, 0.04, 'road'), B(0, 20.6, 34, 1.9, 0.08, 'stone'), B(4, 3, 26, 17, 0.15, 'woodFloor')];
  for (let i = 0; i < 10; i++) ground.push(B(1.2 + i * 3.4, 23.7, 1.4, 0.16, 0.06, 'dash'));
  const groups: IsoGroupType[] = [...WallX(4, 30, 3, 2.8, 0.35), ...WallZ(4, 3.35, 20, 2.8, 0.35)];
  const hotspots: IsoHotspotType[] = [];
  const pins: IsoPinType[] = [];

  const storage = (code: string, rect: [number, number, number, number], tagY: number) => {
    const id = `zone-${code}`;
    hotspots.push({ id, rect, tagAt: [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2, tagY] });
    if (ZoneRows(ctx, code).flat().includes('out')) pins.push({ key: id, at: [rect[0] + rect[2] / 2, rect[1] + rect[3], tagY - 0.9], tone: 'critical', tab: 'alerts' });
  };

  groups.push(Rack('zone-DRY', 5, 3.6, ZoneRows(ctx, 'DRY'), 3.2, WOODEN));
  storage('DRY', [5, 3.6, 3.2, 1.35], 4.1);

  const fridge = ZoneRows(ctx, 'FRIDGE');
  groups.push({ id: 'zone-FRIDGE', parts: [B(9, 3.4, 3.2, 1.6, 3.0, 'white'), B(9.2, 4.96, 2.8, 0.06, 2.5, 'glass', 0.25), ...shelfGoods(fridge, 9.4, 5.0, 2.4, 0.4, 0.85)] });
  storage('FRIDGE', [9, 3.4, 3.2, 1.6], 3.6);

  const frozen = ZoneStacks(ctx, 'FREEZER', 4);
  groups.push({ id: 'zone-FREEZER', parts: [B(14, 3.6, 3, 1.5, 1.1, 'white'), ...frozen.map((s, i) => B(14.25 + i * 0.68, 3.85, 0.55, 1.0, 0.22, GOODS[s] ?? 'deck', 1.1))] });
  storage('FREEZER', [14, 3.6, 3, 1.5], 1.9);

  groups.push({ id: 'zone-BAR', parts: [B(12, 6.3, 5.2, 0.6, 2.2, 'woodDark'), B(12.1, 6.85, 5.0, 0.3, 0.06, 'wood', 0.8), B(12.1, 6.85, 5.0, 0.3, 0.06, 'wood', 1.5), ...shelfGoods(ZoneRows(ctx, 'BAR'), 12.4, 6.88, 4.4, 0.86, 0.7)] });
  storage('BAR', [12, 6.3, 5.2, 0.6], 2.8);

  groups.push({ id: 'counter', parts: [B(11, 9, 10, 1.3, 1.0, 'brown'), B(10.9, 8.9, 10.2, 1.5, 0.1, 'stone', 1.0)] });
  hotspots.push({ id: 'counter', rect: [11, 9, 10, 1.3], tagAt: [16.3, 9.6, 2.0] });
  groups.push({ id: 'coffee', parts: [B(12.2, 9.1, 1.5, 0.9, 0.9, 'steel', 1.1), B(12.3, 9.15, 1.3, 0.7, 0.12, 'dark', 2.0), B(12.5, 9.95, 0.3, 0.12, 0.25, 'dark', 1.4), B(13.1, 9.95, 0.3, 0.12, 0.25, 'dark', 1.4)] });
  hotspots.push({ id: 'coffee', rect: [12.2, 9.1, 1.5, 0.9], tagAt: [12.9, 9.5, 2.9] });
  groups.push({ id: 'till', parts: [B(18.6, 9.2, 0.9, 0.7, 0.35, 'dark', 1.1), B(18.7, 9.3, 0.7, 0.06, 0.45, 'screen', 1.45)] });
  hotspots.push({ id: 'till', rect: [18.6, 9.2, 0.9, 0.7], tagAt: [19, 9.5, 2.6] });
  if (ctx.orders.length) pins.push({ key: 'counter', at: [16.3, 10.3, 1.2], tone: 'primary', tab: 'orders' });

  groups.push({ id: 'zone-FRONT', parts: [B(21.4, 8.9, 2.7, 1.5, 1.0, 'brown'), B(21.5, 9.0, 2.5, 1.3, 0.06, 'glass', 1.75), ...shelfGoods(ZoneRows(ctx, 'FRONT'), 21.7, 9.5, 2.1, 1.02, 0.35)] });
  storage('FRONT', [21.4, 8.9, 2.7, 1.5], 2.5);

  // Tables are furniture; the guests seated at them are the open tickets.
  const guests = Math.min(TABLES.length, ctx.orders.length);
  TABLES.forEach(([x, z], i) =>
    groups.push({
      id: 'tables',
      parts: [B(x - 0.9, z + 0.3, 0.6, 0.6, 0.5, 'brown'), B(x, z, 1.3, 1.3, 0.85, 'cream'), B(x + 1.6, z + 0.3, 0.6, 0.6, 0.5, 'brown'), ...(i < guests ? PersonAt(x - 0.6, z + 0.6, GUESTS[i % GUESTS.length], 0.5) : [])],
    }),
  );
  hotspots.push({ id: 'tables', rect: [7, 13.2, 19, 4.8], tagAt: [16, 15, 1.7] });

  // Drop-offs: a van that has arrived waits at the curb; one on the way drives the street.
  const arrived = ctx.deliveries.find((d) => d.status === 'ARRIVED');
  if (arrived) groups.push(Parked('supplier-van', 'van', 8, 21.6, 'x+'));
  hotspots.push({ id: 'supplier-van', rect: [4, 20.6, 9, 4.4], tagAt: [8, 21.6, 2.6] });
  if (ctx.deliveries.length) pins.push({ key: 'curb', at: [8, 21.4, 0.1], tone: 'primary', tab: 'deliveries' });

  [[1, 1.2], [31.5, 1.0], [31.8, 10], [1.2, 12], [31.6, 17.5], [1.2, 18.4]].forEach(([x, z]) => groups.push({ id: null, parts: Tree(x, z) }));

  const onTheWay = ctx.deliveries.filter((d) => d.status === 'IN_TRANSIT').slice(0, 2);
  const movers: IsoMoverType[] = [
    ...onTheWay.map((d, i) => ({
      key: `van-${d.number}`,
      path: [[-5, LANE_Z], [39, LANE_Z]] as XZType[],
      mode: 'wrap' as const,
      speed: 3.6,
      offset: Spread(i, onTheWay.length) + 0.3,
      build: (dir: DirType) => Vehicle('van', dir),
      select: { kind: 'delivery' as const, number: d.number },
      tag: { short: d.number, text: `${d.supplierName} · on the way`, tone: 'info' as const },
      tagY: 2.8,
    })),
    ...team.slice(0, WALKS.length).map((color, i) => ({ key: `staff-${i}`, path: WALKS[i], speed: 1.1, offset: Spread(i, team.length), build: () => Person(color) })),
  ];

  return { size: SIZE, label: 'Café: counter, coffee machine and till, storage at the back, tables and the street', ground, groups, movers, hotspots, pins, links: {}, owners: {} };
};
