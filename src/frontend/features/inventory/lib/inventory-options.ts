import type { TemplateLabelsType } from '@/frontend/features/businesses/types';
import { HumanizeReason } from '@/frontend/utils/humanize';
import { AdjustModeTypeEnum, AdjustReasonTypeEnum, ItemFilterStatusTypeEnum, ItemKindTypeEnum } from '../types';

export const STATUS_FILTERS: { value: ItemFilterStatusTypeEnum | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: ItemFilterStatusTypeEnum.IN_STOCK, label: 'In stock' },
  { value: ItemFilterStatusTypeEnum.LOW, label: 'Low' },
  { value: ItemFilterStatusTypeEnum.OUT, label: 'Out' },
  { value: ItemFilterStatusTypeEnum.RESERVED, label: 'Reserved' },
  { value: ItemFilterStatusTypeEnum.INCOMING, label: 'Incoming' },
];

/** The three kinds of things a business sells or stocks, in its own words. */
export const KindOptions = (labels: TemplateLabelsType) => [
  { value: ItemKindTypeEnum.STOCK, label: labels.items },
  { value: ItemKindTypeEnum.MADE, label: labels.madePlural },
  { value: ItemKindTypeEnum.SERVICE, label: 'Services' },
];

export const KindLabel = (labels: TemplateLabelsType, kind: ItemKindTypeEnum) =>
  kind === ItemKindTypeEnum.STOCK ? labels.item : kind === ItemKindTypeEnum.MADE ? labels.made : 'Service';

export const ADJUST_MODES = [
  { value: AdjustModeTypeEnum.ADD, label: 'Add' },
  { value: AdjustModeTypeEnum.REMOVE, label: 'Remove' },
  { value: AdjustModeTypeEnum.SET, label: 'Set count' },
];

export const REASON_OPTIONS = Object.values(AdjustReasonTypeEnum).map((r) => ({ value: r, label: HumanizeReason(r) }));
