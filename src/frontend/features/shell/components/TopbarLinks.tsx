import { Link } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole } from '@/frontend/features/businesses/types';
import type { DashboardKpisType } from '@/frontend/features/dashboard/types';

/** The bell lights up for stock that needs attention and opens it, worst first; the cog opens settings for managers. */
export const TopbarLinks = ({ kpis }: { kpis?: DashboardKpisType }) => {
  const business = businessesService.useBusiness();
  const alerts = kpis ? kpis.lowStock + kpis.outOfStock : 0;
  return (
    <>
      <Link
        to={paths.inventoryWith({ status: kpis?.outOfStock ? 'OUT' : 'LOW' })}
        className="icon-link"
        aria-label={alerts ? `${alerts} stock alert${alerts === 1 ? '' : 's'}` : 'No stock alerts'}
        title="Stock alerts"
      >
        <Icon name="bell" size={18} />
        {alerts > 0 && <span className="icon-dot" aria-hidden />}
      </Link>
      {IsManagementRole(business.role) && (
        <Link to={paths.settings} className="icon-link" aria-label="Settings" title="Settings">
          <Icon name="cog" size={18} />
        </Link>
      )}
    </>
  );
};
