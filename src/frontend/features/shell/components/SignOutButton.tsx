import { Icon } from '@/frontend/components/icon';
import { authService } from '@/frontend/features/auth/services';

export const SignOutButton = () => {
  const logout = authService.useLogout();

  const handleLogout = () => {
    logout.mutateAsync().then(() => {
      window.location.href = '/';
    });
  };

  return (
    <button type="button" className="nav-link nav-signout" disabled={logout.isPending} aria-busy={logout.isPending} onClick={handleLogout}>
      {logout.isPending ? <span className="spinner" aria-hidden /> : <Icon name="logout" size={18} />}
      <span className="nav-label">Log out</span>
    </button>
  );
};
