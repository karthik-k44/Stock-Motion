import type { Ref } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { Text } from '@/frontend/components/text';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { paths } from '@/frontend/config/paths';
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
const TABS: WorldTrackerTabType[] = ['deliveries', 'orders', 'alerts'];

/** The records under the scene: deliveries on the way, open orders, stock alerts — or search results across all of them. */
export const Tracker = ({ ctx, tab, onTab, counts, rows, query, onQuery, selection, onSelect, ref }: Props) => {
  const { labels } = ctx.template;
  const label: Record<WorldTrackerTabType, string> = { deliveries: labels.deliveries, orders: labels.orders, alerts: 'Stock alerts' };
  const searching = query.trim().length > 0;
  const empty = searching
    ? `Nothing matches “${query.trim()}”.`
    : { deliveries: `No ${labels.deliveries.toLowerCase()} on the way.`, orders: `No open ${labels.orders.toLowerCase()}.`, alerts: 'Everything is in stock.' }[tab];

  // Re-keyed on every tab / search so the rows animate in again.
  const list = (
    <ScrollArea className="h-52">
      {rows.length ? (
        <ul key={searching ? `q:${query}` : tab} className="m-0 grid gap-0.5 pr-2">
          {rows.map((r, i) => (
            <TrackerRow key={r.key} index={i} row={r} selected={SameSelection(selection, r.select)} onSelect={() => onSelect(r.select)} />
          ))}
        </ul>
      ) : (
        <Text variant="small" tone="muted" className="grid h-52 place-items-center text-center">
          {empty}
        </Text>
      )}
    </ScrollArea>
  );

  return (
    <section ref={ref} aria-label="Tracking" className="world-tracker @container flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 shadow-card">
      <Tabs value={tab} onValueChange={(v) => (onQuery(''), onTab(v as WorldTrackerTabType))}>
        <div className="flex flex-wrap items-center gap-2">
          <TabsList aria-label="Track" className="h-10 rounded-xl bg-sunken p-1">
            {TABS.map((id) => (
              <TabsTrigger
                key={id}
                value={id}
                onClick={() => onQuery('')}
                className="h-8 rounded-lg px-3 text-[13px] font-semibold data-[state=active]:bg-surface data-[state=active]:text-ink"
              >
                {label[id]}
                <span className={tab === id && !searching ? 'text-primary-700 tabular-nums' : 'text-muted-foreground tabular-nums'}>{counts[id]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <label className="relative min-w-45 flex-1">
            <span className="sr-only">
              Search {labels.items.toLowerCase()}, {labels.orders.toLowerCase()} and {labels.deliveries.toLowerCase()}
            </span>
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={`Search ${labels.items.toLowerCase()}, ${labels.orders.toLowerCase()}, ${labels.deliveries.toLowerCase()}…`}
              className="h-10 rounded-xl bg-canvas pl-9"
            />
          </label>
          {!searching && (
            <Button asChild variant="outline" className="h-10 rounded-xl font-semibold">
              <Link to={VIEW_ALL[tab]}>View all</Link>
            </Button>
          )}
        </div>
        {searching ? (
          <div role="region" aria-label="Search results" className="mt-2">
            {list}
          </div>
        ) : (
          TABS.map((id) => (
            <TabsContent key={id} value={id} className="mt-2">
              {list}
            </TabsContent>
          ))
        )}
      </Tabs>
    </section>
  );
};
