import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Clamp } from '@/frontend/lib/utils';
import { PoseAt } from '../lib/iso/movers';
import { PrepareScene, PaintOrder, type PreparedGroupType } from '../lib/iso/prepare';
import { Faces, type PolyType } from '../lib/iso/project';
import { MAX_ZOOM } from '../lib/view';
import type { DirType, InsetsType, IsoSceneType, ViewType, WorldContextType, WorldObjectSpecType, WorldSelectionType, WorldTrackerTabType } from '../types';
import { SceneTags } from './SceneTags';

type Props = {
  scene: IsoSceneType;
  objects: WorldObjectSpecType[];
  ctx: WorldContextType;
  view: ViewType;
  onView: (view: ViewType) => void;
  /** The object to ring: the selected one, or the one holding the selected record */
  highlighted: string | null;
  tab: WorldTrackerTabType;
  tags: boolean;
  compact: boolean;
  animate: boolean;
  /** Space the floating panels cover; the scene is fitted into what is left */
  insets: InsetsType;
  onSelect: (selection: WorldSelectionType) => void;
  onClear: () => void;
};

type PoseStateType = Record<string, { dir: DirType; slot: number; x: number; z: number }>;

const DRAG_PX = 4;

const Polys = ({ polys }: { polys: PolyType[] }) => (
  <>
    {polys.map((p, i) => (
      <polygon key={i} points={p.points} fill={p.fill} stroke={p.stroke} strokeWidth={0.6} strokeLinejoin="round" />
    ))}
  </>
);

/** One object's boxes. Memoised: the static scene never re-renders while trucks and people move. */
const StaticGroup = memo(({ group, onPick }: { group: PreparedGroupType; onPick: (id: string) => void }) =>
  group.id ? (
    <g className="cursor-pointer" onClick={(e) => (e.stopPropagation(), onPick(group.id!))}>
      <Polys polys={group.polys} />
    </g>
  ) : (
    <g>
      <Polys polys={group.polys} />
    </g>
  ),
);
StaticGroup.displayName = 'StaticGroup';

/** Index of the first static group in front of a point on the floor, so a mover is drawn between the right objects. */
const slotOf = (groups: PreparedGroupType[], key: number) => {
  const i = groups.findIndex((g) => g.key > key);
  return i < 0 ? groups.length : i;
};

/**
 * The business drawn as an isometric scene (the reference design's renderer): flat-shaded boxes in painter's order,
 * soft shadows, rings, live tags and pins. Trucks and people move every frame without re-rendering the static scene.
 */
export const IsoScene = ({ scene, objects, ctx, view, onView, highlighted, tab, tags, compact, animate, insets, onSelect, onClear }: Props) => {
  const prepared = useMemo(() => PrepareScene(scene, view.turns), [scene, view.turns]);
  const { proj, groups, movers } = prepared;
  const host = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const moverEls = useRef(new Map<string, SVGGElement>());
  const tagEls = useRef(new Map<string, HTMLElement>());
  const clock = useRef(performance.now());
  const drag = useRef<{ x: number; y: number; pan: [number, number]; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fit the picture into the free area between the panels.
  const freeW = Math.max(160, box.w - insets.left - insets.right);
  const freeH = Math.max(120, box.h - insets.top - insets.bottom);
  const fit = Math.min(freeW / proj.W, freeH / proj.H) || 0;
  const width = proj.W * fit;
  const height = proj.H * fit;
  const left = insets.left + (freeW - width) / 2;
  const top = insets.top + (freeH - height) / 2;

  // Movers: where they are now, and which objects they are drawn between.
  const initialPoses = useCallback((): PoseStateType => {
    const t = animate ? (performance.now() - clock.current) / 1000 : 0;
    return Object.fromEntries(movers.map((m) => {
      const p = PoseAt(m, t);
      return [m.key, { ...p, slot: slotOf(groups, p.x + p.z) }];
    }));
  }, [movers, groups, animate]);
  const [poses, setPoses] = useState<PoseStateType>(initialPoses);
  useEffect(() => setPoses(initialPoses()), [initialPoses]);

  const shapes = useMemo(() => {
    const cache = new Map<string, PolyType[]>();
    return (key: string, dir: DirType) => {
      const id = `${key}:${dir}`;
      if (!cache.has(id)) cache.set(id, [...(movers.find((m) => m.key === key)?.build(dir) ?? [])].sort(PaintOrder).flatMap((b) => Faces(b, proj.pt)));
      return cache.get(id)!;
    };
  }, [movers, proj]);

  const posesNow = useRef(poses);
  posesNow.current = poses;

  // Every frame: move each mover's <g> and tag directly; re-render only when one turns a corner or passes an object.
  useEffect(() => {
    if (!movers.length || !animate) return;
    let frame = 0;
    const step = (now: number) => {
      const t = (now - clock.current) / 1000;
      let next: PoseStateType | null = null;
      for (const m of movers) {
        const p = PoseAt(m, t);
        const [dx, dy] = proj.delta(p.x, p.z);
        moverEls.current.get(m.key)?.setAttribute('transform', `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`);
        const tag = tagEls.current.get(m.key);
        if (tag) {
          const [tx, ty] = proj.pt(p.x, p.z, m.tagY ?? 2.6);
          tag.style.left = `${((tx / proj.W) * 100).toFixed(3)}%`;
          tag.style.top = `${((ty / proj.H) * 100).toFixed(3)}%`;
        }
        const slot = slotOf(groups, p.x + p.z);
        const was = posesNow.current[m.key];
        if (!was || was.dir !== p.dir || was.slot !== slot) next = { ...(next ?? posesNow.current), [m.key]: { ...p, slot } };
      }
      if (next) setPoses(next);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [movers, groups, proj, animate]);

  const pick = useCallback(
    (id: string) => {
      if (drag.current?.moved) return;
      onSelect(scene.links[id] ?? { kind: 'object', id });
    },
    [onSelect, scene.links],
  );

  // Drag to pan, Ctrl/⌘ + wheel (or a trackpad pinch) to zoom.
  const clampPan = (x: number, y: number, zoom: number): [number, number] => {
    const mx = (width * (zoom - 1)) / 2 + 60;
    const my = (height * (zoom - 1)) / 2 + 60;
    return [Clamp(x, -mx, mx), Clamp(y, -my, my)];
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, pan: view.pan, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_PX) return;
    if (!d.moved) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    d.moved = true;
    setDragging(true);
    onView({ ...view, pan: clampPan(d.pan[0] + dx, d.pan[1] + dy, view.zoom) });
  };
  const onPointerUp = () => {
    setDragging(false);
    // Let this click be ignored by `pick`, then forget the drag.
    window.setTimeout(() => (drag.current = null), 0);
  };
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const zoom = Clamp(view.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 1, MAX_ZOOM);
      onView({ ...view, zoom, pan: zoom === 1 ? [0, 0] : view.pan });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [view, onView]);

  const rings = prepared.hotspots.flatMap((h): { key: string; points: string; kind: 'on' | 'alert' }[] => {
    if (h.id === highlighted) return [{ key: h.id, points: h.ring, kind: 'on' }];
    const spec = objects.find((o) => o.id === h.id);
    return spec?.alert?.(ctx) ? [{ key: h.id, points: h.ring, kind: 'alert' }] : [];
  });

  const renderMover = (key: string) => {
    const pose = poses[key];
    if (!pose) return null;
    const m = movers.find((x) => x.key === key)!;
    const [dx, dy] = proj.delta(pose.x, pose.z);
    return (
      <g
        key={key}
        ref={(el) => void (el ? moverEls.current.set(key, el) : moverEls.current.delete(key))}
        transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)})`}
        className={m.select ? 'cursor-pointer' : undefined}
        onClick={m.select ? (e) => (e.stopPropagation(), !drag.current?.moved && onSelect(m.select!)) : undefined}
      >
        <Polys polys={shapes(key, pose.dir)} />
      </g>
    );
  };
  const bySlot = new Map<number, string[]>();
  movers.forEach((m) => {
    const slot = poses[m.key]?.slot ?? groups.length;
    bySlot.set(slot, [...(bySlot.get(slot) ?? []), m.key]);
  });

  return (
    <div
      ref={host}
      className={dragging ? 'iso-host cursor-grabbing' : 'iso-host cursor-grab'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={() => !drag.current?.moved && onClear()}
    >
      <div
        className={dragging ? 'iso-camera' : 'iso-camera iso-camera-ease'}
        style={{ left, top, width, height, transform: `translate(${view.pan[0]}px, ${view.pan[1]}px) scale(${view.zoom})` }}
      >
        <svg key={view.turns} viewBox={`0 0 ${proj.W} ${proj.H}`} className="iso-svg" role="img" aria-label={`${scene.label}. Every label is live data.`}>
          <Polys polys={prepared.ground} />
          {rings.map((r) => (
            <polygon
              key={r.key}
              points={r.points}
              className={r.kind === 'on' ? 'iso-ring-on' : tab === 'alerts' ? 'iso-ring-alert iso-ring-march' : 'iso-ring-alert'}
            />
          ))}
          {groups.map((g, i) => [
            ...(bySlot.get(i) ?? []).map(renderMover),
            <StaticGroup key={`g${i}`} group={g} onPick={pick} />,
          ])}
          {(bySlot.get(groups.length) ?? []).map(renderMover)}
        </svg>
        <SceneTags
          prepared={prepared}
          objects={objects}
          ctx={ctx}
          poses={poses}
          highlighted={highlighted}
          tab={tab}
          tags={tags}
          compact={compact}
          zoom={view.zoom}
          tagEls={tagEls.current}
          onPick={pick}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
};
