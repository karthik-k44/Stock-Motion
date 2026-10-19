import { Link, useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { ConfirmManager } from '@/frontend/components/modal';
import { ProgressBar } from '@/frontend/components/progress';
import { ToastManager } from '@/frontend/components/toast';
import { paths } from '@/frontend/config/paths';
import { TRUCK_PHASE_LABEL, truckStore, useTruck } from '@/frontend/features/warehouse/lib/truck-store';
import { FormatDateTime, FormatNumber } from '@/frontend/utils/format';
import { deliveriesService } from '../services';
import type { ReceiveDeliveryInput } from '../types';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { ReceiveLinesForm } from './ReceiveLinesForm';

export function DeliveryDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const truck = useTruck();
  const { data: d, isPending, isError, error, refetch } = deliveriesService.useDelivery(id);

  if (isPending) return <SkeletonRows rows={5} height={48} label="Loading delivery" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const onDock = truck.phase !== 'IDLE' && truck.delivery?.id === d.id;
  const received = d.status === 'RECEIVED';

  const receive = async (input: ReceiveDeliveryInput, watch: boolean) => {
    const total = input.lines.reduce((s, l) => s + l.received, 0);
    const diffs = input.lines.filter((l) => l.received !== d.lines.find((x) => x.sku === l.sku)?.expected).length;
    const ok = await ConfirmManager.Ask({
      title: `Receive ${d.id}?`,
      message: `${d.truck} docks at Dock 1 and unloads. ${FormatNumber(total)} units will be added to stock${diffs ? ` (${diffs} line${diffs > 1 ? 's' : ''} differ from expected)` : ''}.`,
      confirmLabel: 'Receive & unload',
    });
    if (!ok) return;
    if (!truckStore.Start(d, { quantities: input.lines })) return ToastManager.Error('Dock 1 is busy', 'Wait for the current truck to leave');
    if (watch) navigate(paths.warehouse);
  };

  return (
    <article className="order-detail" aria-labelledby="dlv-title">
      <Link to={paths.deliveries} className="link back-link">← All deliveries</Link>
      <header className="order-detail-head">
        <div>
          <h2 id="dlv-title" className="order-detail-title">
            <span className="mono">{d.id}</span> · {d.supplier}
          </h2>
          <p className="muted small">
            {d.truck} · plate {d.plate} · expected {FormatDateTime(d.expectedAt)}
            {d.receivedAt && ` · received ${FormatDateTime(d.receivedAt)}`}
          </p>
        </div>
        <DeliveryStatusBadge status={d.status} />
      </header>

      {onDock && (
        <div className="alert alert-info" role="status">
          <p className="strong">On Dock 1 now — {TRUCK_PHASE_LABEL[truck.phase]}</p>
          {truck.phase === 'UNLOADING' && <ProgressBar value={truck.unloaded} max={Math.min(6, d.lines.length)} label="Unloading progress" />}
          <Button size="sm" icon="warehouse" onClick={() => navigate(paths.warehouse)}>
            Watch on the floor
          </Button>
        </div>
      )}

      {received ? (
        <div className="table-wrap">
          <table className="table table-compact">
            <caption className="sr-only">Received lines</caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Bin</th>
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
                  <td className="num">{l.expected}</td>
                  <td className={l.received !== l.expected ? 'num text-critical' : 'num'}>{l.received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ReceiveLinesForm key={d.id} delivery={d} busy={truck.phase !== 'IDLE'} onSubmit={receive} />
      )}
    </article>
  );
}
