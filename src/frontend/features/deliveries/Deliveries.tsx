import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { SearchInput, SegmentedControl } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { Cn } from '@/frontend/lib/utils';
import { DeliveryDetail } from './components/DeliveryDetail';
import { DeliveryList } from './components/DeliveryList';
import { deliveriesService } from './services';
import { DeliveryViewTypeEnum } from './types';

const VIEWS = [
  { value: DeliveryViewTypeEnum.UPCOMING, label: 'Upcoming' },
  { value: DeliveryViewTypeEnum.RECEIVED, label: 'Received' },
  { value: DeliveryViewTypeEnum.ALL, label: 'All' },
];

export function Deliveries() {
  useDocumentTitle('Incoming deliveries');
  const { deliveryId } = useParams();
  const [view, setView] = useState<DeliveryViewTypeEnum>(DeliveryViewTypeEnum.UPCOMING);
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const list = deliveriesService.useDeliveries({ view, search: q || undefined });
  const book = deliveriesService.useBookDeliveryMutation();

  return (
    <div className="page">
      <PageHeader
        title="Incoming deliveries"
        description="Inbound trucks and what they carry. Receiving a delivery docks the truck, unloads it and adds the stock."
        actions={
          <Button icon="plus" loading={book.isPending} onClick={() => book.mutate()}>
            Book delivery
          </Button>
        }
      />
      <div className={Cn('split', deliveryId && 'split-detail-open')}>
        <section className="card card-flush split-list" aria-label="Delivery list">
          <div className="filters filters-stack">
            <SearchInput label="Search deliveries" placeholder="Reference, supplier or truck…" value={search} onChange={setSearch} busy={list.isFetching && !list.isPending} />
            <SegmentedControl label="Show deliveries" size="sm" value={view} options={VIEWS} onChange={setView} />
          </div>
          {list.isPending ? (
            <SkeletonRows rows={5} height={72} label="Loading deliveries" />
          ) : list.isError ? (
            <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
          ) : !list.data.length ? (
            <EmptyState icon="truck" title={view === 'UPCOMING' ? 'No trucks expected' : 'No deliveries match'}>
              {view === 'UPCOMING' ? 'Book a delivery or use “Simulate delivery” on the warehouse floor.' : 'Try another search.'}
            </EmptyState>
          ) : (
            <DeliveryList deliveries={list.data} selectedId={deliveryId} />
          )}
        </section>
        <section className="card split-detail" aria-label="Delivery detail">
          {deliveryId ? (
            <DeliveryDetail key={deliveryId} id={deliveryId} />
          ) : (
            <EmptyState icon="truck" title="Select a delivery">See expected items, count what arrived and receive it.</EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
