import { EmptyState } from '@/frontend/components/feedback';
import { usersService } from '@/frontend/features/users/services';
import { Cn } from '@/frontend/lib/utils';
import { FormatDateTime, FormatSigned } from '@/frontend/utils/format';
import type { MovementResponseType, MovementTypeEnum } from '../types';

const TYPE_LABEL: Record<MovementTypeEnum, string> = {
  RECEIPT: 'Received',
  PICK: 'Picked',
  ADJUSTMENT: 'Adjusted',
  RELOCATION: 'Relocated',
};

export function ItemMovements({ movements }: { movements: MovementResponseType[] }) {
  const { data: users } = usersService.useUsers();
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
              <strong>{TYPE_LABEL[m.type]}</strong>
              {m.ref && <span className="mono"> · {m.ref}</span>} — {m.note}
            </p>
            <p className="muted small">
              {FormatDateTime(m.at)} · {users?.find((u) => u.id === m.userId)?.name ?? m.userId} · balance {m.balance}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
