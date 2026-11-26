import type { NavItemType } from '@/frontend/components/layout';
import type { TemplateLabelsType } from '@/frontend/features/businesses/types';
import { paths } from './paths';

/** Sidebar sections, in order: what's happening, what's on the shelves, what goes out, what comes in, the business. */
const NavGroupEnum = {
  OVERVIEW: 'Overview',
  STOCK: 'Stock',
  SALES: 'Sales',
  PURCHASING: 'Purchasing',
  BUSINESS: 'Business',
} as const;

/** The sidebar, grouped by category and worded in the business's own vocabulary (Tickets, Jobs, Sales orders …). */
export const BuildNavigation = (labels: TemplateLabelsType, isManager: boolean): NavItemType[] => [
  { label: 'Live world', path: paths.world, icon: 'globe', group: NavGroupEnum.OVERVIEW },
  { label: 'Dashboard', path: paths.dashboard, icon: 'dashboard', group: NavGroupEnum.OVERVIEW },
  { label: 'Activity history', path: paths.activity, icon: 'clock', group: NavGroupEnum.OVERVIEW },

  { label: labels.items, path: paths.inventory, icon: 'box', group: NavGroupEnum.STOCK, badge: 'inventory' },
  { label: labels.locations, path: paths.locations, icon: 'grid', group: NavGroupEnum.STOCK },

  { label: labels.orders, path: paths.orders, icon: 'orders', group: NavGroupEnum.SALES, badge: 'orders' },
  { label: labels.customers, path: paths.customers, icon: 'user', group: NavGroupEnum.SALES },

  { label: labels.deliveries, path: paths.deliveries, icon: 'truck', group: NavGroupEnum.PURCHASING, badge: 'deliveries' },
  { label: labels.suppliers, path: paths.suppliers, icon: 'store', group: NavGroupEnum.PURCHASING },

  { label: 'Team', path: paths.team, icon: 'users', group: NavGroupEnum.BUSINESS },
  { label: 'Billing', path: paths.billing, icon: 'money', group: NavGroupEnum.BUSINESS },
  { label: 'Invoices', path: paths.invoices, icon: 'receipt', group: NavGroupEnum.BUSINESS },
  ...(isManager ? [{ label: 'Settings', path: paths.settings, icon: 'cog' as const, group: NavGroupEnum.BUSINESS }] : []),
];
