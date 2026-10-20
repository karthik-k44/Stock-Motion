import { Cn } from '@/frontend/lib/utils';
import type { PreparedSceneType } from '../lib/iso/prepare';
import { TONE_CLASSES } from '../lib/tones';
import type { DirType, WorldContextType, WorldObjectSpecType, WorldSelectionType, WorldToneType, WorldTrackerTabType } from '../types';

type Props = {
  prepared: PreparedSceneType;
  objects: WorldObjectSpecType[];
  ctx: WorldContextType;
  poses: Record<string, { dir: DirType; x: number; z: number }>;
  highlighted: string | null;
  tab: WorldTrackerTabType;
  tags: boolean;
  compact: boolean;
  zoom: number;
  /** Mover tags register here; the scene moves them every frame */
  tagEls: Map<string, HTMLElement>;
  onPick: (id: string) => void;
  onSelect: (selection: WorldSelectionType) => void;
};

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

type TagProps = {
  short: string;
  text: string;
  tone: WorldToneType;
  selected: boolean;
  focus: boolean;
  compact: boolean;
  label: string;
  onClick: () => void;
};

/** A pill above an object: its short name on a status-coloured chip, then what its records say right now. */
const Tag = ({ short, text, tone, selected, focus, compact, label, onClick }: TagProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={selected}
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => (e.stopPropagation(), onClick())}
    className={Cn('iso-tag group flex -translate-x-1/2 -translate-y-full cursor-pointer flex-col items-center p-0 outline-none', focus && 'iso-tag-focus')}
  >
    <span
      className={Cn(
        'flex items-center gap-1.5 rounded-full border py-1 pl-1 text-[11.5px] leading-tight font-semibold whitespace-nowrap shadow-float transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring',
        compact ? 'pr-1' : 'pr-2.5',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-line bg-white text-ink hover:border-primary-300',
      )}
    >
      <span className={Cn('rounded-full px-2 py-0.5 text-[11px] font-bold', selected ? 'bg-white text-primary-800' : TONE_CLASSES[tone].solid)}>{short}</span>
      {!compact && <span>{text}</span>}
    </span>
    <span className={Cn('h-3 w-0.5', selected ? 'bg-primary' : 'bg-primary/60')} aria-hidden />
  </button>
);

/** Live tags over the scene (objects and moving vehicles) and the drop pins of the open tracker tab. */
export const SceneTags = ({ prepared, objects, ctx, poses, highlighted, tab, tags, compact, zoom, tagEls, onPick, onSelect }: Props) => {
  const { proj } = prepared;
  // Tags keep their size while the scene is zoomed.
  const keep = { transform: `scale(${1 / zoom})`, transformOrigin: '0 0' };
  return (
    <div className="pointer-events-none absolute inset-0">
      {prepared.pins
        .filter((p) => p.tab === tab)
        .map((p) => (
          <span key={`${p.key}-${tab}`} className="absolute" style={{ left: pct(p.point[0], proj.W), top: pct(p.point[1], proj.H), ...keep }} aria-hidden>
            <span className="block -translate-x-1/2 -translate-y-full">
              <svg className={Cn('iso-pin', p.tone === 'critical' ? 'text-danger' : 'text-primary')} width="30" height="40" viewBox="0 0 34 44">
                <path d="M17 43c0 0 15-15.5 15-26.5A15 15 0 0 0 2 16.5C2 27.5 17 43 17 43z" fill="currentColor" stroke="#fff" strokeWidth="2.5" />
                <circle cx="17" cy="16.5" r="5.5" fill="#fff" />
              </svg>
            </span>
          </span>
        ))}
      {tags &&
        prepared.hotspots.map((h) => {
          const spec = objects.find((o) => o.id === h.id);
          if (!spec) return null;
          const tag = spec.tag(ctx);
          return (
            <span key={`${h.id}-${tab}`} className="pointer-events-auto absolute" style={{ left: pct(h.tag[0], proj.W), top: pct(h.tag[1], proj.H), ...keep }}>
              <Tag
                short={spec.short}
                text={tag.text}
                tone={tag.tone}
                selected={highlighted === h.id}
                focus={Boolean(spec.tabs?.includes(tab))}
                compact={compact}
                label={`${spec.label}: ${tag.text}`}
                onClick={() => onPick(h.id)}
              />
            </span>
          );
        })}
      {tags &&
        prepared.movers.map((m) => {
          const pose = poses[m.key];
          if (!m.tag || !pose) return null;
          const [x, y] = proj.pt(pose.x, pose.z, m.tagY ?? 2.6);
          return (
            <span
              key={m.key}
              ref={(el) => void (el ? tagEls.set(m.key, el) : tagEls.delete(m.key))}
              className="pointer-events-auto absolute"
              style={{ left: pct(x, proj.W), top: pct(y, proj.H), ...keep }}
            >
              <Tag
                short={m.tag.short}
                text={m.tag.text}
                tone={m.tag.tone}
                selected={false}
                focus={tab === 'deliveries'}
                compact={compact}
                label={`${m.tag.short}: ${m.tag.text}`}
                onClick={() => m.select && onSelect(m.select)}
              />
            </span>
          );
        })}
    </div>
  );
};
