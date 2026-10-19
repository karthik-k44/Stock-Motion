import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState } from '@/frontend/components/feedback';
import { businessesService } from '@/frontend/features/businesses/services';
import { dashboardService } from '@/frontend/features/dashboard/services';
import { locationsService } from '@/frontend/features/locations/services';
import { teamService } from '@/frontend/features/team/services';
import { useConnection } from '@/frontend/hooks/use-connection';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { useMediaQuery } from '@/frontend/hooks/use-media-query';
import { useMotion } from '@/frontend/hooks/use-motion';
import { LiveBadge } from './components/LiveBadge';
import { ObjectList } from './components/ObjectList';
import { StatsCard } from './components/StatsCard';
import { WorldCanvas } from './components/WorldCanvas';
import { ZoneOf } from './lib/world-stats';
import { WORLDS } from './lib/worlds';
import type { WorldContextType } from './types';

/** The live 3D world of the business. Every card number comes from the same data as the dashboard. */
export function World() {
  useDocumentTitle('Live world');
  const business = businessesService.useBusiness();
  const layout = WORLDS[business.template.type];
  const dashboard = dashboardService.useDashboard();
  const locations = locationsService.useLocations();
  const { data: members = [] } = teamService.useMembers();
  const connected = useConnection();
  const { reduced } = useMotion();
  const lite = useMediaQuery('(max-width: 760px)');
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const card = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const ctx = useMemo<WorldContextType | null>(
    () => (dashboard.data && locations.data ? { dashboard: dashboard.data, locations: locations.data, template: business.template, currency: business.currency } : null),
    [dashboard.data, locations.data, business.template, business.currency],
  );

  // "Show in world" from an item: open the object that holds it.
  const focus = params.get('focus');
  useEffect(() => {
    if (!focus || !ctx) return;
    const zone = ZoneOf(ctx, focus);
    const target = layout.objects.find((o) => o.zone && o.zone === zone);
    if (target) setSelected(target.id);
    setParams((p) => (p.delete('focus'), p), { replace: true });
  }, [focus, ctx, layout, setParams]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  if (dashboard.isError) return <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />;
  const spec = layout.objects.find((o) => o.id === selected);

  return (
    <div className="page page-world">
      <div className="world-head">
        <div>
          <h1 className="page-title">{business.name}</h1>
          <p className="page-desc">Your {business.template.name.toLowerCase()} in 3D. Click anything for its live numbers — drag to turn, scroll or pinch to zoom.</p>
        </div>
        <div className="page-actions">
          <LiveBadge updatedAt={dashboard.dataUpdatedAt} connected={connected} />
          <Button size="sm" icon="refresh" onClick={() => (setResetKey((k) => k + 1), setSelected(null))}>Reset view</Button>
        </div>
      </div>
      <div className="world-body">
        <div ref={stage} className="world-stage">
          {ctx ? (
            <WorldCanvas
              layout={layout}
              ctx={ctx}
              selected={selected}
              onSelect={setSelected}
              animate={!reduced}
              lite={lite}
              teamColors={members.map((m) => m.color)}
              card={card}
              bounds={stage}
              resetKey={resetKey}
            />
          ) : (
            <div className="world-loading" role="status">
              <span className="spinner spinner-lg" aria-hidden /> Building your world…
            </div>
          )}
          {spec && ctx && <StatsCard key={spec.id} ref={card} spec={spec} ctx={ctx} animate={!reduced} onClose={() => setSelected(null)} />}
        </div>
        {ctx && <ObjectList objects={layout.objects} ctx={ctx} selected={selected} onSelect={(id) => setSelected((s) => (s === id ? null : id))} />}
      </div>
    </div>
  );
}
