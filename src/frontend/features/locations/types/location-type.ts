import type { ItemResponseType } from '@/frontend/features/inventory/types';

export type LocationResponseType = {
  code: string;
  zone: string;
  name: string;
  items: ItemResponseType[];
};

export type CreateLocationInput = { code: string; zone: string; name: string };
