import type { NavItemType } from '@/frontend/components/layout';
import { paths } from './paths';

export const NAVIGATION: NavItemType[] = [
  { label: 'Warehouse floor', path: paths.warehouse, icon: 'warehouse' },
  { label: 'Dashboard', path: paths.dashboard, icon: 'dashboard' },
  { label: 'Inventory', path: paths.inventory, icon: 'box', badge: 'inventory' },
  { label: 'Orders', path: paths.orders, icon: 'orders', badge: 'orders' },
  { label: 'Incoming deliveries', path: paths.deliveries, icon: 'truck', badge: 'deliveries' },
  { label: 'Locations', path: paths.locations, icon: 'grid' },
  { label: 'Activity history', path: paths.activity, icon: 'clock' },
];
