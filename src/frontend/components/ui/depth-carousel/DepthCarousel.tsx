import gsap from 'gsap';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useMotion } from '@/frontend/hooks/use-motion';
import { Cn } from '@/frontend/lib/utils';

export type DepthItemType = { image: string; alt?: string };

type Props = {
  items: (DepthItemType | string)[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  /** Colour cards further back fade toward */
  tint?: string;
  /** `darken`: back cards dim into the tint (dark pages). `mist`: they fade into the tint without dimming (light pages). */
  fade?: 'darken' | 'mist';
  /** px each step back */
  depth?: number;
  /** px each step sideways */
  spread?: number;
  /** Degrees the cards behind turn */
  tilt?: number;
  tiltDirection?: 'left' | 'right';
  /**
   * `one`: the next cards recede to one side and the previous one fades out as it passes.
   * `both`: previous cards recede to the other side, mirrored — the card in front with history on one side and
   * what comes next on the other.
   */
  sides?: 'one' | 'both';
  perspective?: number;
  visibleCards?: number;
  /** How quickly cards fade with distance */
  falloff?: number;
  /** Max blur (px) on the furthest visible card */
  blur?: number;
  /** ms */
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  /** px from the carousel's sides to the arrows; 0 puts them on its edges (to line up with the page around it) */
  arrowInset?: number;
  showIndicators?: boolean;
  label?: string;
  onChange?: (index: number, item: DepthItemType) => void;
  className?: string;
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalize = (it: DepthItemType | string): DepthItemType => (typeof it === 'string' ? { image: it, alt: '' } : it);
/** The shortest signed distance from `pos` to `i` on a loop of `n`. */
const loopDelta = (d: number, n: number) => {
  const m = ((d % n) + n) % n;
  return m > n / 2 ? m - n : m;
};

/** Matches `.depth-carousel__arrow` in styles/depth-carousel.css. */
const ARROW_SIZE = 44;

type FitType = {
  cardWidth: number;
  spread: number;
  depth: number;
  perspective: number;
  visibleCards: number;
  showControls: boolean;
  arrowInset: number;
};

/**
 * The largest scale (0.4–1) at which the outermost visible card stays inside `width`, leaving room for the arrows.
 * A card `d` steps back is offset by spread·d and pushed back by depth·d, so perspective shrinks both; turning only
 * pulls its outer edge further in, so it is left out.
 */
const fitScale = (width: number, c: FitType): number => {
  const half = width / 2 - (c.showControls ? c.arrowInset + ARROW_SIZE + 8 : 12);
  const extent = (sc: number) => {
    let max = (sc * c.cardWidth) / 2;
    for (let d = 1; d <= c.visibleCards; d++) {
      const nearness = c.perspective / (c.perspective + sc * c.depth * d);
      max = Math.max(max, sc * (Math.abs(c.spread) * d + c.cardWidth / 2) * nearness);
    }
    return max;
  };
  if (extent(1) <= half) return 1;
  let [lo, hi] = [0.4, 1];
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (extent(mid) <= half) lo = mid;
    else hi = mid;
  }
  return lo;
};

/**
 * A carousel of cards stacked back in 3D: the active card in front, the rest receding to one side (or, with
 * `sides="both"`, previous cards to one side and next ones to the other), turned and fading. Drag, wheel, arrow
 * keys, the arrows or the dots move it; GSAP eases the position between cards.
 */
export const DepthCarousel = ({
  items,
  cardWidth = 300,
  cardHeight = 380,
  radius = 18,
  tint = '#05060a',
  fade = 'darken',
  depth = 220,
  spread = 90,
  tilt = 22,
  tiltDirection = 'right',
  sides = 'one',
  perspective = 1400,
  visibleCards = 4,
  falloff = 0.2,
  blur = 6,
  duration = 700,
  ease = 'power3.out',
  autoplay = false,
  autoplayDelay = 3200,
  loop = true,
  showControls = true,
  arrowInset = 16,
  showIndicators = true,
  label = 'Carousel',
  onChange,
  className,
}: Props) => {
  const data = useMemo(() => items.map(normalize), [items]);
  const count = data.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const posRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleRef = useRef(1);
  const dragRef = useRef<{ x: number; startPos: number; lastX: number; lastT: number; v: number; moved: boolean; id: number } | null>(null);
  const wheelTimerRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [active, setActive] = useState(0);
  // The app's motion setting (Off, or the OS asking for less): jump between cards, no autoplay.
  const { reduced } = useMotion();
  reducedRef.current = reduced;

  const cfg = {
    ...{ count, depth, spread, tilt, tiltDirection, sides, perspective, visibleCards, falloff, blur },
    ...{ duration, ease, loop, cardWidth, autoplayDelay, fade, showControls, arrowInset },
  };
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  onChangeRef.current = onChange;

  /** Places every card for a (fractional) position: depth, offset, turn, fade and blur. */
  const layout = useCallback((pos: number) => {
    const c = cfgRef.current;
    if (!c.count) return;
    const dir = c.tiltDirection === 'left' ? -1 : 1;
    const both = c.sides === 'both';
    const sc = scaleRef.current;
    for (let i = 0; i < c.count; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const d = c.loop && c.count > 1 ? loopDelta(i - pos, c.count) : i - pos;
      // Steps behind the front card, and which way it recedes. One-sided, a previous card has dist < 0: it comes forward.
      const dist = both ? Math.abs(d) : d;
      const side = both && d < 0 ? -1 : 1;
      const back = Math.max(0, dist);
      const shown = Math.abs(d) <= c.visibleCards + 0.5;
      const tz = -c.depth * dist;
      const tx = dir * side * c.spread * dist;
      const ry = dir * side * c.tilt * clamp(dist, 0, 1);
      const opacity = both ? clamp(c.visibleCards + 1 - dist, 0, 1) : shown ? (d < 0 ? Math.max(0, 1 + d) : 1) : 0;
      const brightness = c.fade === 'darken' ? Math.max(0.15, 1 - back * c.falloff) : 1;
      const blurPx = c.blur > 0 ? Math.min(c.blur, (back / Math.max(1, c.visibleCards)) * c.blur) : 0;
      el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      el.style.zIndex = String(Math.round(2000 - dist * 20));
      el.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none';
      const ov = overlayRefs.current[i];
      if (ov) ov.style.opacity = clamp(back * c.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  }, []);

  const tweenTo = useCallback(
    (target: number, animate: boolean) => {
      tweenRef.current?.kill();
      const c = cfgRef.current;
      const proxy = { p: posRef.current };
      tweenRef.current = gsap.to(proxy, {
        p: target,
        duration: animate && !reducedRef.current ? c.duration / 1000 : 0,
        ease: c.ease,
        onUpdate: () => {
          posRef.current = proxy.p;
          layout(proxy.p);
        },
        onComplete: () => {
          if (c.count > 0) posRef.current = ((posRef.current % c.count) + c.count) % c.count;
          layout(posRef.current);
        },
      });
    },
    [layout],
  );

  const setFocus = useCallback(
    (rawIndex: number, animate = true) => {
      const c = cfgRef.current;
      if (!c.count) return;
      const idx = c.loop ? ((rawIndex % c.count) + c.count) % c.count : clamp(rawIndex, 0, c.count - 1);
      const delta = c.loop && c.count > 1 ? loopDelta(idx - posRef.current, c.count) : idx - posRef.current;
      tweenTo(posRef.current + delta, animate);
      if (idx !== focusRef.current) {
        focusRef.current = idx;
        setActive(idx);
        onChangeRef.current?.(idx, data[idx]);
      }
    },
    [tweenTo, data],
  );

  const navigateBy = useCallback((step: number) => setFocus(focusRef.current + step, true), [setFocus]);

  // Shrink the whole stack until its outermost cards fit the container (and clear the arrows when they show).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(([entry]) => {
      scaleRef.current = fitScale(entry.contentRect.width, cfgRef.current);
      layout(posRef.current);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [layout]);

  // Horizontal wheel / trackpad swipes scrub through the cards; vertical scrolling is left to the page.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const c = cfgRef.current;
      if (c.count < 2 || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      tweenRef.current?.kill();
      const delta = e.deltaMode === 1 ? e.deltaX * 24 : e.deltaX;
      posRef.current += clamp(delta / (c.cardWidth * 0.9), -0.6, 0.6);
      layout(posRef.current);
      if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => setFocus(Math.round(posRef.current), true), 130);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
    };
  }, [layout, setFocus]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (cfgRef.current.count < 2) return;
    tweenRef.current?.kill();
    dragRef.current = { x: e.clientX, startPos: posRef.current, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const stepPx = Math.max(cfgRef.current.cardWidth * 0.55 * scaleRef.current, 40);
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) {
      drag.moved = true;
      rootRef.current?.setPointerCapture(drag.id);
    }
    if (!drag.moved) return;
    const now = performance.now();
    drag.v = (e.clientX - drag.lastX) / Math.max(now - drag.lastT, 1);
    drag.lastX = e.clientX;
    drag.lastT = now;
    posRef.current = drag.startPos - dx / stepPx;
    layout(posRef.current);
  };

  const onPointerEnd = () => {
    const drag = dragRef.current;
    if (!drag) return;
    // Kept until the click that follows a drag has been ignored.
    window.setTimeout(() => (dragRef.current = null), 0);
    if (!drag.moved) {
      dragRef.current = null;
      return;
    }
    const stepPx = Math.max(cfgRef.current.cardWidth * 0.55 * scaleRef.current, 40);
    setFocus(Math.round(posRef.current - (drag.v * 180) / stepPx), true);
  };

  // Autoplay: pauses while hovered or focused; off for reduced motion.
  useEffect(() => {
    const root = rootRef.current;
    if (!autoplay || reduced || count < 2 || !root) return;
    let hovered = false;
    let focused = false;
    const timer = window.setInterval(() => !hovered && !focused && navigateBy(1), Math.max(cfgRef.current.autoplayDelay, 600));
    const enter = () => void (hovered = true);
    const leave = () => void (hovered = false);
    const focusIn = () => void (focused = true);
    const focusOut = () => void (focused = false);
    root.addEventListener('mouseenter', enter);
    root.addEventListener('mouseleave', leave);
    root.addEventListener('focusin', focusIn);
    root.addEventListener('focusout', focusOut);
    return () => {
      window.clearInterval(timer);
      root.removeEventListener('mouseenter', enter);
      root.removeEventListener('mouseleave', leave);
      root.removeEventListener('focusin', focusIn);
      root.removeEventListener('focusout', focusOut);
    };
  }, [autoplay, autoplayDelay, count, navigateBy, reduced]);

  useEffect(() => {
    layout(posRef.current);
  }, [layout, depth, spread, tilt, tiltDirection, sides, visibleCards, falloff, blur, cardWidth, cardHeight, radius, count, fade, showControls, arrowInset]);

  useEffect(() => () => void tweenRef.current?.kill(), []);

  return (
    <div
      ref={rootRef}
      className={Cn('depth-carousel', fade === 'mist' && 'depth-carousel--light', className)}
      style={{ '--dc-perspective': `${perspective}px`, '--dc-arrow-inset': `${arrowInset}px` } as CSSProperties}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          navigateBy(e.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
    >
      <div className="depth-carousel__stage">
        {data.map((item, i) => (
          <div
            key={item.image}
            className="depth-carousel__card"
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            style={{ width: cardWidth, height: cardHeight, borderRadius: radius }}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={active !== i}
            onClick={() => !dragRef.current?.moved && setFocus(i, true)}
          >
            <img className="depth-carousel__img" src={item.image} alt={item.alt ?? ''} draggable={false} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" />
            <span
              className="depth-carousel__tint"
              ref={(el) => {
                overlayRefs.current[i] = el;
              }}
              style={{ background: tint, mixBlendMode: fade === 'mist' ? 'normal' : 'multiply' }}
            />
          </div>
        ))}
      </div>

      {showControls && count > 1 && (
        <>
          <button type="button" className="depth-carousel__arrow depth-carousel__arrow--prev" aria-label="Previous slide" onClick={() => navigateBy(-1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="depth-carousel__arrow depth-carousel__arrow--next" aria-label="Next slide" onClick={() => navigateBy(1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {showIndicators && count > 1 && (
        <div className="depth-carousel__dots" role="tablist" aria-label="Slides">
          {data.map((item, i) => (
            <button
              key={item.image}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Go to slide ${i + 1}`}
              className={Cn('depth-carousel__dot', active === i && 'is-active')}
              onClick={() => setFocus(i, true)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
