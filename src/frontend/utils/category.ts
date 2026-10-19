import type { CategoryTypeEnum } from '@/frontend/features/inventory/types';

/** Categorical colours in fixed order (validated default palette, slots 1–6). Never cycled. */
export const CATEGORY_COLOR: Record<CategoryTypeEnum, string> = {
  ELECTRONICS: '#2a78d6',
  OFFICE: '#eb6834',
  HOME_KITCHEN: '#1baf7a',
  APPAREL: '#eda100',
  OUTDOOR: '#e87ba4',
  HEALTH_BEAUTY: '#008300',
};
