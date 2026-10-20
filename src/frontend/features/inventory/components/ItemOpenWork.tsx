import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { FormatDateTime } from '@/frontend/utils/format';
import type { ItemDetailResponseType } from '../types';

/** Orders waiting on this item and deliveries bringing more of it. */
export const ItemOpenWork = ({ item }: { item: ItemDetailResponseType }) => {
  const { template } = businessesService.useBusiness();
  if (!item.openOrders.length && !item.incomingDeliveries.length) {
    return <p className="muted small">Not on any open {template.labels.orders.toLowerCase()} or {template.labels.deliveries.toLowerCase()}.</p>;
  }
  const reserving = new Set(template.orderFlow.filter((s) => s.reserves).map((s) => s.status));
  return (
    <ul className="open-work">
      {item.openOrders.map((o) => (
        <li key={o.number}>
          <Link to={paths.order(o.number)} className="link mono">{o.number}</Link> {o.customerName} · {o.qty - o.done} {item.unit} to {template.labels.consume.toLowerCase()}
          <span className={reserving.has(o.status) ? 'tag tag-reserved' : 'tag'}>{reserving.has(o.status) ? 'Reserved' : 'Not reserved yet'}</span>
        </li>
      ))}
      {item.incomingDeliveries.map((d) => (
        <li key={d.number}>
          <Link to={paths.delivery(d.number)} className="link mono">{d.number}</Link> {d.supplierName} · +{d.expected} {item.unit} expected {FormatDateTime(d.expectedAt)}
          <span className="tag tag-incoming">Incoming</span>
        </li>
      ))}
    </ul>
  );
};
