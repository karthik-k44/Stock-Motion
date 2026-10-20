import type { Ref } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { Text } from '@/frontend/components/text';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { SameSelection } from '../lib/selection';
import type { WorldContextType, WorldRowType, WorldSelectionType, WorldTrackerTabType } from '../types';
import { TrackerRow } from './TrackerRow';

type Props = {
  ctx: WorldContextType;
  tab: WorldTrackerTabType;
  onTab: (tab: WorldTrackerTabType) => void;
  counts: Record<WorldTrackerTabType, number>;
  rows: WorldRowType[];
  query: string;
  onQuery: (q: string) => void;
  selection: WorldSelectionType | null;
  onSelect: (s: WorldSelectionType) => void;
  ref?: Ref<HTMLElement>;
};

const VIEW_ALL: Record<WorldTrackerTabType, string> = { deliveries: paths.deliveries, orders: paths.orders, alerts: paths.inventory };

/** The records under the scene: deliveries on the way, open orders, stock alerts — or search results across all of them. */
export const Tracker = ({ ctx, tab, onTab, counts, rows, query, onQuery, selection, onSelect, ref }: Props) => {
  const { labels } = ctx.template;
  const tabs: { id: WorldTrackerTabType; label: string }[] = [
    { id: 'deliveries', label: labels.deliveries },
    { id: 'orders', label: labels.orders },
    { id: 'alerts', label: 'Stock alerts' },
  ];
  const searching = query.trim().length > 0;
  const empty = searching
    ? `Nothing matches “${query.trim()}”.`
    : { deliveries: `No ${labels.deliveries.toLowerCase()} on the way.`, orders: `No open ${labels.orders.toLowerCase()}.`, alerts: 'Everything is in stock.' }[tab];

  return (
    <section ref={ref} aria-label="Tracking" className="world-tracker @container flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Track" className="inline-flex rounded-xl bg-sunken p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={!searching && tab === t.id}
              aria-controls="world-tracker-panel"
              onClick={() => (onQuery(''), onTab(t.id))}
              className={Cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-lg border-0 px-3 text-[13px] font-semibold transition-colors',
                !searching && tab === t.id ? 'bg-surface text-ink shadow-sm' : 'bg-transparent text-ink-2 hover:text-ink',
              )}
            >
              {t.label}
              <span className={Cn('tabular-nums', !searching && tab === t.id ? 'text-primary-700' : 'text-muted')}>{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <label className="flex min-h-10 min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-line bg-canvas px-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200">
          <Icon name="search" size={16} className="flex-none text-muted" />
          <span className="sr-only">Search {labels.items.toLowerCase()}, {labels.orders.toLowerCase()} and {labels.deliveries.toLowerCase()}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={`Search ${labels.items.toLowerCase()}, ${labels.orders.toLowerCase()}, ${labels.deliveries.toLowerCase()}…`}
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </label>
        {!searching && (
          <Link to={VIEW_ALL[tab]} className="inline-flex min-h-10 items-center rounded-xl border border-line-strong px-3 text-[13px] font-semibold text-ink no-underline hover:bg-sunken">
            View all
          </Link>
        )}
      </div>
      <div id="world-tracker-panel" role="tabpanel" aria-label={searching ? 'Search results' : tabs.find((t) => t.id === tab)!.label} className="h-[208px] overflow-y-auto">
        {rows.length ? (
          <ul className="m-0 grid gap-0.5">
            {rows.map((r) => (
              <TrackerRow key={r.key} row={r} selected={SameSelection(selection, r.select)} onSelect={() => onSelect(r.select)} />
            ))}
          </ul>
        ) : (
          <Text variant="small" tone="muted" className="grid h-full place-items-center text-center">
            {empty}
          </Text>
        )}
      </div>
    </section>
  );
};
