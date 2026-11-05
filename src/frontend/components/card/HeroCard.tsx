import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { MonotonePath, type ChartPoint } from '@/frontend/utils/chart';
import { FormatDate, FormatPercentChange } from '@/frontend/utils/format';

type TrendPoint = { day: string; value: number };

type HeroCardProps = {
  label: string;
  value: ReactNode;
  trend: TrendPoint[];
  /** What the trend plots, for screen readers: "Stock value" */
  trendLabel: string;
  formatValue: (n: number) => string;
  /** Percentage for the pill; null hides it */
  change: number | null;
  /** Beside the pill: "from 7 days ago" */
  changeLabel: string;
  className?: string;
};

const dayLabel = (day: string) => FormatDate(`${day}T00:00:00`);

/** Where each value sits in a 100 × 100 box. Changes under 2% of the total stay small instead of filling the card. */
const plot = (trend: TrendPoint[]): ChartPoint[] => {
  const values = trend.map((t) => t.value);
  const [low, high] = [Math.min(...values), Math.max(...values)];
  const span = Math.max(high - low, Math.abs(high) * 0.02) || 1;
  return trend.map((t, i) => ({ x: (i / (trend.length - 1)) * 100, y: 56 - ((t.value - (low + high) / 2) / span) * 72 }));
};

/** The page's one headline number, on the brand gradient, over a real 14-day trend. */
export const HeroCard = ({ label, value, trend, trendLabel, formatValue, change, changeLabel, className }: HeroCardProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const last = trend.length - 1;
  const points = plot(trend);
  const line = MonotonePath(points);
  const marker = points[hovered ?? last];

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setHovered(Math.round(((e.clientX - box.left) / box.width) * last));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    setHovered((h) => Math.min(last, Math.max(0, (h ?? last) + step)));
  };

  return (
    <section className={`hero-card ${className ?? ''}`} aria-label={label}>
      <p className="hero-label">{label}</p>
      <p className="hero-value">{value}</p>
      <p className="hero-change">
        {change !== null && <span className="hero-pill">{FormatPercentChange(change)}</span>}
        {changeLabel}
      </p>
      <div
        className="hero-trend"
        role="group"
        tabIndex={0}
        aria-label={`${trendLabel}, last 14 days, from ${formatValue(trend[0].value)} to ${formatValue(trend[last].value)}. Use the arrow keys to read each day.`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHovered(null)}
        onFocus={() => setHovered(last)}
        onBlur={() => setHovered(null)}
        onKeyDown={onKeyDown}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="hero-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line}L100 100L0 100Z`} fill="url(#hero-trend-fill)" />
          <path d={line} className="hero-trend-line" />
        </svg>
        {hovered !== null && <span className="hero-crosshair" style={{ left: `${marker.x}%` }} aria-hidden />}
        <span className="hero-marker" style={{ left: `clamp(9px, ${marker.x}%, calc(100% - 9px))`, top: `${marker.y}%` }} aria-hidden />
        {hovered !== null && (
          <span className="hero-tip" style={{ left: `clamp(64px, ${marker.x}%, calc(100% - 64px))`, top: `${marker.y}%` }} aria-live="polite">
            <strong>{formatValue(trend[hovered].value)}</strong>
            {dayLabel(trend[hovered].day)}
          </span>
        )}
      </div>
    </section>
  );
};
