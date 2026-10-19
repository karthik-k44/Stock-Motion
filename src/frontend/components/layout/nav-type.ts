import type { IconName } from '@/frontend/components/icon';

export type NavItemType = {
  label: string;
  path: string;
  icon: IconName;
  /** Key into the badge counts passed to `AppLayout` */
  badge?: string;
};
