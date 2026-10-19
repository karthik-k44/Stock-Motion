import type { BusinessTypeEnum } from '@/frontend/features/businesses/types';
import type { WorldLayoutType } from '../types';
import { CAFE_WORLD } from './cafe-world';
import { RETAIL_WORLD } from './retail-world';
import { TRADES_WORLD } from './trades-world';

export const WORLDS: Record<BusinessTypeEnum, WorldLayoutType> = {
  RETAIL: RETAIL_WORLD,
  CAFE: CAFE_WORLD,
  TRADES: TRADES_WORLD,
};
