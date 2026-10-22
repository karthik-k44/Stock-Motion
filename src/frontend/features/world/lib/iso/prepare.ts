import type { BoxType, IsoMoverType, IsoPinType, IsoSceneType, XZType } from '../../types';
import { Faces, FloorRect, Projector, RotateBox, RotatePoint, RotateSize, ShadowOf, SortGroups, type PolyType, type ProjectorType } from './project';

const EPS = 1e-6;

const inside = (a: BoxType, b: BoxType) => a.x >= b.x - EPS && a.x + a.w <= b.x + b.w + EPS && a.z >= b.z - EPS && a.z + a.d <= b.z + b.d + EPS;
const front = (b: BoxType) => b.x + b.w + b.z + b.d;

/**
 * Painter's order for the boxes of one object, tuned on the reference design's details:
 * 1. wholly behind on x or z, or wholly below → first;
 * 2. a detail inside another box (shutter in a door opening) → after it;
 * 3. a post standing through a shelf deck (inside its footprint, taller) → after it;
 * 4. otherwise the one reaching further toward the viewer → after.
 */
export const PaintOrder = (a: BoxType, b: BoxType): number => {
  if (a.x + a.w <= b.x + EPS || a.z + a.d <= b.z + EPS) return -1;
  if (b.x + b.w <= a.x + EPS || b.z + b.d <= a.z + EPS) return 1;
  if (a.y + a.h <= b.y + EPS) return -1;
  if (b.y + b.h <= a.y + EPS) return 1;
  const aInB = inside(a, b) && a.y >= b.y - EPS && a.y + a.h <= b.y + b.h + EPS;
  const bInA = inside(b, a) && b.y >= a.y - EPS && b.y + b.h <= a.y + a.h + EPS;
  if (aInB !== bInA) return aInB ? 1 : -1;
  if (inside(a, b) && a.y + a.h > b.y + b.h + EPS) return 1;
  if (inside(b, a) && b.y + b.h > a.y + a.h + EPS) return -1;
  return front(a) - front(b) || a.x + a.w / 2 + a.z + a.d / 2 - (b.x + b.w / 2 + b.z + b.d / 2);
};

export type PreparedGroupType = { key: number; id: string | null; polys: PolyType[] };
export type PreparedHotspotType = { id: string; ring: string; tag: [number, number] };
export type PreparedPinType = IsoPinType & { point: [number, number] };

export type PreparedSceneType = {
  proj: ProjectorType;
  size: XZType;
  ground: PolyType[];
  groups: PreparedGroupType[];
  hotspots: PreparedHotspotType[];
  pins: PreparedPinType[];
  /** Paths turned with the scene; poses are worked out every frame */
  movers: IsoMoverType[];
};

/** The scene turned by `turns` quarter turns and projected: everything static is computed once here. */
export const PrepareScene = (scene: IsoSceneType, turns: number): PreparedSceneType => {
  const size = RotateSize(scene.size, turns);
  const proj = Projector(size);
  const turn = (b: BoxType) => RotateBox(b, turns, scene.size);
  const point = (p: [number, number, number]): [number, number] => {
    const [x, z] = RotatePoint([p[0], p[1]], turns, scene.size);
    return proj.pt(x, z, p[2]);
  };

  const ground = scene.ground.map(turn).flatMap((b) => Faces(b, proj.pt));
  const sorted = SortGroups(scene.groups.map((g) => ({ id: g.id, parts: g.parts.map(turn) })));
  sorted.forEach((g) => {
    const shadow = ShadowOf(g, proj.pt);
    if (shadow) ground.push(shadow);
  });
  const groups = sorted.map((g) => ({ key: g.key, id: g.id, polys: [...g.parts].sort(PaintOrder).flatMap((b) => Faces(b, proj.pt)) }));

  const hotspots = scene.hotspots.map((h) => {
    const r = turn({ x: h.rect[0], z: h.rect[1], w: h.rect[2], d: h.rect[3], h: 0, y: 0, c: '' });
    return { id: h.id, ring: FloorRect(r.x, r.z, r.w, r.d, 0.5, proj.pt), tag: point(h.tagAt) };
  });
  const pins = scene.pins.map((p) => ({ ...p, point: point(p.at) }));
  const movers = scene.movers.map((m) => ({ ...m, path: m.path.map((p) => RotatePoint(p, turns, scene.size)) }));

  return { proj, size, ground, groups, hotspots, pins, movers };
};
