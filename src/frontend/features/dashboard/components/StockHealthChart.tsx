import { Card } from '@/frontend/components/card';
import type { DashboardResponseType } from '../types';

const SEGMENTS = [
  { key: 'inStock', label: 'In stock', className: 'seg-good' },
  { key: 'low', label: 'Low', className: 'seg-warning' },
  { key: 'out', label: 'Out', className: 'seg-critical' },
] as const;

/** One stacked bar of SKUs by stock status, direct-labelled, with a table fallback. */
export function StockHealthChart({ health }: { health: DashboardResponseType['stockHealth'] }) {
  const total = health.inStock + health.low + health.out || 1;
  return (
    <Card title="Stock levels" subtitle="SKUs by stock status">
      <div className="stack-bar" role="img" aria-label={`${health.inStock} in stock, ${health.low} low, ${health.out} out of stock`}>
        {SEGMENTS.map((s) =>
          health[s.key] ? (
            <span
              key={s.key}
              className={`stack-seg ${s.className}`}
              style={{ flexGrow: health[s.key] / total }}
              title={`${s.label}: ${health[s.key]} SKUs`}
            />
          ) : null,
        )}
      </div>
      <ul className="chart-legend">
        {SEGMENTS.map((s) => (
          <li key={s.key}>
            <span className={`legend-dot ${s.className}`} aria-hidden />
            {s.label} <strong>{health[s.key]}</strong>
          </li>
        ))}
      </ul>
      <details className="table-toggle">
        <summary>View as table</summary>
        <table className="table table-compact">
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col" className="num">SKUs</th>
              <th scope="col" className="num">Share</th>
            </tr>
          </thead>
          <tbody>
            {SEGMENTS.map((s) => (
              <tr key={s.key}>
                <th scope="row">{s.label}</th>
                <td className="num">{health[s.key]}</td>
                <td className="num">{Math.round((health[s.key] / total) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  );
}
