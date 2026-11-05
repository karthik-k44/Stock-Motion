export type ChartPoint = { x: number; y: number };

/** A smooth SVG path through the points that never overshoots them, so a curve can't show a peak the data doesn't have. */
export const MonotonePath = (points: ChartPoint[]): string => {
  const slopes = points.slice(1).map((p, i) => (p.y - points[i].y) / (p.x - points[i].x));
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === points.length - 1) return slopes[i - 1];
    const [before, after] = [slopes[i - 1], slopes[i]];
    return before * after <= 0 ? 0 : (2 * before * after) / (before + after);
  });
  const curves = points.slice(1).map((p, i) => {
    const from = points[i];
    const handle = (p.x - from.x) / 3;
    return `C${from.x + handle} ${from.y + tangents[i] * handle} ${p.x - handle} ${p.y - tangents[i + 1] * handle} ${p.x} ${p.y}`;
  });
  return `M${points[0].x} ${points[0].y}${curves.join('')}`;
};

/** The round number an axis should stop at: the first of 1, 2, 2.5, 5 or 10 (× a power of ten) at or above `n`. */
export const NiceMax = (n: number): number => {
  if (n <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(n));
  return ([1, 2, 2.5, 5, 10].find((step) => step * power >= n) ?? 10) * power;
};

/** Percentage change, or null when there is nothing to compare against. */
export const PercentChange = (from: number, to: number): number | null => (from === 0 ? null : ((to - from) / Math.abs(from)) * 100);
