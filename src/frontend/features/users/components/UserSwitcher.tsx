import { Avatar } from '@/frontend/components/avatar';
import { ToastManager } from '@/frontend/components/toast';
import { useActingUser } from '@/frontend/hooks/use-acting-user';
import { HumanizeRole } from '@/frontend/utils/humanize';
import { usersService } from '../services';

/** "Acting as" — every change is attributed to the chosen warehouse user. */
export function UserSwitcher() {
  const { data: users } = usersService.useUsers();
  const { id, user, setActingUser } = useActingUser();
  return (
    <label className="topbar-control user-switch">
      {user ? <Avatar initials={user.initials} color={user.vest} name={user.name} size="sm" /> : <span className="avatar avatar-sm" />}
      <span className="sr-only">Acting as</span>
      <select
        className="topbar-select"
        value={id}
        disabled={!users}
        onChange={(e) => {
          setActingUser(e.target.value);
          const next = users?.find((u) => u.id === e.target.value);
          if (next) ToastManager.Info(`Now acting as ${next.name}`, 'Your changes will be recorded under this user');
        }}
      >
        {(users ?? []).map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {HumanizeRole(u.role)}
          </option>
        ))}
        {!users && <option value={id}>Loading users…</option>}
      </select>
    </label>
  );
}
