import type { ReactNode } from 'react';

type Row = { key: string; label: ReactNode; value: number; display?: string };

/** Single-series horizontal bars (one hue), every bar direct-labelled. */
export function BarList({ rows, label }: { rows: Row[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="bars" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key} className="bar-row" title={`${typeof r.label === 'string' ? r.label : r.key}: ${r.display ?? r.value}`}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-track" aria-hidden>
            <span className="bar-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="bar-value">{r.display ?? r.value}</span>
        </li>
      ))}
    </ul>
  );
}
