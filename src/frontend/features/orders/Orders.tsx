import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { SearchInput, SegmentedControl } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { Cn } from '@/frontend/lib/utils';
import { HumanizeOrderStatus } from '@/frontend/utils/humanize';
import { OrderDetail } from './components/OrderDetail';
import { OrderList } from './components/OrderList';
import { ORDER_STEPS } from './lib/order-flow';
import { ordersService } from './services';
import type { OrderStatusTypeEnum } from './types';

type Filter = OrderStatusTypeEnum | 'ALL';

export function Orders() {
  useDocumentTitle('Orders');
  const { orderId } = useParams();
  const [status, setStatus] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const all = ordersService.useOrders();
  const list = ordersService.useOrders({ status: status === 'ALL' ? undefined : status, search: q || undefined });

  const count = (s: Filter) => (all.data ?? []).filter((o) => s === 'ALL' || o.status === s).length;
  const options = (['ALL', ...ORDER_STEPS] as Filter[]).map((s) => ({
    value: s,
    label: s === 'ALL' ? 'All' : HumanizeOrderStatus(s),
    count: all.data ? count(s) : undefined,
  }));

  return (
    <div className="page">
      <PageHeader title="Orders" description="Release orders to picking, pick lines from their bins, pack and ship." />
      <div className={Cn('split', orderId && 'split-detail-open')}>
        <section className="card card-flush split-list" aria-label="Order list">
          <div className="filters filters-stack">
            <SearchInput label="Search orders" placeholder="Order number or customer…" value={search} onChange={setSearch} busy={list.isFetching && !list.isPending} />
            <SegmentedControl label="Filter by status" size="sm" value={status} options={options} onChange={setStatus} />
          </div>
          {list.isPending ? (
            <SkeletonRows rows={6} height={72} label="Loading orders" />
          ) : list.isError ? (
            <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
          ) : !list.data.length ? (
            <EmptyState
              icon="orders"
              title="No orders match"
              action={
                <Button size="sm" onClick={() => (setStatus('ALL'), setSearch(''))}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <OrderList orders={list.data} selectedId={orderId} />
          )}
        </section>
        <section className="card split-detail" aria-label="Order detail">
          {orderId ? <OrderDetail key={orderId} id={orderId} /> : <EmptyState icon="orders" title="Select an order">Pick an order on the left to see its lines and next step.</EmptyState>}
        </section>
      </div>
    </div>
  );
}
