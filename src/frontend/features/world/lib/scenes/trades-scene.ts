import type { BoxType, DirType, IsoGroupType, IsoHotspotType, IsoMoverType, IsoPinType, IsoSceneType, WorldContextType, XZType } from '../../types';
import { B, Carton, House, Parked, Person, Rack, Tree, Vehicle, WallX, WallZ } from '../iso/kit';
import { OpenCount } from '../world-stats';
import { OutSlots, Spread, ZoneRows, ZoneStacks } from './scene-data';

const SIZE: XZType = [40, 28];
const LOTS: XZType[] = [[27, 3.5], [33.5, 4.2], [27.5, 12.5], [33.8, 13.2]];
const WALLS = ['cream', 'sky', 'mint', 'pink'];
const STACK = { ok: 'carton', low: 'low', out: 'out', empty: 'deck' } as const;
/** Down the side road and out along the main road. */
const VAN_ROUTE: XZType[] = [[23.3, -5], [23.3, 26.3], [45, 26.3]];
const LANE_Z = 26.3;
const WALKS: XZType[][] = [
  [[3.4, 6.2], [12, 6.2]],
  [[9, 9.5], [13.5, 9.5], [13.5, 14]],
  [[20.8, 4], [20.8, 16]],
];

/** The trades depot from the reference design: shelves, site store, office, two vans and today's job sites. */
export const TradesScene = (ctx: WorldContextType, team: string[]): IsoSceneType => {
  const ground: BoxType[] = [B(0, 0, 40, 28, 0.8, 'ground', -0.8), B(22, 0, 2.6, 25, 0.04, 'road'), B(0, 25, 40, 2.6, 0.04, 'road'), B(2, 3, 18, 12, 0.15, 'concrete'), B(20, 3, 2, 14, 0.06, 'concrete')];
  for (let i = 0; i < 7; i++) ground.push(B(23.2, 1 + i * 3.4, 0.16, 1.4, 0.06, 'dash'));
  const groups: IsoGroupType[] = [...WallX(2, 20, 3, 2.8, 0.35), ...WallZ(2, 3.35, 15, 2.8, 0.35)];
  const hotspots: IsoHotspotType[] = [];
  const pins: IsoPinType[] = [];

  const depot = ZoneRows(ctx, 'DEPOT');
  groups.push(Rack('depot', 4, 4, depot, 6.6));
  hotspots.push({ id: 'depot', rect: [4, 4, 6.6, 1.35], tagAt: [7.3, 4.7, depot.length * 1.1 + 0.8] });
  OutSlots(depot)
    .slice(0, 2)
    .forEach(([l, b]) => pins.push({ key: `depot-${l}-${b}`, at: [4.17 + b * 2.13 + 1.06, 5.35, 0.43 + l * 1.1], tone: 'critical', tab: 'alerts' }));

  // Site store: one pallet stack per item kept there.
  const stacks = ZoneStacks(ctx, 'SITE', 6);
  const site: BoxType[] = [];
  stacks.forEach((s, i) => {
    const x = 3 + (i % 3) * 2.2;
    const z = 10.5 + Math.floor(i / 3) * 2.2;
    site.push(B(x, z, 1.8, 1.8, 0.2, 'pallet'), ...Carton(x + 0.15, z + 0.15, 1.5, 1.5, s === 'out' ? 0.15 : s === 'low' ? 0.5 : 1.0, 0.2, STACK[s]));
  });
  if (!stacks.length) site.push(B(3, 10.5, 1.8, 1.8, 0.2, 'pallet'));
  groups.push({ id: 'site', parts: site });
  hotspots.push({ id: 'site', rect: [3, 10.5, 6.6, 4.0], tagAt: [6.3, 12.5, 2.3] });
  if (stacks.includes('out')) pins.push({ key: 'site', at: [6.3, 14.5, 1.2], tone: 'critical', tab: 'alerts' });

  groups.push({
    id: 'office',
    parts: [B(14.5, 8, 4.5, 4, 2.4, 'white'), B(15.1, 11.97, 1.6, 0.08, 0.8, 'glow', 1.0), B(17.5, 11.97, 0.8, 0.08, 1.5, 'woodDark'), B(14.3, 7.8, 4.9, 4.4, 0.35, 'orange', 2.4), B(14.9, 8.4, 3.7, 3.2, 0.25, 'rust', 2.75)],
  });
  hotspots.push({ id: 'office', rect: [14.5, 8, 4.5, 4], tagAt: [16.7, 10, 3.4] });

  // Job sites: a house for every job booked or under way; scaffolding on the ones being worked on.
  const doing = OpenCount(ctx, 'IN_PROGRESS');
  const booked = OpenCount(ctx, 'SCHEDULED');
  LOTS.slice(0, Math.min(LOTS.length, doing + booked)).forEach(([x, z], i) => groups.push({ id: 'sites', parts: House(x, z, WALLS[i], i < doing) }));
  hotspots.push({ id: 'sites', rect: [26.5, 3, 11.5, 14], tagAt: [32, 9.5, 3.9] });
  if (doing + booked) pins.push({ key: 'sites', at: [29, 8.4, 0.1], tone: 'primary', tab: 'orders' });

  // Van 1 is parked at the first job while one is in progress, otherwise at the depot; Van 2 drives out to booked jobs.
  if (doing) groups.push(Parked('van1', 'van', 30, 8.6, 'z+'));
  else groups.push(Parked('van1', 'van', 21, 6.5, 'z+'));
  hotspots.push(doing ? { id: 'van1', rect: [29, 6.2, 2, 4.7], tagAt: [30, 8.6, 2.6] } : { id: 'van1', rect: [20, 4.2, 2, 4.7], tagAt: [21, 6.5, 2.6] });
  if (!booked) {
    groups.push(Parked('van2', 'vanDark', 21, 12.5, 'z+'));
    hotspots.push({ id: 'van2', rect: [20, 10.2, 2, 4.7], tagAt: [21, 12.5, 2.6] });
  }

  // Merchant deliveries: a truck that has arrived waits at the yard gate; one on the way drives the main road.
  const arrived = ctx.deliveries.find((d) => d.status === 'ARRIVED');
  if (arrived) groups.push(Parked('courier', 'truck', 11, 17.6, 'x+'));
  hotspots.push({ id: 'courier', rect: [0, 25, 40, 2.6], tagAt: [36.5, 26.3, 1.4] });
  if (ctx.deliveries.length) pins.push({ key: 'courier', at: [11, 19, 0.1], tone: 'primary', tab: 'deliveries' });

  [[38.3, 0.6], [38.4, 21], [26, 21.4], [1, 20.6], [14, 20.2], [1.2, 0.6]].forEach(([x, z]) => groups.push({ id: null, parts: Tree(x, z) }));

  const onTheWay = ctx.deliveries.filter((d) => d.status === 'IN_TRANSIT').slice(0, 2);
  const movers: IsoMoverType[] = [
    ...onTheWay.map((d, i) => ({
      key: `truck-${d.number}`,
      path: [[-6, LANE_Z], [46, LANE_Z]] as XZType[],
      mode: 'wrap' as const,
      speed: 3.2,
      offset: Spread(i, onTheWay.length) + 0.15,
      build: (dir: DirType) => Vehicle('truck', dir),
      select: { kind: 'delivery' as const, number: d.number },
      tag: { short: d.number, text: `${d.supplierName} · on the way`, tone: 'info' as const },
      tagY: 3.4,
    })),
    ...(booked
      ? [{ key: 'van2', path: VAN_ROUTE, mode: 'wrap' as const, speed: 3.6, offset: 0.1, build: (dir: DirType) => Vehicle('vanDark', dir), select: { kind: 'object' as const, id: 'van2' }, tag: { short: 'Van 2', text: `${booked} booked`, tone: 'info' as const }, tagY: 2.8 }]
      : []),
    ...team.slice(0, WALKS.length).map((color, i) => ({ key: `crew-${i}`, path: WALKS[i], speed: 1.2, offset: Spread(i, team.length), build: () => Person(color) })),
  ];

  return { size: SIZE, label: 'Depot: shelves, site store, office, two vans and the job sites', ground, groups, movers, hotspots, pins, links: {}, owners: {} };
};
