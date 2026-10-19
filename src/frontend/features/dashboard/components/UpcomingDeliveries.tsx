import { Link } from 'react-router';
import { Card } from '@/frontend/components/card';
import { EmptyState } from '@/frontend/components/feedback';
import { paths } from '@/frontend/config/paths';
import { DeliveryStatusBadge } from '@/frontend/features/deliveries/components/DeliveryStatusBadge';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import { FormatDateTime, FormatNumber } from '@/frontend/utils/format';

export function UpcomingDeliveries({ deliveries }: { deliveries: DeliveryResponseType[] }) {
  return (
    <Card title="Incoming deliveries" actions={<Link className="link small" to={paths.deliveries}>All deliveries</Link>}>
      {!deliveries.length ? (
        <EmptyState icon="truck" title="No trucks expected" />
      ) : (
        <ul className="mini-list">
          {deliveries.map((d) => (
            <li key={d.id}>
              <Link to={paths.delivery(d.id)} className="mini-row">
                <span>
                  <span className="mono strong">{d.id}</span> · {d.supplier}
                  <span className="muted small block">
                    {d.truck} · ETA {FormatDateTime(d.expectedAt)} · {FormatNumber(d.totalExpected)} units
                  </span>
                </span>
                <DeliveryStatusBadge status={d.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
