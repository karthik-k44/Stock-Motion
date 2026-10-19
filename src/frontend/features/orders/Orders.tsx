import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { SearchInput, SegmentedControl } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { Cn } from '@/frontend/lib/utils';
import { NewOrderModal } from './components/NewOrderModal';
import { OrderDetail } from './components/OrderDetail';
import { OrderList } from './components/OrderList';
import { ordersService } from './services';
import type { ListOrdersParams } from './types';

const OPEN = 'OPEN';
const CLOSED = 'CLOSED';

export function Orders() {
  const { template } = businessesService.useBusiness();
  const { labels, orderFlow } = template;
  useDocumentTitle(labels.orders);
  const navigate = useNavigate();
  const { number } = useParams();
  const [filter, setFilter] = useState(OPEN);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const q = useDebouncedValue(search.trim());
  const open = ordersService.useOrders({ open: true });

  const params: ListOrdersParams =
    filter === OPEN ? { open: true } : filter === CLOSED ? { open: false } : { status: filter };
  const list = ordersService.useOrders({ ...params, search: q || undefined });
  const count = (status: string) => open.data?.filter((o) => o.status === status).length;
  const options = [
    { value: OPEN, label: 'Open', count: open.data?.length },
    ...orderFlow.filter((s) => !s.closed).map((s) => ({ value: s.status, label: s.label, count: count(s.status) })),
    { value: CLOSED, label: 'Closed' },
  ];

  return (
    <div className="page">
      <PageHeader
        title={labels.orders}
        description={`${orderFlow.map((s) => s.label).join(' → ')}. Stock is reserved and used as each ${labels.order.toLowerCase()} moves along.`}
        actions={<Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New {labels.order.toLowerCase()}</Button>}
      />
      <div className={Cn('split', number && 'split-detail-open')}>
        <section className="card card-flush split-list" aria-label={`${labels.order} list`}>
          <div className="filters filters-stack">
            <SearchInput label={`Search ${labels.orders.toLowerCase()}`} placeholder={`Number or ${labels.customer.toLowerCase()}…`} value={search} onChange={setSearch} busy={list.isFetching && !list.isPending} />
            <SegmentedControl label="Filter by stage" size="sm" value={filter} options={options} onChange={setFilter} />
          </div>
          {list.isPending ? (
            <SkeletonRows rows={6} height={72} label="Loading" />
          ) : list.isError ? (
            <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
          ) : !list.data.length ? (
            <EmptyState icon="orders" title={`No ${labels.orders.toLowerCase()} here`} action={<Button size="sm" onClick={() => setCreating(true)}>New {labels.order.toLowerCase()}</Button>} />
          ) : (
            <OrderList orders={list.data} selected={number} />
          )}
        </section>
        <section className="card split-detail" aria-label="Detail">
          {number ? <OrderDetail key={number} number={number} /> : <EmptyState icon="orders" title={`Select a ${labels.order.toLowerCase()}`}>See its lines and the next step.</EmptyState>}
        </section>
      </div>
      {creating && <NewOrderModal onClose={() => setCreating(false)} onSaved={(n) => (setCreating(false), navigate(paths.order(n)))} />}
    </div>
  );
}
