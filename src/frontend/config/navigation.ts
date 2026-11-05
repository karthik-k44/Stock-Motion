import type { NavItemType } from '@/frontend/components/layout';
import type { TemplateLabelsType } from '@/frontend/features/businesses/types';
import { paths } from './paths';

const MENU = 'Menu';
const OTHER = 'Other menu';

/** The sidebar, worded in the business's own vocabulary (Tickets, Jobs, Sales orders …). */
export const BuildNavigation = (labels: TemplateLabelsType, isManager: boolean): NavItemType[] => {
  const nav: NavItemType[] = [
    { label: 'Live world', path: paths.world, icon: 'globe', group: MENU },
    { label: 'Dashboard', path: paths.dashboard, icon: 'dashboard', group: MENU },
    { label: labels.items, path: paths.inventory, icon: 'box', group: MENU, badge: 'inventory' },
    { label: labels.orders, path: paths.orders, icon: 'orders', group: MENU, badge: 'orders' },
    { label: labels.deliveries, path: paths.deliveries, icon: 'truck', group: MENU, badge: 'deliveries' },
    { label: labels.locations, path: paths.locations, icon: 'grid', group: MENU },
    { label: labels.customers, path: paths.customers, icon: 'user', group: OTHER },
    { label: labels.suppliers, path: paths.suppliers, icon: 'store', group: OTHER },
    { label: 'Team', path: paths.team, icon: 'users', group: OTHER },
    { label: 'Activity history', path: paths.activity, icon: 'clock', group: OTHER },
  ];
  if (isManager) nav.push({ label: 'Settings', path: paths.settings, icon: 'cog', group: OTHER });
  return nav;
};
