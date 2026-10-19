import type { NavItemType } from '@/frontend/components/layout';
import type { TemplateLabelsType } from '@/frontend/features/businesses/types';
import { paths } from './paths';

/** The sidebar, worded in the business's own vocabulary (Tickets, Jobs, Sales orders …). */
export function BuildNavigation(labels: TemplateLabelsType, isManager: boolean): NavItemType[] {
  const nav: NavItemType[] = [
    { label: 'Live world', path: paths.world, icon: 'globe' },
    { label: 'Dashboard', path: paths.dashboard, icon: 'dashboard' },
    { label: labels.items, path: paths.inventory, icon: 'box', badge: 'inventory' },
    { label: labels.orders, path: paths.orders, icon: 'orders', badge: 'orders' },
    { label: labels.deliveries, path: paths.deliveries, icon: 'truck', badge: 'deliveries' },
    { label: labels.locations, path: paths.locations, icon: 'grid' },
    { label: labels.customers, path: paths.customers, icon: 'user' },
    { label: labels.suppliers, path: paths.suppliers, icon: 'store' },
    { label: 'Team', path: paths.team, icon: 'users' },
    { label: 'Activity history', path: paths.activity, icon: 'clock' },
  ];
  if (isManager) nav.push({ label: 'Settings', path: paths.settings, icon: 'cog' });
  return nav;
}
