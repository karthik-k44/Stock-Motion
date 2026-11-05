import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { Field, Select } from '@/frontend/components/form';
import { ProgressBar } from '@/frontend/components/progress';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { inventoryService } from '@/frontend/features/inventory/services';
import { teamService } from '@/frontend/features/team/services';
import { FormatDateTime, IsPast } from '@/frontend/utils/format';
import { ordersService } from '../services';
import { NewOrderModal } from './NewOrderModal';
import { OrderActions } from './OrderActions';
import { OrderLines } from './OrderLines';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStepper } from './OrderStepper';

export const OrderDetail = ({ number }: { number: string }) => {
  const { template } = businessesService.useBusiness();
  const { data: order, isPending, isError, error, refetch } = ordersService.useGetOrder(number);
  const { data: items = [] } = inventoryService.useGetItems();
  const { data: members = [] } = teamService.useGetMembers();
  const update = ordersService.useUpdateOrder();
  const [editing, setEditing] = useState(false);
  const stock = useMemo(() => new Map(items.map((i) => [i.sku, i])), [items]);

  if (isPending) return <SkeletonRows rows={6} height={48} label="Loading" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const late = !order.closed && order.dueAt && IsPast(order.dueAt);
  return (
    <article className="order-detail" aria-labelledby="order-title">
      <Link to={paths.orders} className="link back-link">← All {template.labels.orders.toLowerCase()}</Link>
      <header className="order-detail-head">
        <div>
          <h2 id="order-title" className="order-detail-title">
            <span className="mono">{order.number}</span> · {order.customerId ? <Link className="link" to={paths.customer(order.customerId)}>{order.customerName}</Link> : order.customerName}
          </h2>
          <p className={late ? 'text-critical small' : 'muted small'}>
            {order.dueAt ? `Due ${FormatDateTime(order.dueAt)}${late ? ' · overdue' : ''} · ` : ''}opened {FormatDateTime(order.createdAt)}
            {order.closedAt && ` · closed ${FormatDateTime(order.closedAt)}`}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>
      <OrderStepper status={order.status} />
      <div className="order-meta">
        <Field id="assignee" label="Assigned to">
          <Select
            id="assignee"
            value={order.assigneeId ?? ''}
            disabled={order.closed}
            options={[{ value: '', label: 'Nobody' }, ...members.map((m) => ({ value: m.accountId, label: m.name }))]}
            onChange={(v) => update.mutate({ number: order.number, input: { assigneeId: v || null } })}
          />
        </Field>
        {template.orderFlow.some((s) => s.consumeLines) && (
          <div className="order-progress">
            <p className="small muted">{template.labels.consumed} {order.doneUnits} of {order.totalUnits} units</p>
            <ProgressBar value={order.doneUnits} max={order.totalUnits} label="Progress" />
          </div>
        )}
      </div>
      {order.notes && <p className="note">{order.notes}</p>}
      <OrderLines order={order} stock={stock} />
      <OrderActions order={order} onEditLines={() => setEditing(true)} />
      {editing && <NewOrderModal order={order} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />}
    </article>
  );
};
