import gsap from 'gsap';
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMotion } from '@/frontend/hooks/use-motion';
import { ACCENT_TEXT, SCENE, SKETCH_HEIGHT, SKETCH_MARKS, SKETCH_PARCEL, SKETCH_TOP, SKETCH_WIDTH, STOPS, type SketchNote } from '../lib/inventory-sketch';
import { INK, type SketchStroke } from '../lib/sketch-pen';

const STOP_SECONDS = 2.2;
/** The pen has finished the drawing by now; the parcel starts its round. */
const DRAWN_SECONDS = 4;

/** Inks the sketch in when `ref` scrolls into view, then walks the parcel round. With motion off it stays a still drawing. */
export const useSketchRound = () => {
  const { reduced } = useMotion();
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const [stop, setStop] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!seen || reduced) return;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => setStop((s) => (s + 1) % STOPS.length), STOP_SECONDS * 1000);
    }, DRAWN_SECONDS * 1000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [seen, reduced]);

  return { ref, drawn: seen || reduced, stop };
};

const Strokes = ({ strokes, at = 0 }: { strokes: SketchStroke[]; at?: number }) => (
  <>
    {strokes.map((s, i) => (
      <path
        key={i}
        d={s.d}
        stroke={s.stroke}
        strokeWidth={s.width}
        strokeDasharray={s.dash}
        fill={s.fill}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={s.draws ? 1 : undefined}
        className={s.draws ? 'sketch-line' : 'sketch-fade'}
        style={{ animationDelay: `${at}s` }}
      />
    ))}
  </>
);

const Note = ({ note, at }: { note: SketchNote; at: number }) => (
  <text
    x={note.x}
    y={note.y}
    fill={note.color ?? INK}
    fontSize={note.size ?? 24}
    fontWeight={note.weight ?? 500}
    textAnchor={note.anchor ?? 'start'}
    transform={note.rotate ? `rotate(${note.rotate} ${note.x} ${note.y})` : undefined}
    className="sketch-note font-hand"
    style={{ animationDelay: `${at + 0.25}s` }}
  >
    {note.text}
  </text>
);

/** The drawing itself. It never changes, so the parcel's moves don't re-render a few thousand paths. */
const Drawing = memo(() => (
  <>
    {SCENE.map((part) => (
      <g key={part.name}>
        <Strokes strokes={part.strokes} at={part.at} />
        {part.notes?.map((note) => <Note key={note.text} note={note} at={part.at} />)}
      </g>
    ))}
  </>
));

/**
 * A hand-drawn sketch of how a company's stock works, as the background of its section: no frame, sized by the section's
 * height, with the ground running off both sides of the screen. One parcel makes the round from delivery to customer
 * while the laptop reports where it is. On a screen too narrow for the whole scene it pans along with the parcel.
 */
export const InventorySketch = ({ drawn, stop }: { drawn: boolean; stop: number }) => {
  const { reduced } = useMotion();
  const svg = useRef<SVGSVGElement>(null);
  const current = STOPS[stop];

  useLayoutEffect(() => {
    const el = svg.current;
    const frame = el?.parentElement;
    if (!el || !frame || reduced) return;
    const width = el.getBoundingClientRect().width;
    const room = Math.max(0, (width - frame.clientWidth) / 2);
    const x = gsap.utils.clamp(-room, room, width / 2 - (current.x / SKETCH_WIDTH) * width);
    const tween = gsap.to(el, { x, duration: 0.9, ease: 'power2.inOut' });
    return () => void tween.kill();
  }, [current.x, reduced]);

  return (
    <svg
      ref={svg}
      viewBox={`0 ${SKETCH_TOP} ${SKETCH_WIDTH} ${SKETCH_HEIGHT - SKETCH_TOP}`}
      role="img"
      aria-label="Hand-drawn sketch: a supplier's truck delivers stock to a warehouse, boxes are scanned in, counted on shelves, picked and packed for an order, then a van delivers them to the customer. Low shelves trigger a reorder and a laptop shows every step live."
      data-seen={drawn || undefined}
      style={{ aspectRatio: `${SKETCH_WIDTH} / ${SKETCH_HEIGHT - SKETCH_TOP}` }}
      className="inventory-sketch block h-full w-auto max-w-none flex-none overflow-visible"
    >
      <Drawing />
      {SKETCH_MARKS.map((mark, i) => {
        const s = STOPS[i];
        const active = i === stop;
        return (
          <g key={s.caption}>
            <Strokes strokes={mark} at={3.6} />
            <text x={s.x} y={SKETCH_PARCEL.y + 6} textAnchor="middle" fontSize={19} fontWeight={700} fill={ACCENT_TEXT} className="sketch-note font-hand" style={{ animationDelay: '3.7s' }}>
              {i + 1}
            </text>
            <text
              x={s.x}
              y={SKETCH_PARCEL.caption}
              textAnchor="middle"
              fontSize={25}
              fontWeight={active ? 700 : 500}
              fill={active ? ACCENT_TEXT : INK}
              className="sketch-note font-hand"
              style={{ animationDelay: '3.7s' }}
            >
              {s.caption}
            </text>
          </g>
        );
      })}
      <g className="sketch-note font-hand" style={{ animationDelay: '3.3s' }}>
        <text key={stop} x={1072} y={96} fontSize={26} fontWeight={700} fill={ACCENT_TEXT} className="sketch-status">
          {current.status}
        </text>
        <text key={`${stop}-detail`} x={1072} y={124} fontSize={19} fill={INK} className="sketch-status">
          {current.detail}
        </text>
      </g>
      <g className="sketch-parcel sketch-note" style={{ translate: `${current.x}px ${SKETCH_PARCEL.y - 14}px`, animationDelay: '3.8s' }}>
        <g key={stop} className="sketch-hop">
          <Strokes strokes={SKETCH_PARCEL.strokes} />
        </g>
      </g>
    </svg>
  );
};

/** The step the parcel has reached, written on top of the sketch. */
export const SketchStatus = ({ stop }: { stop: number }) => {
  const { reduced } = useMotion();
  const body = useRef<HTMLSpanElement>(null);
  const current = STOPS[stop];

  useLayoutEffect(() => {
    if (reduced || stop === 0 || !body.current) return;
    const tween = gsap.fromTo(body.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    return () => void tween.kill();
  }, [stop, reduced]);

  return (
    <p className="m-0 inline-flex max-w-full items-center gap-2.5 rounded-full bg-white py-1 pr-4 pl-1 text-sm shadow-[0_12px_28px_-14px_rgb(107_51_0/0.45)]" aria-hidden>
      <span className="grid size-7 flex-none place-items-center rounded-full bg-primary text-[13px] font-semibold text-ink tabular-nums">{stop + 1}</span>
      <span ref={body} className="flex min-w-0 items-baseline gap-2">
        <span className="flex-none font-semibold text-ink">{current.status}</span>
        <span className="truncate text-ink-2">{current.detail}</span>
      </span>
    </p>
  );
};
