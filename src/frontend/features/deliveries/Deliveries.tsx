import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { SearchInput, SegmentedControl } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole } from '@/frontend/features/businesses/types';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { Cn } from '@/frontend/lib/utils';
import { DeliveryDetail } from './components/DeliveryDetail';
import { DeliveryList } from './components/DeliveryList';
import { NewDeliveryModal } from './components/NewDeliveryModal';
import { deliveriesService } from './services';
import { DeliveryViewTypeEnum } from './types';

const VIEWS = [
  { value: DeliveryViewTypeEnum.UPCOMING, label: 'Upcoming' },
  { value: DeliveryViewTypeEnum.RECEIVED, label: 'Received' },
  { value: DeliveryViewTypeEnum.ALL, label: 'All' },
];

export function Deliveries() {
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  useDocumentTitle(labels.deliveries);
  const navigate = useNavigate();
  const { number } = useParams();
  const [view, setView] = useState<DeliveryViewTypeEnum>(DeliveryViewTypeEnum.UPCOMING);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const q = useDebouncedValue(search.trim());
  const list = deliveriesService.useDeliveries({ view, search: q || undefined });
  const reorder = deliveriesService.useReorderMutation();
  const manager = IsManagementRole(business.role);

  return (
    <div className="page">
      <PageHeader
        title={labels.deliveries}
        description={`Stock coming in from your ${labels.suppliers.toLowerCase()}. Count it when it arrives and it goes straight into stock.`}
        actions={
          manager && (
            <>
              <Button icon="refresh" loading={reorder.isPending} title="Books a delivery per supplier for everything low or out" onClick={() => reorder.mutate(null)}>
                Reorder low stock
              </Button>
              <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Book {labels.delivery.toLowerCase()}</Button>
            </>
          )
        }
      />
      <div className={Cn('split', number && 'split-detail-open')}>
        <section className="card card-flush split-list" aria-label={`${labels.delivery} list`}>
          <div className="filters filters-stack">
            <SearchInput label={`Search ${labels.deliveries.toLowerCase()}`} placeholder={`Number, ${labels.supplier.toLowerCase()} or reference…`} value={search} onChange={setSearch} busy={list.isFetching && !list.isPending} />
            <SegmentedControl label="Show" size="sm" value={view} options={VIEWS} onChange={setView} />
          </div>
          {list.isPending ? (
            <SkeletonRows rows={5} height={72} label="Loading" />
          ) : list.isError ? (
            <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
          ) : !list.data.length ? (
            <EmptyState icon="truck" title={view === 'UPCOMING' ? 'Nothing on the way' : 'Nothing matches'}>
              {view === 'UPCOMING' && manager ? 'Book one, or let “Reorder low stock” do it for you.' : undefined}
            </EmptyState>
          ) : (
            <DeliveryList deliveries={list.data} selected={number} />
          )}
        </section>
        <section className="card split-detail" aria-label="Detail">
          {number ? <DeliveryDetail key={number} number={number} /> : <EmptyState icon="truck" title={`Select a ${labels.delivery.toLowerCase()}`}>See what’s coming, count it and receive it.</EmptyState>}
        </section>
      </div>
      {creating && <NewDeliveryModal onClose={() => setCreating(false)} onSaved={(n) => (setCreating(false), navigate(paths.delivery(n)))} />}
    </div>
  );
}
