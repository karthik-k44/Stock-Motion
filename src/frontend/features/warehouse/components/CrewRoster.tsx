import { useSyncExternalStore } from 'react';
import { Avatar } from '@/frontend/components/avatar';
import { Card } from '@/frontend/components/card';
import type { UserResponseType } from '@/frontend/features/users/types';
import { HumanizeRole } from '@/frontend/utils/humanize';
import { crewStore } from '../lib/crew-store';
import { zoneAt } from '../lib/layout';

/** Text version of the moving characters: who is where, doing what. */
export function CrewRoster({ users, actingUserId }: { users: UserResponseType[]; actingUserId: string }) {
  const workers = useSyncExternalStore(crewStore.Subscribe, crewStore.Get);
  return (
    <Card title="On the floor" subtitle="Crew positions and current tasks, live">
      <ul className="roster" aria-live="polite">
        {users.map((u) => {
          const w = workers.find((x) => x.id === u.id);
          const where = w ? zoneAt(w.x).label : '—';
          return (
            <li key={u.id} className="roster-row">
              <Avatar initials={u.initials} color={u.vest} name={u.name} />
              <div className="roster-text">
                <p className="roster-name">
                  {u.name}
                  {u.id === actingUserId && <span className="tag">You</span>}
                </p>
                <p className="muted small">
                  {HumanizeRole(u.role)} · {w?.moving ? 'walking' : 'at'} {where}
                </p>
              </div>
              <p className={w?.task ? 'roster-task' : 'roster-task muted'}>{w?.task ?? 'Available'}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
