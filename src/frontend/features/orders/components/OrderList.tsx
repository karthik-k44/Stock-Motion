import { Link } from 'react-router';
import { ProgressBar } from '@/frontend/components/progress';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { Cn } from '@/frontend/lib/utils';
import { FormatDateTime, FormatMoney, IsPast, RelativeTime } from '@/frontend/utils/format';
import { StageOf } from '../lib/order-flow';
import type { OrderResponseType } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';

export const OrderList = ({ orders, selected }: { orders: OrderResponseType[]; selected?: string }) => {
  const business = businessesService.useBusiness();
  return (
    <ul className="order-list">
      {orders.map((o) => {
        const late = !o.closed && o.dueAt && IsPast(o.dueAt);
        const working = StageOf(business.template.orderFlow, o.status)?.consumeLines;
        return (
          <li key={o.number}>
            <Link to={paths.order(o.number)} className={Cn('order-row', o.number === selected && 'order-row-active')} aria-current={o.number === selected ? 'page' : undefined}>
              <span className="order-row-top">
                <span className="mono strong">{o.number}</span>
                <OrderStatusBadge status={o.status} />
              </span>
              <span className="order-row-customer">{o.customerName}</span>
              <span className="order-row-meta muted small">
                {o.lines.length} line{o.lines.length === 1 ? '' : 's'} · {FormatMoney(o.total, business.currency)} ·{' '}
                {o.closed ? (
                  <>{o.closedAt ? `closed ${RelativeTime(o.closedAt)}` : 'closed'}</>
                ) : o.dueAt ? (
                  <span className={late ? 'text-critical' : undefined}>{late ? 'Overdue · ' : 'Due '}{FormatDateTime(o.dueAt)}</span>
                ) : (
                  <>opened {RelativeTime(o.createdAt)}</>
                )}
              </span>
              {working && !o.closed && <ProgressBar value={o.doneUnits} max={o.totalUnits} label={`${o.number} progress`} />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
