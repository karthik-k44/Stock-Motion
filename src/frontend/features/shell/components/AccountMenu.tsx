import { Button } from '@/frontend/components/button';
import { authService } from '@/frontend/features/auth/services';
import { businessesService } from '@/frontend/features/businesses/services';

/** Who is signed in, their role here, and sign out. */
export function AccountMenu() {
  const { data: account } = authService.useSession();
  const business = businessesService.useBusiness();
  const logout = authService.useLogoutMutation();
  const role = business.template.roles.find((r) => r.code === business.role)?.label ?? business.role;
  return (
    <div className="account">
      <span className="account-text">
        <span className="strong">{account?.name}</span>
        <span className="muted small">{role}</span>
      </span>
      <Button variant="ghost" size="sm" icon="logout" aria-label="Sign out" title="Sign out" loading={logout.isPending} onClick={() => logout.mutate()} />
    </div>
  );
}
