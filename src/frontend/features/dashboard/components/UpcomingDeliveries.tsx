import { Link } from 'react-router';
import { Card } from '@/frontend/components/card';
import { EmptyState } from '@/frontend/components/feedback';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { DeliveryStatusBadge } from '@/frontend/features/deliveries/components/DeliveryStatusBadge';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import { FormatDateTime, FormatNumber } from '@/frontend/utils/format';

export function UpcomingDeliveries({ deliveries }: { deliveries: DeliveryResponseType[] }) {
  const { labels } = businessesService.useBusiness().template;
  return (
    <Card title={labels.deliveries} actions={<Link className="link small" to={paths.deliveries}>See all</Link>}>
      {!deliveries.length ? (
        <EmptyState icon="truck" title="Nothing on the way" />
      ) : (
        <ul className="mini-list">
          {deliveries.map((d) => (
            <li key={d.number}>
              <Link to={paths.delivery(d.number)} className="mini-row">
                <span>
                  <span className="mono strong">{d.number}</span> · {d.supplierName}
                  <span className="muted small block">Expected {FormatDateTime(d.expectedAt)} · {FormatNumber(d.totalExpected)} units</span>
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
