import type { DirType, IsoMoverType, XZType } from '../../types';

export type MoverPoseType = { x: number; z: number; dir: DirType };

const dirOf = (a: XZType, b: XZType, reverse: boolean): DirType => {
  const dx = (b[0] - a[0]) * (reverse ? -1 : 1);
  const dz = (b[1] - a[1]) * (reverse ? -1 : 1);
  return Math.abs(dx) >= Math.abs(dz) ? (dx >= 0 ? 'x+' : 'x-') : dz >= 0 ? 'z+' : 'z-';
};

export const PathLength = (path: XZType[]) => path.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - path[i][0], p[1] - path[i][1]), 0);

/**
 * Where a mover is after `seconds`: vehicles (`wrap`) drive off one edge and come back from the other,
 * people (`bounce`) walk their path there and back.
 */
export const PoseAt = (m: IsoMoverType, seconds: number): MoverPoseType => {
  const { path } = m;
  if (path.length < 2) return { x: path[0]?.[0] ?? 0, z: path[0]?.[1] ?? 0, dir: 'x+' };
  const length = PathLength(path) || 1;
  const travelled = m.offset * length * (m.mode === 'wrap' ? 1 : 2) + seconds * m.speed;
  let s = m.mode === 'wrap' ? travelled % length : travelled % (2 * length);
  const reverse = m.mode !== 'wrap' && s > length;
  if (reverse) s = 2 * length - s;
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1];
    const [bx, bz] = path[i];
    const seg = Math.hypot(bx - ax, bz - az);
    if (s <= seg || i === path.length - 1) {
      const t = seg ? Math.min(1, s / seg) : 0;
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, dir: dirOf(path[i - 1], path[i], reverse) };
    }
    s -= seg;
  }
  const last = path[path.length - 1];
  return { x: last[0], z: last[1], dir: 'x+' };
};
