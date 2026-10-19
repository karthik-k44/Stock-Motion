import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { ConfirmManager } from '@/frontend/components/modal';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole } from '@/frontend/features/businesses/types';
import { OrderList } from '@/frontend/features/orders/components/OrderList';
import { FormatDate, FormatMoney } from '@/frontend/utils/format';
import { customersService } from '../services';
import { CustomerModal } from './CustomerModal';

export function CustomerDetail({ id }: { id: string }) {
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  const navigate = useNavigate();
  const { data: c, isPending, isError, error, refetch } = customersService.useCustomer(id);
  const remove = customersService.useDeleteCustomerMutation();
  const [editing, setEditing] = useState(false);

  if (isPending) return <SkeletonRows rows={5} height={48} label="Loading" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <article className="order-detail" aria-labelledby="cust-title">
      <Link to={paths.customers} className="link back-link">← All {labels.customers.toLowerCase()}</Link>
      <header className="order-detail-head">
        <div>
          <h2 id="cust-title" className="order-detail-title">{c.name}</h2>
          <p className="muted small">{[c.email, c.phone, c.address].filter(Boolean).join(' · ') || 'No contact details'} · since {FormatDate(c.createdAt)}</p>
        </div>
        <div className="page-actions">
          <Button size="sm" icon="edit" onClick={() => setEditing(true)}>Edit</Button>
          {IsManagementRole(business.role) && (
            <Button
              size="sm"
              variant="ghost"
              icon="trash"
              aria-label="Delete"
              onClick={async () => {
                const ok = await ConfirmManager.Ask({ title: `Delete ${c.name}?`, message: `Their past ${labels.orders.toLowerCase()} keep the name.`, confirmLabel: 'Delete', tone: 'danger' });
                if (ok) remove.mutate(c.id, { onSuccess: () => navigate(paths.customers) });
              }}
            />
          )}
        </div>
      </header>
      <dl className="item-stats">
        <div className="item-stat item-stat-strong"><dt>Spent</dt><dd><span className="item-stat-value">{FormatMoney(c.totalSpent, business.currency)}</span><span className="item-stat-hint">on closed {labels.orders.toLowerCase()}</span></dd></div>
        <div className="item-stat"><dt>{labels.orders}</dt><dd><span className="item-stat-value">{c.orderCount}</span><span className="item-stat-hint">{c.openOrders} open</span></dd></div>
        <div className="item-stat"><dt>Last</dt><dd><span className="item-stat-value">{c.lastOrderAt ? FormatDate(c.lastOrderAt) : '—'}</span><span className="item-stat-hint">most recent</span></dd></div>
      </dl>
      {c.notes && <p className="note">{c.notes}</p>}
      <h3 className="section-title">{labels.orders}</h3>
      {c.orders.length ? <OrderList orders={c.orders} /> : <p className="muted small">No {labels.orders.toLowerCase()} yet.</p>}
      {editing && <CustomerModal customer={c} onClose={() => setEditing(false)} />}
    </article>
  );
}
