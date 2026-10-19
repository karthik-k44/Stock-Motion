import type { ItemResponseType } from '@/frontend/features/inventory/types';

export type LocationResponseType = {
  code: string;
  aisle: string;
  level: number;
  bin: number;
  item: ItemResponseType | null;
};

/** Every location type under one name. */
export type TLocationType = {
  Response: LocationResponseType;
};
