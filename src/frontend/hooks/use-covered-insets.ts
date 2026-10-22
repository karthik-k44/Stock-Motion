import { useLayoutEffect, useState, type RefObject } from 'react';

export type CoveredInsetsType = { top: number; right: number; bottom: number; left: number };

type PanelsType = Partial<Record<keyof CoveredInsetsType, RefObject<HTMLElement | null>>>;

const ZERO: CoveredInsetsType = { top: 0, right: 0, bottom: 0, left: 0 };

const same = (a: CoveredInsetsType, b: CoveredInsetsType) => a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;

/**
 * How far floating panels reach into a container from each side, so what sits behind them (a 3D scene)
 * can be centred in the part still visible. A panel only counts while it is `position: absolute`;
 * once the layout stacks it on small screens it covers nothing.
 * `ready` re-measures once the panels have rendered (e.g. after data loads).
 */
export const useCoveredInsets = (container: RefObject<HTMLElement | null>, panels: PanelsType, ready: boolean, gap = 12): CoveredInsetsType => {
  const [insets, setInsets] = useState(ZERO);
  const { top, right, bottom, left } = panels;

  useLayoutEffect(() => {
    const box = container.current;
    if (!box || !ready) return;
    const floating = (ref?: RefObject<HTMLElement | null>) => {
      const el = ref?.current;
      return el && getComputedStyle(el).position === 'absolute' ? el.getBoundingClientRect() : null;
    };
    const measure = () => {
      const b = box.getBoundingClientRect();
      const [t, r, bo, l] = [floating(top), floating(right), floating(bottom), floating(left)];
      const next = {
        top: t ? Math.round(t.bottom - b.top + gap) : 0,
        right: r ? Math.round(b.right - r.left + gap) : 0,
        bottom: bo ? Math.round(b.bottom - bo.top + gap) : 0,
        left: l ? Math.round(l.right - b.left + gap) : 0,
      };
      setInsets((prev) => (same(prev, next) ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    [top, right, bottom, left].forEach((ref) => ref?.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, [container, top, right, bottom, left, ready, gap]);

  return insets;
};
