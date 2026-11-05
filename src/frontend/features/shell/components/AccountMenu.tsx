import { authService } from '@/frontend/features/auth/services';
import { businessesService } from '@/frontend/features/businesses/services';

/** Who is signed in and their role here. */
export const AccountMenu = () => {
  const { data: account } = authService.useGetSession();
  const business = businessesService.useBusiness();
  const role = business.template.roles.find((r) => r.code === business.role)?.label ?? business.role;

  return (
    <div className="account">
      <span className="account-text">
        <span className="strong">{account?.name}</span>
        <span className="muted small">{role}</span>
      </span>
    </div>
  );
};
