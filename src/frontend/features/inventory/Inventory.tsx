import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { PageHeader } from '@/frontend/components/layout';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { FormatNumber } from '@/frontend/utils/format';
import { InventoryFilters, type InventoryFilterState } from './components/InventoryFilters';
import { InventoryTable } from './components/InventoryTable';
import { inventoryService } from './services';
import type { ListItemsParams } from './types';

const EMPTY: InventoryFilterState = { search: '', category: '', aisle: '', status: 'ALL' };

export function Inventory() {
  useDocumentTitle('Inventory');
  const [filters, setFilters] = useState<InventoryFilterState>(EMPTY);
  const search = useDebouncedValue(filters.search.trim());
  const drawer = useItemDrawer();

  const params: ListItemsParams = {
    search: search || undefined,
    category: filters.category || undefined,
    aisle: filters.aisle || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
  };
  const { data, isPending, isError, error, refetch, isFetching } = inventoryService.useItems(params);
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY);
  const units = data?.reduce((s, i) => s + i.onHand, 0) ?? 0;

  return (
    <div className="page">
      <PageHeader
        title="Inventory"
        description="Every SKU with on-hand, reserved and available quantity. Select an item for details, history and stock actions."
      />
      <Card flush>
        <InventoryFilters value={filters} onChange={setFilters} searching={isFetching && !isPending} />
        <p className="result-count" role="status" aria-live="polite">
          {data ? `${data.length} item${data.length === 1 ? '' : 's'} · ${FormatNumber(units)} units on hand` : 'Loading items…'}
        </p>
        {isPending ? (
          <SkeletonRows rows={8} label="Loading inventory" />
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <EmptyState
            icon="search"
            title="No items match these filters"
            action={
              filtered && (
                <Button size="sm" onClick={() => setFilters(EMPTY)}>
                  Clear filters
                </Button>
              )
            }
          >
            Try a different name or SKU, or widen the category, aisle or status filter.
          </EmptyState>
        ) : (
          <InventoryTable items={data} selectedSku={drawer.sku} onSelect={drawer.open} />
        )}
      </Card>
    </div>
  );
}
