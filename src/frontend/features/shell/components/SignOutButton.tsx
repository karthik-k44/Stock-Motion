import { Icon } from '@/frontend/components/icon';
import { paths } from '@/frontend/config/paths';
import { authService } from '@/frontend/features/auth/services';

export const SignOutButton = () => {
  const logout = authService.useLogout();

  // A full page load, so nothing of the session survives in memory; `replace`, so Back can't return into the app.
  const handleLogout = () => {
    void logout.mutateAsync().finally(() => window.location.replace(paths.login));
  };

  return (
    <button type="button" className="nav-link nav-signout" disabled={logout.isPending} aria-busy={logout.isPending} onClick={handleLogout}>
      {logout.isPending ? <span className="spinner" aria-hidden /> : <Icon name="logout" size={18} />}
      <span className="nav-label">Log out</span>
    </button>
  );
};
