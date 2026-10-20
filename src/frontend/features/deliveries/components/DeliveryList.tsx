import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { FormatDateTime, FormatNumber } from '@/frontend/utils/format';
import type { DeliveryResponseType } from '../types';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';

export const DeliveryList = ({ deliveries, selected }: { deliveries: DeliveryResponseType[]; selected?: string }) => {
  return (
    <ul className="order-list">
      {deliveries.map((d) => (
        <li key={d.number}>
          <Link to={paths.delivery(d.number)} className={Cn('order-row', d.number === selected && 'order-row-active')} aria-current={d.number === selected ? 'page' : undefined}>
            <span className="order-row-top">
              <span className="mono strong">{d.number}</span>
              <DeliveryStatusBadge status={d.status} />
            </span>
            <span className="order-row-customer">{d.supplierName}</span>
            <span className="order-row-meta muted small">
              {[d.vehicle, d.reference].filter(Boolean).join(' · ')}
              {(d.vehicle || d.reference) && ' · '}
              {d.lines.length} line{d.lines.length === 1 ? '' : 's'} · {FormatNumber(d.totalExpected)} units ·{' '}
              {d.receivedAt ? `received ${FormatDateTime(d.receivedAt)}` : `expected ${FormatDateTime(d.expectedAt)}`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};
