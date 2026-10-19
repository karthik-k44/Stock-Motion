import type { IconName } from '@/frontend/components/icon';
import { HumanizeActivityKind } from '@/frontend/utils/humanize';
import { ActivityKindTypeEnum } from '../types';

export const KIND_ICON: Record<ActivityKindTypeEnum, IconName> = {
  DELIVERY: 'truck',
  ADJUSTMENT: 'sliders',
  ALLOCATION: 'package',
  CONSUME: 'box',
  STATUS: 'orders',
  RELOCATION: 'move',
  CATALOG: 'edit',
  TEAM: 'users',
  SYSTEM: 'clock',
};

export const KIND_OPTIONS = [
  { value: '', label: 'All activity' },
  ...Object.values(ActivityKindTypeEnum).map((k) => ({ value: k, label: HumanizeActivityKind(k) })),
];
