import { Button } from '@/frontend/components/button';
import { ConfirmManager } from '@/frontend/components/modal';
import { ProgressBar } from '@/frontend/components/progress';
import { deliveriesService } from '@/frontend/features/deliveries/services';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import { Cn } from '@/frontend/lib/utils';
import { FormatNumber, FormatTime } from '@/frontend/utils/format';
import { TRUCK_PHASE_LABEL, truckStore, useTruck, type TruckPhaseTypeEnum } from '../lib/truck-store';

const STEPS: { phase: TruckPhaseTypeEnum; label: string }[] = [
  { phase: 'APPROACHING', label: 'Approach' },
  { phase: 'PARKING', label: 'Park' },
  { phase: 'UNLOADING', label: 'Unload' },
  { phase: 'RECEIVED', label: 'Received' },
];
const ORDER: TruckPhaseTypeEnum[] = ['IDLE', 'APPROACHING', 'PARKING', 'UNLOADING', 'RECEIVED', 'DEPARTING'];

/** Dock 1 status with the controls to trigger or replay a delivery. */
export function TruckPanel() {
  const truck = useTruck();
  const { data: upcoming = [] } = deliveriesService.useDeliveries({ view: 'UPCOMING' });
  const { data: received = [] } = deliveriesService.useDeliveries({ view: 'RECEIVED' });
  const book = deliveriesService.useBookDeliveryMutation();
  const busy = truck.phase !== 'IDLE';
  const next = upcoming[0];
  const lastReceived = received[0];
  const at = ORDER.indexOf(truck.phase);
  const lines = Math.min(6, truck.delivery?.lines.length ?? 0);

  const simulate = async () => {
    let target: DeliveryResponseType | undefined = next;
    if (target) {
      const ok = await ConfirmManager.Ask({
        title: `Receive ${target.id}?`,
        message: `${target.truck} from ${target.supplier} will dock, unload and add ${FormatNumber(target.totalExpected)} units to stock.`,
        confirmLabel: 'Start delivery',
      });
      if (!ok) return;
    } else {
      const ok = await ConfirmManager.Ask({
        title: 'Book and receive a new delivery?',
        message: 'No deliveries are scheduled. A new truck will be booked to restock the lowest-cover items, then docked and received.',
        confirmLabel: 'Book & receive',
      });
      if (!ok) return;
      target = await book.mutateAsync().catch(() => undefined);
      if (!target) return;
    }
    truckStore.Start(target);
  };

  return (
    <section className="truck-panel" aria-labelledby="dock-title">
      <header className="truck-panel-head">
        <h2 id="dock-title" className="truck-panel-title">Dock 1</h2>
        <span className={Cn('dock-state', busy && 'dock-state-busy')} aria-live="polite">
          {truck.failed ? 'Receiving failed' : TRUCK_PHASE_LABEL[truck.phase]}
        </span>
      </header>
      {busy && truck.delivery ? (
        <>
          <p className="small">
            <strong>{truck.delivery.truck}</strong> · {truck.delivery.id} · {truck.delivery.supplier}
            {truck.replay && <span className="tag">Replay</span>}
          </p>
          <ol className="steps" aria-label="Arrival progress">
            {STEPS.map((s) => {
              const idx = ORDER.indexOf(s.phase);
              const state = at > idx ? 'done' : at === idx ? 'current' : 'todo';
              return (
                <li key={s.phase} className={`step step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                  {s.label}
                </li>
              );
            })}
          </ol>
          {truck.phase === 'UNLOADING' && <ProgressBar value={truck.unloaded} max={lines} label="Cartons unloaded" />}
        </>
      ) : (
        <p className="small muted">
          {next ? (
            <>
              Next: <strong>{next.id}</strong> · {next.supplier} · ETA {FormatTime(next.expectedAt)}
            </>
          ) : (
            'No deliveries scheduled — simulating books a new truck.'
          )}
        </p>
      )}
      <div className="truck-panel-actions">
        <Button variant="primary" icon="truck" size="sm" disabled={busy} loading={book.isPending} onClick={simulate}>
          Simulate delivery
        </Button>
        <Button
          icon="replay"
          size="sm"
          disabled={busy || !lastReceived}
          title={lastReceived ? `Replay ${lastReceived.id} (no stock change)` : 'Nothing received yet'}
          onClick={() => lastReceived && truckStore.Start(lastReceived, { replay: true })}
        >
          Replay arrival
        </Button>
      </div>
    </section>
  );
}
