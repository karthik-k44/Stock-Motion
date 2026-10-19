import { HumanizeCategory, HumanizeReason } from '@/frontend/utils/humanize';
import {
  AdjustModeTypeEnum,
  AdjustReasonTypeEnum,
  CategoryTypeEnum,
  ItemFilterStatusTypeEnum,
} from '../types';

export const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  ...Object.values(CategoryTypeEnum).map((c) => ({ value: c, label: HumanizeCategory(c) })),
];

export const AISLE_OPTIONS = [
  { value: '', label: 'All aisles' },
  { value: 'A', label: 'Aisle A · Electronics & Office' },
  { value: 'B', label: 'Aisle B · Home & Kitchen' },
  { value: 'C', label: 'Aisle C · Apparel' },
  { value: 'D', label: 'Aisle D · Outdoor & Health' },
];

export const STATUS_FILTERS: { value: ItemFilterStatusTypeEnum | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: ItemFilterStatusTypeEnum.IN_STOCK, label: 'In stock' },
  { value: ItemFilterStatusTypeEnum.LOW, label: 'Low' },
  { value: ItemFilterStatusTypeEnum.OUT, label: 'Out' },
  { value: ItemFilterStatusTypeEnum.RESERVED, label: 'Reserved' },
  { value: ItemFilterStatusTypeEnum.INCOMING, label: 'Incoming' },
];

export const ADJUST_MODES = [
  { value: AdjustModeTypeEnum.ADD, label: 'Add' },
  { value: AdjustModeTypeEnum.REMOVE, label: 'Remove' },
  { value: AdjustModeTypeEnum.SET, label: 'Set count' },
];

export const REASON_OPTIONS = Object.values(AdjustReasonTypeEnum).map((r) => ({ value: r, label: HumanizeReason(r) }));

/** On-hand quantity after an adjustment. */
export function NextOnHand(onHand: number, mode: AdjustModeTypeEnum, qty: number): number {
  if (mode === AdjustModeTypeEnum.ADD) return onHand + qty;
  if (mode === AdjustModeTypeEnum.REMOVE) return onHand - qty;
  return qty;
}
