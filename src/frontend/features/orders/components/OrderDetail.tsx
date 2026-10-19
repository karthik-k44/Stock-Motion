import { useMemo } from 'react';
import { Link } from 'react-router';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { Field, Select } from '@/frontend/components/form';
import { ProgressBar } from '@/frontend/components/progress';
import { paths } from '@/frontend/config/paths';
import { inventoryService } from '@/frontend/features/inventory/services';
import { usersService } from '@/frontend/features/users/services';
import { FormatDateTime, IsPast } from '@/frontend/utils/format';
import { HumanizeRole } from '@/frontend/utils/humanize';
import { PreviewShortages } from '../lib/order-flow';
import { ordersService } from '../services';
import { OrderActions } from './OrderActions';
import { OrderLines } from './OrderLines';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStepper } from './OrderStepper';

export function OrderDetail({ id }: { id: string }) {
  const { data: order, isPending, isError, error, refetch } = ordersService.useOrder(id);
  const { data: items = [] } = inventoryService.useItems();
  const { data: users = [] } = usersService.useUsers();
  const reassign = ordersService.useUpdateOrderMutation();
  const stock = useMemo(() => new Map(items.map((i) => [i.sku, i])), [items]);

  if (isPending) return <SkeletonRows rows={6} height={48} label="Loading order" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const late = order.status !== 'SHIPPED' && IsPast(order.requestedDate);
  const preview = order.status === 'NEW' ? PreviewShortages(order, new Map(items.map((i) => [i.sku, i.available]))) : [];

  return (
    <article className="order-detail" aria-labelledby="order-title">
      <Link to={paths.orders} className="link back-link">← All orders</Link>
      <header className="order-detail-head">
        <div>
          <h2 id="order-title" className="order-detail-title">
            <span className="mono">{order.id}</span> · {order.customer}
          </h2>
          <p className={late ? 'text-critical small' : 'muted small'}>
            Requested {FormatDateTime(order.requestedDate)}
            {late && ' · overdue'} · created {FormatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>
      <OrderStepper status={order.status} />
      <div className="order-meta">
        <Field id="assignee" label="Picker">
          <Select
            id="assignee"
            value={order.assignee}
            disabled={order.status === 'SHIPPED' || reassign.isPending}
            options={users.map((u) => ({ value: u.id, label: `${u.name} · ${HumanizeRole(u.role)}` }))}
            onChange={(v) => reassign.mutate({ id: order.id, input: { assignee: v } })}
          />
        </Field>
        <div className="order-progress">
          <p className="small muted">
            Picked {order.pickedUnits} of {order.totalUnits} units
          </p>
          <ProgressBar value={order.pickedUnits} max={order.totalUnits} label="Picking progress" />
        </div>
      </div>
      <OrderLines order={order} stock={stock} />
      <OrderActions order={order} preview={preview} />
    </article>
  );
}
