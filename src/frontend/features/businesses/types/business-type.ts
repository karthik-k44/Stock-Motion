import type { BusinessAccessType } from '@/frontend/features/billing/types';
import type { OrderStatusTypeEnum } from '@/frontend/features/orders/types';
import { z } from 'zod';

export const BusinessTypeEnum = {
  RETAIL: 'RETAIL',
  CAFE: 'CAFE',
  TRADES: 'TRADES',
} as const;
export type BusinessTypeEnum = (typeof BusinessTypeEnum)[keyof typeof BusinessTypeEnum];

export const BaseRoleTypeEnum = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
} as const;
export type BaseRoleTypeEnum = (typeof BaseRoleTypeEnum)[keyof typeof BaseRoleTypeEnum];

export const IsManagementRole = (role: string) => role === BaseRoleTypeEnum.OWNER || role === BaseRoleTypeEnum.MANAGER;

/** One stage of a template's order flow (mirrors the backend template). */
export type OrderStageType = {
  status: OrderStatusTypeEnum;
  label: string;
  action: string | null;
  reserves: boolean;
  consumeLines: boolean;
  consumeOnEnter: boolean;
  requiresAllDone: boolean;
  closed: boolean;
};

export type StorageZoneType = { code: string; name: string; levels: number; bins: number; levelLabel: string; binLabel: string };

export type TemplateLabelsType = {
  item: string;
  items: string;
  made: string;
  madePlural: string;
  order: string;
  orders: string;
  customer: string;
  customers: string;
  delivery: string;
  deliveries: string;
  supplier: string;
  suppliers: string;
  location: string;
  locations: string;
  consume: string;
  consumed: string;
  vehicle: string;
};

export type TemplateResponseType = {
  type: BusinessTypeEnum;
  name: string;
  tagline: string;
  labels: TemplateLabelsType;
  orderPrefix: string;
  deliveryPrefix: string;
  orderFlow: OrderStageType[];
  roles: { code: string; label: string }[];
  categories: { code: string; name: string }[];
  units: string[];
  zones: StorageZoneType[];
  exclusiveLocations: boolean;
};

export type BusinessResponseType = {
  id: string;
  name: string;
  type: BusinessTypeEnum;
  currency: string;
  role: string;
  createdAt: string;
};

/** `access`: whether it can be changed right now — its owner's plan decides. */
export type BusinessDetailResponseType = BusinessResponseType & { access: BusinessAccessType; template: TemplateResponseType };

export const CreateBusinessSchema = z.object({
  name: z.string().trim().min(1, 'Name your business').max(80),
  type: z.nativeEnum(BusinessTypeEnum, { errorMap: () => ({ message: 'Choose a business type' }) }),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Use a 3-letter code, e.g. USD'),
});
export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>;

/** Several inventories at once, right after choosing a plan: one per inventory paid for, all in one currency. */
export type CreateBusinessesInput = { currency: string; inventories: { name: string; type: BusinessTypeEnum }[] };

export type UpdateBusinessInput = { name?: string; currency?: string };
