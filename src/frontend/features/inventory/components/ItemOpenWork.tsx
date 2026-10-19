import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { FormatDateTime } from '@/frontend/utils/format';
import type { ItemDetailResponseType } from '../types';

/** Orders waiting on this item and deliveries bringing more of it. */
export function ItemOpenWork({ item }: { item: ItemDetailResponseType }) {
  if (!item.openOrders.length && !item.incomingDeliveries.length) {
    return <p className="muted small">No open orders or incoming deliveries for this item.</p>;
  }
  return (
    <ul className="open-work">
      {item.openOrders.map((o) => (
        <li key={o.orderId}>
          <Link to={paths.order(o.orderId)} className="link mono">
            {o.orderId}
          </Link>{' '}
          {o.customer} · {o.qty - o.picked} to pick
          <span className={o.status === 'PICKING' ? 'tag tag-reserved' : 'tag'}>{o.status === 'PICKING' ? 'Reserved' : 'Not allocated'}</span>
        </li>
      ))}
      {item.incomingDeliveries.map((d) => (
        <li key={d.deliveryId}>
          <Link to={paths.delivery(d.deliveryId)} className="link mono">
            {d.deliveryId}
          </Link>{' '}
          {d.supplier} · +{d.expected} expected {FormatDateTime(d.expectedAt)}
          <span className="tag tag-incoming">Incoming</span>
        </li>
      ))}
    </ul>
  );
}
