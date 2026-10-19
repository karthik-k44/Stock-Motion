import { useSyncExternalStore } from 'react';
import { usersService } from '@/frontend/features/users/services';
import { sessionState } from '@/frontend/services/session-state';

/** The warehouse user this browser acts as, plus a setter. */
export function useActingUser() {
  const id = useSyncExternalStore(sessionState.Subscribe, sessionState.GetActingUserId);
  const { data: users } = usersService.useUsers();
  const user = users?.find((u) => u.id === id) ?? null;
  return { id, user, setActingUser: sessionState.ReplaceActingUser };
}
