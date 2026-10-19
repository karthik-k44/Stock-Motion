import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { FormatDateTime, FormatNumber } from '@/frontend/utils/format';
import type { DeliveryResponseType } from '../types';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';

export function DeliveryList({ deliveries, selectedId }: { deliveries: DeliveryResponseType[]; selectedId?: string }) {
  return (
    <ul className="order-list">
      {deliveries.map((d) => (
        <li key={d.id}>
          <Link
            to={paths.delivery(d.id)}
            className={Cn('order-row', d.id === selectedId && 'order-row-active')}
            aria-current={d.id === selectedId ? 'page' : undefined}
          >
            <span className="order-row-top">
              <span className="mono strong">{d.id}</span>
              <DeliveryStatusBadge status={d.status} />
            </span>
            <span className="order-row-customer">{d.supplier}</span>
            <span className="order-row-meta muted small">
              {d.truck} · {d.plate} · {FormatNumber(d.totalExpected)} units ·{' '}
              {d.receivedAt ? `received ${FormatDateTime(d.receivedAt)}` : `ETA ${FormatDateTime(d.expectedAt)}`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
