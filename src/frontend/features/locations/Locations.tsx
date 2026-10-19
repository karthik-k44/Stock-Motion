import { useState } from 'react';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { PageHeader } from '@/frontend/components/layout';
import { AISLES } from '@/frontend/features/warehouse/lib/layout';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { AisleGrid } from './components/AisleGrid';
import { locationsService } from './services';

export function Locations() {
  useDocumentTitle('Locations');
  const { data, isPending, isError, error, refetch } = locationsService.useLocations();
  const [issuesOnly, setIssuesOnly] = useState(false);

  return (
    <div className="page">
      <PageHeader
        title="Warehouse locations"
        description="Every aisle, shelf and bin — the same locations as the animated floor. Select a bin to see the item stored there."
        actions={
          <label className="check">
            <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} />
            Highlight low &amp; out of stock
          </label>
        }
      />
      {isPending ? (
        <SkeletonRows rows={4} height={180} label="Loading locations" />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : (
        <div className="aisles">
          {AISLES.map((a) => (
            <AisleGrid key={a} aisle={a} locations={data.filter((l) => l.aisle === a)} issuesOnly={issuesOnly} />
          ))}
        </div>
      )}
    </div>
  );
}
