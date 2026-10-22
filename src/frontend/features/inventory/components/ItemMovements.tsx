import { EmptyState } from '@/frontend/components/feedback';
import { Cn } from '@/frontend/lib/utils';
import { FormatDateTime, FormatSigned } from '@/frontend/utils/format';
import { HumanizeMovement } from '@/frontend/utils/humanize';
import type { MovementResponseType } from '../types';

export const ItemMovements = ({ movements, unit }: { movements: MovementResponseType[]; unit: string }) => {
  if (!movements.length) return <EmptyState icon="clock" title="No stock movements yet" />;
  return (
    <ol className="movements">
      {movements.map((m) => (
        <li key={m.id} className="movement">
          <span className={Cn('movement-delta', m.delta > 0 && 'delta-up', m.delta < 0 && 'delta-down')}>
            {m.type === 'RELOCATION' ? '⇄' : FormatSigned(m.delta)}
          </span>
          <div className="movement-text">
            <p>
              <strong>{HumanizeMovement(m.type)}</strong>
              {m.ref && <span className="mono"> · {m.ref}</span>} — {m.note}
            </p>
            <p className="muted small">
              {FormatDateTime(m.at)} · {m.actorName ?? 'Someone who left'} · balance {m.balance} {unit}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
};
