import type { BoxType, DirType, IsoGroupType, IsoHotspotType, IsoMoverType, IsoPinType, IsoSceneType, WorldContextType, WorldSelectionType, XZType } from '../../types';
import { B, Carton, Door, Parked, Person, PersonAt, Rack, Split, Tree, Vehicle, WallX, WallZ } from '../iso/kit';
import { OpenIn } from '../world-stats';
import { DockDoors, OutSlots, PackedOrders, Spread, ZoneRows } from './scene-data';

const SIZE: XZType = [50, 37];
const RACK_X = [9.5, 16.5, 23.5, 30.5];
const RACK_W = 6;
const DOOR_X = [11, 18, 25, 36];
const LANE_Z = 33.4;

/** Where the team works: aisle walkways, the packing area, the dock apron. */
const WALKS: XZType[][] = [
  [[8, 9.6], [35, 9.6]],
  [[34.8, 9.6], [34.8, 19.5], [8.5, 19.5]],
  [[14.6, 8.5], [14.6, 19]],
  [[36.6, 13], [36.6, 20.5], [42.5, 20.5]],
  [[21.6, 19], [21.6, 8.6]],
  [[28.6, 8.6], [28.6, 19.2]],
];

/** The shelf-tag spot of a slot on a rack, for its drop pin. */
const slotPoint = (x: number, rows: number, bins: number, level: number, bin: number): [number, number, number] => {
  const binW = (RACK_W - 0.2) / bins;
  const lh = rows > 3 ? 0.9 : 1.1;
  return [x + 0.17 + bin * binW + binW / 2, 7.55, 0.18 + level * lh + 0.25];
};

/** The warehouse from the reference design, every rack, door, truck and carton taken from the business's records. */
export const RetailScene = (ctx: WorldContextType, team: string[]): IsoSceneType => {
  const ground: BoxType[] = [B(0, 0, 50, 37, 0.7, 'ground', -0.7), B(0, 0, 5.2, 23, 0.06, 'grass'), B(0, 23, 50, 9, 0.04, 'yard'), B(0, 32, 50, 5, 0.05, 'road')];
  for (let i = 0; i < 13; i++) ground.push(B(1 + i * 3.9, 34.35, 1.8, 0.18, 0.06, 'dash'));
  ground.push(B(6, 3, 40, 19, 0.16, 'floor'));
  DOOR_X.forEach((dx) => ground.push(B(dx - 0.9, 22.8, 0.12, 6.2, 0.06, 'line'), B(dx + 3.8, 22.8, 0.12, 6.2, 0.06, 'line'), B(dx - 0.9, 28.9, 4.82, 0.12, 0.06, 'line')));
  for (let i = 0; i < 5; i++) ground.push(B(7 + i * 1.4, 30.3, 0.9, 0.9, 0.05, i % 2 ? 'yard' : 'line'));

  const groups: IsoGroupType[] = [...WallX(6, 46, 3, 3.6, 0.4), ...WallZ(6, 3.4, 22, 3.6, 0.4)];
  const hotspots: IsoHotspotType[] = [];
  const pins: IsoPinType[] = [];
  const links: Record<string, WorldSelectionType> = {};
  const owners: Record<string, string> = {};

  // Racks: one per storage zone, each slot coloured by what the business really keeps there.
  ctx.template.zones.slice(0, 8).forEach((zone, i) => {
    const x = RACK_X[i % 4];
    const z = i < 4 ? 6.2 : 12.4;
    const rows = ZoneRows(ctx, zone.code);
    const id = `rack-${zone.code}`;
    groups.push(Rack(id, x, z, rows, RACK_W));
    hotspots.push({ id, rect: [x, z, RACK_W, 1.35], tagAt: [x + 3, z + 0.7, rows.length * 1.1 + 0.8] });
    OutSlots(rows)
      .slice(0, 2)
      .forEach(([l, b]) => {
        const [px, pz, py] = slotPoint(x, rows.length, zone.bins, l, b);
        pins.push({ key: `${id}-${l}-${b}`, at: [px, pz + (z - 6.2), py], tone: 'critical', tab: 'alerts' });
      });
  });

  // Packing bench: a carton per order being picked, a pallet stack per order packed.
  const picking = Math.min(3, OpenIn(ctx, (s) => s.consumeLines));
  const packed = PackedOrders(ctx);
  const bench: BoxType[] = [B(37.5, 13.5, 4.2, 1.5, 0.95, 'bench')];
  [[37.9, 1.0, 0.6], [39.2, 0.8, 0.45], [40.4, 0.9, 0.55]].slice(0, picking).forEach(([x, w, h]) => bench.push(...Carton(x, 13.8, w, 0.9, h, 0.95)));
  bench.push(B(38, 16.6, 2.2, 2.2, 0.22, 'pallet'));
  [[38.15, 16.75, 0.8], [39.15, 16.75, 0.65], [38.15, 17.75, 0.7], [39.15, 17.75, 0.85]].slice(0, Math.min(4, packed.length)).forEach(([x, z, h]) => bench.push(...Carton(x, z, 0.95, 0.95, h, 0.22)));
  groups.push({ id: 'packing', parts: bench });
  const packer = picking && team.length ? team[0] : null;
  if (packer) groups.push({ id: 'packing', parts: PersonAt(40.5, 15.8, packer) });
  hotspots.push({ id: 'packing', rect: [37.5, 13.5, 4.2, 5.3], tagAt: [39.6, 15.5, 2.4] });
  if (ctx.orders.length) pins.push({ key: 'packing', at: [39.6, 14.2, 1.2], tone: 'primary', tab: 'orders' });

  // Front wall with four dock doors.
  [[6, 10.82], [14.18, 17.82], [21.18, 24.82], [28.18, 35.82], [39.18, 46]].forEach(([a, c]) => groups.push(...WallX(a, c, 21.6, 3.6, 0.4)));
  DOOR_X.forEach((dx) => groups.push({ id: null, parts: [B(dx, 21.6, 3, 0.4, 1.0, 'wall', 2.6), B(dx, 21.58, 3, 0.48, 0.32, 'orange', 3.6)] }));
  groups.push({ id: null, parts: Split(46, 3.4, 0.4, 18.6, 3.6, 'wall', 0, 2.2) });

  // Doors 1–3 show the next deliveries; a delivery that has arrived has its truck backed in and pallets staged.
  DockDoors(ctx).forEach((d, i) => {
    const id = `door-${i + 1}`;
    const dx = DOOR_X[i];
    const arrived = d?.status === 'ARRIVED';
    const staged = arrived ? [B(dx + 0.4, 21.55, 2.2, 0.4, 0.2, 'pallet'), ...Carton(dx + 0.5, 21.55, 1.0, 0.4, 0.75, 0.2), ...Carton(dx + 1.6, 21.55, 0.9, 0.4, 0.6, 0.2)] : [];
    groups.push(Door(id, dx, 22, staged));
    if (arrived) groups.push(Parked(id, 'truck', dx + 1.5, 26.9, 'z+'));
    hotspots.push({ id, rect: [dx - 0.9, 22.8, 4.82, 6.2], tagAt: [dx + 1.5, 22.4, 4.4] });
    if (d) {
      links[id] = { kind: 'delivery', number: d.number };
      owners[`delivery:${d.number}`] = id;
    }
  });
  const next = DockDoors(ctx).findIndex(Boolean);
  if (next >= 0) pins.push({ key: 'next-door', at: [DOOR_X[next] + 1.5, 26, 0.1], tone: 'primary', tab: 'deliveries' });

  // Door 4 is outbound: the van is backed in while orders are packed and waiting.
  const loading = packed[0];
  groups.push(Door('door-4', 36, 22, loading ? [B(36.4, 21.55, 2.2, 0.4, 0.2, 'pallet'), ...Carton(36.5, 21.55, 1.0, 0.4, 0.75, 0.2), ...Carton(37.6, 21.55, 0.9, 0.4, 0.6, 0.2)] : []));
  if (loading) {
    groups.push(Parked('door-4', 'van', 37.5, 25.6, 'z+'));
    links['door-4'] = { kind: 'order', number: loading.number };
    packed.forEach((o) => (owners[`order:${o.number}`] = 'door-4'));
  }
  hotspots.push({ id: 'door-4', rect: [35.1, 22.8, 4.82, 6.2], tagAt: [37.5, 22.4, 4.4] });

  [[10.4, 22.5], [14.5, 22.5], [17.4, 22.5], [21.5, 22.5], [24.4, 22.5], [28.5, 22.5], [35.4, 22.5], [39.5, 22.5]].forEach(([x, z]) => groups.push({ id: null, parts: [B(x, z, 0.3, 0.3, 0.9, 'bollard')] }));
  [[1.2, 2.5], [1.6, 9], [1.2, 15.5], [47.2, 4], [47.4, 12], [47.0, 24.5], [2, 25.2]].forEach(([x, z]) => groups.push({ id: null, parts: Tree(x, z) }));

  // Trucks on their way drive the road; the team walks the floor, one person per member, in their colour.
  const onTheWay = ctx.deliveries.filter((d) => d.status === 'IN_TRANSIT').slice(0, 2);
  const movers: IsoMoverType[] = [
    ...onTheWay.map((d, i) => ({
      key: `truck-${d.number}`,
      path: [[-6, LANE_Z], [56, LANE_Z]] as XZType[],
      mode: 'wrap' as const,
      speed: 3.2,
      offset: Spread(i, onTheWay.length) + 0.2,
      build: (dir: DirType) => Vehicle('truck', dir),
      select: { kind: 'delivery', number: d.number } as WorldSelectionType,
      tag: { short: d.number, text: `on the way · ${d.totalExpected} units`, tone: 'info' as const },
      tagY: 3.4,
    })),
    ...team
      .slice(packer ? 1 : 0)
      .slice(0, WALKS.length)
      .map((color, i) => ({ key: `walker-${i}`, path: WALKS[i], speed: 1.3, offset: Spread(i, team.length), build: () => Person(color) })),
  ];
  hotspots.push({ id: 'road', rect: [0, 32, 50, 5], tagAt: [46.5, 34.2, 1.4] });

  return { size: SIZE, label: 'Warehouse: storage aisles, dock doors, the packing area and the yard', ground, groups, movers, hotspots, pins, links, owners };
};
