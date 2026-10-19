import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { UserResponseType } from '@/frontend/features/users/types';
import { crewStore } from '../lib/crew-store';
import { CrewMember } from './CrewMember';

/** Renders every crew character and moves them each frame without re-rendering React. */
export function CrewLayer({ users, actingUserId }: { users: UserResponseType[]; actingUserId: string }) {
  const workers = useSyncExternalStore(crewStore.Subscribe, crewStore.Get);
  const els = useRef(new Map<string, HTMLDivElement>());

  const register = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) els.current.set(id, el);
    else els.current.delete(id);
  }, []);

  useEffect(
    () =>
      crewStore.OnFrame(() => {
        els.current.forEach((el, id) => {
          el.style.transform = `translate3d(${crewStore.Position(id)}px,0,0)`;
        });
      }),
    [],
  );

  return (
    <div className="crew" aria-hidden>
      {workers.map((w) => {
        const user = users.find((u) => u.id === w.id);
        return user ? <CrewMember key={w.id} worker={w} user={user} isYou={w.id === actingUserId} register={register} /> : null;
      })}
    </div>
  );
}
