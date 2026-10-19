import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { SearchInput } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { Cn } from '@/frontend/lib/utils';
import { FormatMoney, RelativeTime } from '@/frontend/utils/format';
import { CustomerDetail } from './components/CustomerDetail';
import { CustomerModal } from './components/CustomerModal';
import { customersService } from './services';

export function Customers() {
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  useDocumentTitle(labels.customers);
  const navigate = useNavigate();
  const { id } = useParams();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const q = useDebouncedValue(search.trim());
  const list = customersService.useCustomers(q || undefined);

  return (
    <div className="page">
      <PageHeader
        title={labels.customers}
        description={`Who buys from you, what they spend and their ${labels.orders.toLowerCase()}.`}
        actions={<Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Add {labels.customer.toLowerCase()}</Button>}
      />
      <div className={Cn('split', id && 'split-detail-open')}>
        <section className="card card-flush split-list" aria-label={`${labels.customer} list`}>
          <div className="filters filters-stack">
            <SearchInput label={`Search ${labels.customers.toLowerCase()}`} placeholder="Name, email or phone…" value={search} onChange={setSearch} busy={list.isFetching && !list.isPending} />
          </div>
          {list.isPending ? (
            <SkeletonRows rows={6} height={60} label="Loading" />
          ) : list.isError ? (
            <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
          ) : !list.data.length ? (
            <EmptyState icon="user" title={q ? 'Nobody matches' : `No ${labels.customers.toLowerCase()} yet`} />
          ) : (
            <ul className="order-list">
              {list.data.map((c) => (
                <li key={c.id}>
                  <Link to={paths.customer(c.id)} className={Cn('order-row', c.id === id && 'order-row-active')} aria-current={c.id === id ? 'page' : undefined}>
                    <span className="order-row-top">
                      <span className="strong">{c.name}</span>
                      <span className="mono small">{FormatMoney(c.totalSpent, business.currency)}</span>
                    </span>
                    <span className="order-row-meta muted small">
                      {c.orderCount} {labels.orders.toLowerCase()}{c.openOrders ? ` · ${c.openOrders} open` : ''}
                      {c.lastOrderAt && ` · last ${RelativeTime(c.lastOrderAt)}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card split-detail" aria-label="Detail">
          {id ? <CustomerDetail key={id} id={id} /> : <EmptyState icon="user" title={`Select a ${labels.customer.toLowerCase()}`}>See their {labels.orders.toLowerCase()} and spend.</EmptyState>}
        </section>
      </div>
      {creating && <CustomerModal onClose={() => setCreating(false)} onSaved={(newId) => !newId.startsWith('pending') && navigate(paths.customer(newId))} />}
    </div>
  );
}
