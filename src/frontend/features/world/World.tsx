import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ErrorState } from '@/frontend/components/feedback';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { businessesService } from '@/frontend/features/businesses/services';
import { dashboardService } from '@/frontend/features/dashboard/services';
import { deliveriesService } from '@/frontend/features/deliveries/services';
import { DeliveryViewTypeEnum } from '@/frontend/features/deliveries/types';
import { inventoryService } from '@/frontend/features/inventory/services';
import { locationsService } from '@/frontend/features/locations/services';
import { ordersService } from '@/frontend/features/orders/services';
import { teamService } from '@/frontend/features/team/services';
import { useConnection } from '@/frontend/hooks/use-connection';
import { useCoveredInsets } from '@/frontend/hooks/use-covered-insets';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { useMediaQuery } from '@/frontend/hooks/use-media-query';
import { useMotion } from '@/frontend/hooks/use-motion';
import { CameraToolbar } from './components/CameraToolbar';
import { Inspector } from './components/Inspector';
import { InspectorOverview } from './components/InspectorOverview';
import { IsoScene } from './components/IsoScene';
import { KpiBar } from './components/KpiBar';
import { LiveBadge } from './components/LiveBadge';
import { Tracker } from './components/Tracker';
import { InspectorFor } from './lib/inspector-for';
import { BuildKpis } from './lib/kpis';
import { FindItem, HighlightOf, StillExists } from './lib/selection';
import { SearchRows, TRACKER_ROWS } from './lib/tracker';
import { ApplyCommand, HOME_VIEW } from './lib/view';
import { WORLDS } from './lib/worlds';
import type { ViewType, WorldContextType, WorldSelectionType, WorldTrackerTabType } from './types';

const OPEN_ORDERS = { open: true };
const UPCOMING = { view: DeliveryViewTypeEnum.UPCOMING };

/** The live world of the business. Every shelf, vehicle, label, number and row is the business's own data. */
export const World = () => {
  useDocumentTitle('Live world');
  const business = businessesService.useBusiness();
  const layout = WORLDS[business.template.type];
  const dashboard = dashboardService.useGetDashboard();
  const locations = locationsService.useGetLocations();
  const orders = ordersService.useGetOrders(OPEN_ORDERS);
  const deliveries = deliveriesService.useGetDeliveries(UPCOMING);
  const items = inventoryService.useGetItems();
  const { data: members = [] } = teamService.useGetMembers();
  const connected = useConnection();
  const { reduced } = useMotion();
  const lite = useMediaQuery('(max-width: 760px)');
  const [params, setParams] = useSearchParams();

  const [selection, setSelection] = useState<WorldSelectionType | null>(null);
  const [tab, setTab] = useState<WorldTrackerTabType>('deliveries');
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query);
  const [tags, setTags] = useState(true);
  const [view, setView] = useState<ViewType>(HOME_VIEW);

  const stage = useRef<HTMLDivElement>(null);
  const kpiRef = useRef<HTMLElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const trackerRef = useRef<HTMLElement>(null);

  const ctx = useMemo<WorldContextType | null>(() => {
    if (!dashboard.data || !locations.data || !orders.data || !deliveries.data || !items.data) return null;
    return {
      dashboard: dashboard.data,
      locations: locations.data,
      orders: orders.data,
      deliveries: deliveries.data,
      items: items.data,
      template: business.template,
      currency: business.currency,
    };
  }, [dashboard.data, locations.data, orders.data, deliveries.data, items.data, business.template, business.currency]);

  const teamColors = useMemo(() => members.map((m) => m.color), [members]);
  const scene = useMemo(() => (ctx ? layout.scene(ctx, teamColors) : null), [layout, ctx, teamColors]);
  const insets = useCoveredInsets(stage, { top: kpiRef, right: toolsRef, bottom: trackerRef }, Boolean(ctx));

  // "Show in world" from an item: select it, which rings the shelf that holds it.
  const focus = params.get('focus');
  useEffect(() => {
    if (!focus || !ctx) return;
    if (FindItem(ctx, focus)) setSelection({ kind: 'item', sku: focus });
    setParams((p) => (p.delete('focus'), p), { replace: true });
  }, [focus, ctx, setParams]);

  useEffect(() => {
    if (!selection) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelection(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection]);

  // A record that was received, closed or archived meanwhile simply drops out of the selection.
  const active = ctx && selection && StillExists(ctx, layout, selection) ? selection : null;
  const inspector = useMemo(() => (ctx ? InspectorFor(layout, ctx, active) : null), [layout, ctx, active]);

  const queries = [dashboard, locations, orders, deliveries, items];
  const failed = queries.find((q) => q.isError);
  if (failed?.error) return <ErrorState message={failed.error.message} onRetry={() => queries.forEach((q) => q.isError && q.refetch())} />;

  const counts = ctx ? { deliveries: ctx.deliveries.length, orders: ctx.orders.length, alerts: TRACKER_ROWS.alerts(ctx).length } : { deliveries: 0, orders: 0, alerts: 0 };
  const rows = ctx ? (search.trim() ? SearchRows(ctx, search) : TRACKER_ROWS[tab](ctx)) : [];
  const pickObject = (id: string) => setSelection(scene?.links[id] ?? { kind: 'object', id });

  return (
    <div className="page page-world">
      <div ref={stage} className="world-stage">
        {ctx ? (
          <KpiBar ref={kpiRef} kpis={BuildKpis(ctx)} currency={business.currency} animate={!reduced} />
        ) : (
          <div className="world-kpis grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-23 rounded-2xl" />
            ))}
          </div>
        )}
        {ctx && <CameraToolbar ref={toolsRef} onCommand={(c) => setView((v) => ApplyCommand(v, c))} tags={tags} onToggleTags={() => setTags((t) => !t)} />}
        <div className="world-scene">
          {ctx && scene ? (
            <>
              <IsoScene
                scene={scene}
                objects={layout.objects}
                ctx={ctx}
                view={view}
                onView={setView}
                highlighted={HighlightOf(scene, layout, ctx, active)}
                tab={tab}
                tags={tags}
                compact={lite}
                animate={!reduced}
                insets={insets}
                onSelect={setSelection}
                onClear={() => setSelection(null)}
              />
              <div className="pointer-events-none absolute z-20" style={{ top: insets.top || 12, left: (insets.left || 0) + 12 }}>
                <LiveBadge updatedAt={dashboard.dataUpdatedAt} connected={connected} />
              </div>
            </>
          ) : (
            <div className="world-loading" role="status">
              <span className="spinner spinner-lg" aria-hidden /> Building your world…
            </div>
          )}
        </div>
        {ctx && (
          <aside className="world-inspector" aria-label="Details" aria-live="polite">
            <div key={active ? JSON.stringify(active) : 'overview'} className="world-swap flex min-h-0 flex-1 flex-col">
              {inspector ? (
                <Inspector model={inspector} currency={business.currency} animate={!reduced} onSelect={setSelection} onClose={() => setSelection(null)} />
              ) : (
                <InspectorOverview businessName={business.name} objects={layout.objects} ctx={ctx} onSelect={pickObject} />
              )}
            </div>
          </aside>
        )}
        {ctx && (
          <Tracker ref={trackerRef} ctx={ctx} tab={tab} onTab={setTab} counts={counts} rows={rows} query={query} onQuery={setQuery} selection={active} onSelect={setSelection} />
        )}
      </div>
    </div>
  );
};
