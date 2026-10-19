import { useEffect } from 'react';
import { usersService } from '@/frontend/features/users/services';
import { UserRoleTypeEnum, type UserResponseType } from '@/frontend/features/users/types';
import { useMotion } from '@/frontend/hooks/use-motion';
import { realtime, type DataChangedEvent } from '@/frontend/services/socket';
import { ByRole, crewRoutines } from '../lib/crew-routines';
import { crewStore } from '../lib/crew-store';

type ActivityEvent = DataChangedEvent['activity'][number];

/** Turn what just happened (from any browser tab) into who walks where. */
function choreograph(a: ActivityEvent, users: UserResponseType[]) {
  const { meta } = a;
  const skus = meta.skus ?? [];
  const locations = meta.locations ?? [];
  const picker = meta.assignee ?? ByRole(users, UserRoleTypeEnum.PICKER);
  const packer = ByRole(users, UserRoleTypeEnum.PACKER);
  const forklift = ByRole(users, UserRoleTypeEnum.FORKLIFT_OPERATOR);
  const ref = a.refId ?? '';

  switch (a.kind) {
    case 'ALLOCATION':
      if (picker) crewRoutines.Allocate(picker, ref, locations[0]);
      break;
    case 'PICK':
      if (picker) crewRoutines.Pick(picker, ref, skus, locations);
      break;
    case 'PACK':
      if (packer) crewRoutines.Pack(packer, ref);
      break;
    case 'SHIP':
      if (packer) crewRoutines.Ship(packer, ref);
      break;
    case 'ADJUSTMENT':
      crewRoutines.Inspect(a.userId, locations[0] ?? null, `Counting ${skus[0] ?? ''}`);
      break;
    case 'RELOCATION':
      if (forklift) crewRoutines.Relocate(forklift, skus[0] ?? '', meta.from, meta.to);
      break;
    default:
      // Deliveries are animated by the truck sequence itself.
      break;
  }
}

/** Creates the crew characters and keeps them in step with live activity. */
export function CrewDirector() {
  const { data: users } = usersService.useUsers();
  const { reduced } = useMotion();

  useEffect(() => {
    if (users) crewStore.EnsureWorkers(users);
  }, [users]);

  useEffect(() => {
    crewStore.SetReduced(reduced);
  }, [reduced]);

  useEffect(() => {
    if (!users) return;
    return realtime.OnDataChanged((e) => e.activity.forEach((a) => choreograph(a, users)));
  }, [users]);

  return null;
}
