import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { SegmentedControl } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole } from '@/frontend/features/businesses/types';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { FormatMoney } from '@/frontend/utils/format';
import { ImportModal } from './components/ImportModal';
import { InventoryFilters, type InventoryFilterState } from './components/InventoryFilters';
import { InventoryTable } from './components/InventoryTable';
import { ItemFormModal } from './components/ItemFormModal';
import { KindLabel, KindOptions } from './lib/inventory-options';
import { inventoryService } from './services';
import { ItemKindTypeEnum, type ListItemsParams } from './types';

const EMPTY: InventoryFilterState = { search: '', category: '', zone: '', status: 'ALL' };

export const Inventory = () => {
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  useDocumentTitle(labels.items);
  const [kind, setKind] = useState<ItemKindTypeEnum>(ItemKindTypeEnum.STOCK);
  const [filters, setFilters] = useState<InventoryFilterState>(EMPTY);
  const [dialog, setDialog] = useState<'new' | 'import' | null>(null);
  const search = useDebouncedValue(filters.search.trim());
  const drawer = useItemDrawer();
  const manager = IsManagementRole(business.role);

  const params: ListItemsParams = {
    kind,
    search: search || undefined,
    category: filters.category || undefined,
    zone: kind === ItemKindTypeEnum.STOCK ? filters.zone || undefined : undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
  };
  const { data, isPending, isError, error, refetch, isFetching } = inventoryService.useItems(params);
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY);
  const value = data?.reduce((s, i) => s + i.onHand * i.cost, 0) ?? 0;

  return (
    <div className="page">
      <PageHeader
        title={labels.items}
        description={`Everything you stock, make and sell. Select a row for details, history, ${labels.consume.toLowerCase()} and stock actions.`}
        actions={
          manager && (
            <>
              <Button icon="upload" onClick={() => setDialog('import')}>Import CSV</Button>
              <Button variant="primary" icon="plus" onClick={() => setDialog('new')}>Add {KindLabel(labels, kind).toLowerCase()}</Button>
            </>
          )
        }
      />
      <SegmentedControl label="What to show" value={kind} options={KindOptions(labels)} onChange={(k) => (setKind(k), setFilters(EMPTY))} />
      <Card flush>
        <InventoryFilters kind={kind} value={filters} onChange={setFilters} searching={isFetching && !isPending} />
        <p className="result-count" role="status" aria-live="polite">
          {data
            ? `${data.length} item${data.length === 1 ? '' : 's'}${kind === ItemKindTypeEnum.STOCK ? ` · stock value ${FormatMoney(value, business.currency)}` : ''}`
            : 'Loading…'}
        </p>
        {isPending ? (
          <SkeletonRows rows={8} label="Loading items" />
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={filtered ? 'search' : 'box'}
            title={filtered ? 'Nothing matches these filters' : `No ${KindOptions(labels).find((k) => k.value === kind)?.label.toLowerCase()} yet`}
            action={
              filtered ? (
                <Button size="sm" onClick={() => setFilters(EMPTY)}>Clear filters</Button>
              ) : (
                manager && <Button size="sm" variant="primary" icon="plus" onClick={() => setDialog('new')}>Add the first one</Button>
              )
            }
          >
            {filtered ? 'Try a different name or SKU, or widen the filters.' : kind === ItemKindTypeEnum.STOCK ? 'Add items one by one, or import your spreadsheet as CSV.' : undefined}
          </EmptyState>
        ) : (
          <InventoryTable kind={kind} items={data} selectedSku={drawer.sku} onSelect={drawer.open} />
        )}
      </Card>
      {dialog === 'new' && <ItemFormModal kind={kind} onClose={() => setDialog(null)} onSaved={(sku) => (setDialog(null), drawer.open(sku))} />}
      {dialog === 'import' && <ImportModal onClose={() => setDialog(null)} />}
    </div>
  );
};
