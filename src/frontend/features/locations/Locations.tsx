import { useState } from 'react';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { PageHeader } from '@/frontend/components/layout';
import { businessesService } from '@/frontend/features/businesses/services';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { ZoneGrid } from './components/ZoneGrid';
import { locationsService } from './services';

export function Locations() {
  const { template } = businessesService.useBusiness();
  useDocumentTitle(template.labels.locations);
  const { data, isPending, isError, error, refetch } = locationsService.useLocations();
  const [issuesOnly, setIssuesOnly] = useState(false);
  const zones = [
    ...template.zones,
    // Locations added in Settings under a zone the template doesn't have.
    ...[...new Set((data ?? []).map((l) => l.zone))]
      .filter((z) => !template.zones.some((t) => t.code === z))
      .map((code) => ({ code, name: code, levels: 0, bins: 1, levelLabel: 'Shelf', binLabel: 'Spot' })),
  ];

  return (
    <div className="page">
      <PageHeader
        title={template.labels.locations}
        description={`Where everything is kept — the same ${template.labels.locations.toLowerCase()} as the live 3D world. Select an item to see it.`}
        actions={
          <label className="check">
            <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} />
            Highlight low &amp; out of stock
          </label>
        }
      />
      {isPending ? (
        <SkeletonRows rows={4} height={180} label="Loading" />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : (
        <div className="aisles">
          {zones.map((z) => (
            <ZoneGrid key={z.code} zone={z} locations={data.filter((l) => l.zone === z.code)} issuesOnly={issuesOnly} />
          ))}
        </div>
      )}
    </div>
  );
}
