import type { CSSProperties } from 'react';
import type { UserResponseType } from '@/frontend/features/users/types';
import { Cn } from '@/frontend/lib/utils';
import { crewStore, type CrewWorker } from '../lib/crew-store';
import { FLOOR_Y } from '../lib/layout';

type Props = {
  worker: CrewWorker;
  user: UserResponseType;
  isYou: boolean;
  register: (id: string, el: HTMLDivElement | null) => void;
};

/** A warehouse user walking the floor (or driving the forklift). Position is set per frame by `CrewLayer`. */
export function CrewMember({ worker, user, isYou, register }: Props) {
  const forklift = worker.role === 'FORKLIFT_OPERATOR';
  const vars = { '--vest': user.vest, '--skin': user.skin, '--hat': user.hat } as CSSProperties;
  return (
    <div
      ref={(el) => register(worker.id, el)}
      className={Cn('cm', worker.moving && 'cm-walking', worker.carrying && 'cm-carrying', worker.dir < 0 && 'cm-left', forklift && 'cm-forklift', isYou && 'cm-you')}
      style={{ top: FLOOR_Y + 22 + worker.lane * 16 - 112, zIndex: 30 + worker.lane, transform: `translate3d(${crewStore.Position(worker.id)}px,0,0)` }}
      title={`${user.name}${worker.task ? ` — ${worker.task}` : ''}`}
    >
      {worker.task && <span className="cm-bubble">{worker.task}</span>}
      <span className="cm-tag">
        {isYou && <strong>You · </strong>}
        {user.name.split(' ')[0]}
      </span>
      <span className="cm-figure" style={vars}>
        {forklift ? (
          <>
            <span className="fl-mast" />
            <span className="fl-forks" />
            <span className="fl-load">
              <span className="fl-pallet" />
              <span className="fl-box" />
            </span>
            <span className="fl-guard" />
            <span className="fl-driver" />
            <span className="fl-body" />
            <span className="fl-wheel fl-wheel-f" />
            <span className="fl-wheel fl-wheel-b" />
          </>
        ) : (
          <>
            <span className="p-leg p-leg-back" />
            <span className="p-arm p-arm-back" />
            <span className="p-torso">
              <span className="p-stripe" />
            </span>
            <span className="p-leg p-leg-front" />
            <span className="p-head" />
            <span className="p-hat" />
            <span className="p-box" />
            <span className="p-arm p-arm-front" />
          </>
        )}
      </span>
    </div>
  );
}
