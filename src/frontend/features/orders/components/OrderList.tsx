import { Link } from 'react-router';
import { ProgressBar } from '@/frontend/components/progress';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { FormatDate, IsPast } from '@/frontend/utils/format';
import type { OrderResponseType } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';

export function OrderList({ orders, selectedId }: { orders: OrderResponseType[]; selectedId?: string }) {
  return (
    <ul className="order-list">
      {orders.map((o) => {
        const late = o.status !== 'SHIPPED' && IsPast(o.requestedDate);
        return (
          <li key={o.id}>
            <Link
              to={paths.order(o.id)}
              className={Cn('order-row', o.id === selectedId && 'order-row-active')}
              aria-current={o.id === selectedId ? 'page' : undefined}
            >
              <span className="order-row-top">
                <span className="mono strong">{o.id}</span>
                <OrderStatusBadge status={o.status} />
              </span>
              <span className="order-row-customer">{o.customer}</span>
              <span className="order-row-meta muted small">
                {o.lines.length} lines · {o.totalUnits} units ·{' '}
                <span className={late ? 'text-critical' : undefined}>
                  {late ? 'Overdue · ' : 'Due '}
                  {FormatDate(o.requestedDate)}
                </span>
              </span>
              {(o.status === 'PICKING' || o.pickedUnits > 0) && o.status !== 'SHIPPED' && (
                <ProgressBar value={o.pickedUnits} max={o.totalUnits} label={`${o.id} picking progress`} />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
