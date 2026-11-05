import type { CSSProperties } from 'react';
import { Card } from '@/frontend/components/card';
import { EmptyState } from '@/frontend/components/feedback';
import { businessesService } from '@/frontend/features/businesses/services';
import { NiceMax } from '@/frontend/utils/chart';
import { FormatMoney, FormatMoneyCompact } from '@/frontend/utils/format';
import { CategoryLabel, type CategoryValueType } from '../lib/inventory-stats';
import { categoriesService } from '../services';

const SERIES = [
  { key: 'available', label: 'Available', className: 'seg-available' },
  { key: 'reserved', label: 'Reserved', className: 'seg-reserved' },
  { key: 'incoming', label: 'Incoming', className: 'seg-incoming' },
] as const;

const TICKS = [0, 0.25, 0.5, 0.75, 1];

type Props = { rows: CategoryValueType[]; className?: string };

/** Stacked columns, one per category, with a tooltip on hover or focus and a table view for every value. */
export const StockValueChart = ({ rows, className }: Props) => {
  const { currency } = businessesService.useBusiness();
  const { data: categories } = categoriesService.useGetCategories();
  const money = (n: number) => FormatMoney(n, currency);
  const name = (category: string) => CategoryLabel(category, (code) => categoriesService.CategoryName(categories, code));
  const top = NiceMax(Math.max(0, ...rows.map((r) => r.total)));

  return (
    <Card title="Stock value by category" subtitle="At cost, including what is on its way" className={className}>
      {!rows.length ? (
        <EmptyState icon="box" title="Nothing in stock to chart yet" />
      ) : (
        <>
          <div className="columns" style={{ '--columns': rows.length } as CSSProperties}>
            <div className="columns-grid" aria-hidden>
              {TICKS.map((t) => (
                <div key={t} className="columns-tick" style={{ bottom: `${t * 100}%` }}>
                  <span>{FormatMoneyCompact(t * top, currency)}</span>
                </div>
              ))}
            </div>
            <ul className="columns-plot" aria-label="Stock value by category">
              {rows.map((r) => {
                const stack = `${(r.total / top) * 100}%`;
                return (
                  <li
                    key={r.category}
                    className="column"
                    tabIndex={0}
                    style={{ '--stack': stack } as CSSProperties}
                    aria-label={`${name(r.category)}: ${SERIES.map((s) => `${money(r[s.key])} ${s.label.toLowerCase()}`).join(', ')}`}
                  >
                    <span className="column-stack" style={{ height: stack }} aria-hidden>
                      {SERIES.map((s) => r[s.key] > 0 && <span key={s.key} className={`column-seg ${s.className}`} style={{ flexGrow: r[s.key] }} />)}
                    </span>
                    <span className="column-tip" aria-hidden>
                      <span className="column-tip-name">{name(r.category)}</span>
                      {SERIES.map((s) => (
                        <span key={s.key} className="column-tip-row">
                          <span className={`column-key ${s.className}`} />
                          {s.label}
                          <strong>{money(r[s.key])}</strong>
                        </span>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="columns-axis" aria-hidden>
              {rows.map((r) => (
                <span key={r.category} title={name(r.category)}>
                  {name(r.category)}
                </span>
              ))}
            </div>
          </div>
          <ul className="chart-legend columns-legend">
            {SERIES.map((s) => (
              <li key={s.key}>
                <span className={`legend-dot ${s.className}`} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
          <details className="table-toggle">
            <summary>View as table</summary>
            <table className="table table-compact">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  {SERIES.map((s) => (
                    <th key={s.key} scope="col" className="num">{s.label}</th>
                  ))}
                  <th scope="col" className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.category}>
                    <th scope="row">{name(r.category)}</th>
                    {SERIES.map((s) => (
                      <td key={s.key} className="num">{money(r[s.key])}</td>
                    ))}
                    <td className="num">{money(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Card>
  );
};
