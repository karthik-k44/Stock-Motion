import { useEffect, useRef, useState } from 'react';

/** Counts from the previous value to the new one when live data changes, and flashes briefly. */
export const AnimatedNumber = ({ value, format, animate }: { value: number; format: (n: number) => string; animate: boolean }) => {
  const [shown, setShown] = useState(value);
  const [changed, setChanged] = useState(false);
  const from = useRef(value);

  useEffect(() => {
    if (from.current === value) return;
    const start = from.current;
    from.current = value;
    setChanged(true);
    const done = window.setTimeout(() => setChanged(false), 1200);
    if (!animate) {
      setShown(value);
      return () => window.clearTimeout(done);
    }
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - began) / 700);
      const eased = 1 - (1 - p) ** 3;
      setShown(start + (value - start) * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
    };
  }, [value, animate]);

  return <span className={changed ? 'num-changed' : undefined}>{format(Number.isInteger(value) ? Math.round(shown) : shown)}</span>;
};
