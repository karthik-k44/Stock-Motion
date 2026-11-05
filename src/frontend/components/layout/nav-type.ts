import type { IconName } from '@/frontend/components/icon';

export type NavItemType = {
  label: string;
  path: string;
  icon: IconName;
  /** The sidebar section it sits under */
  group: string;
  /** Key into the badge counts passed to `AppLayout` */
  badge?: string;
};
