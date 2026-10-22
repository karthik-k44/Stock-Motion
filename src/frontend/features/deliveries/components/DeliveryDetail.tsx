import { Link } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { FormatDateTime, FormatMoney, FormatNumber } from '@/frontend/utils/format';
import { deliveriesService } from '../services';
import { DeliveryStatusTypeEnum } from '../types';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { ReceiveLinesForm } from './ReceiveLinesForm';

export const DeliveryDetail = ({ number }: { number: string }) => {
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  const { data: d, isPending, isError, error, refetch } = deliveriesService.useDelivery(number);
  const status = deliveriesService.useUpdateStatusMutation();

  if (isPending) return <SkeletonRows rows={5} height={48} label="Loading" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const received = d.status === DeliveryStatusTypeEnum.RECEIVED;
  return (
    <article className="order-detail" aria-labelledby="dlv-title">
      <Link to={paths.deliveries} className="link back-link">← All {labels.deliveries.toLowerCase()}</Link>
      <header className="order-detail-head">
        <div>
          <h2 id="dlv-title" className="order-detail-title">
            <span className="mono">{d.number}</span> · {d.supplierName}
          </h2>
          <p className="muted small">
            {[d.vehicle && `${labels.vehicle}: ${d.vehicle}`, d.reference && `ref ${d.reference}`].filter(Boolean).join(' · ')}
            {(d.vehicle || d.reference) && ' · '}expected {FormatDateTime(d.expectedAt)}
            {d.receivedAt && ` · received ${FormatDateTime(d.receivedAt)}`} · {FormatMoney(d.totalCost, business.currency)}
          </p>
        </div>
        <DeliveryStatusBadge status={d.status} />
      </header>

      {!received && (
        <div className="order-actions">
          {d.status === DeliveryStatusTypeEnum.SCHEDULED && (
            <Button icon="truck" onClick={() => status.mutate({ number: d.number, to: DeliveryStatusTypeEnum.IN_TRANSIT })}>Mark on the way</Button>
          )}
          {d.status !== DeliveryStatusTypeEnum.ARRIVED && (
            <Button icon="box" onClick={() => status.mutate({ number: d.number, to: DeliveryStatusTypeEnum.ARRIVED })}>Mark arrived</Button>
          )}
        </div>
      )}

      {received ? (
        <div className="table-wrap">
          <table className="table table-compact">
            <caption className="sr-only">Received lines</caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">{labels.location}</th>
                <th scope="col" className="num">Expected</th>
                <th scope="col" className="num">Received</th>
              </tr>
            </thead>
            <tbody>
              {d.lines.map((l) => (
                <tr key={l.sku}>
                  <th scope="row">
                    <span className="cell-strong">{l.name}</span>
                    <span className="cell-sub mono">{l.sku}</span>
                  </th>
                  <td className="mono">{l.location ?? '—'}</td>
                  <td className="num">{FormatNumber(l.expected)} {l.unit}</td>
                  <td className={l.received !== l.expected ? 'num text-critical' : 'num'}>{FormatNumber(l.received ?? 0)} {l.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ReceiveLinesForm key={d.number} delivery={d} />
      )}
    </article>
  );
};
