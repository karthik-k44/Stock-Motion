import { Cn } from '@/frontend/lib/utils';
import { FLOOR_Y, STAGING_X } from '../lib/layout';
import type { TruckState } from '../lib/truck-store';

/** Receiving floor: pallets where unloaded cartons land before put-away. */
export function StagingArea({ truck }: { truck: TruckState }) {
  const { phase, delivery, unloaded, replay } = truck;
  const lines = delivery?.lines.slice(0, 6) ?? [];
  const visible = phase === 'UNLOADING' || phase === 'RECEIVED' || phase === 'DEPARTING';
  const done = phase === 'RECEIVED' || phase === 'DEPARTING';

  return (
    <div className="staging" style={{ left: STAGING_X, top: FLOOR_Y - 60 }} aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="pallet" style={{ left: i * 58 }} />
      ))}
      {visible &&
        lines.map((l, i) =>
          i < (done ? lines.length : unloaded) ? (
            <span key={`${truck.runId}-${l.sku}`} className={Cn('staged', phase === 'DEPARTING' && 'staged-leaving')} style={{ left: i * 58 + 4 }}>
              <span className="staged-label">{l.sku}</span>
              {done && !replay && <span className="staged-qty">+{l.received ?? l.expected}</span>}
            </span>
          ) : null,
        )}
    </div>
  );
}
