import { z } from 'zod';

export const DeliveryFilterTypeEnum = {
  ALL: 'ALL',
  UPCOMING: 'UPCOMING',
  RECEIVED: 'RECEIVED',
} as const;

export const ListDeliveriesQuerySchema = z.object({
  view: z.nativeEnum(DeliveryFilterTypeEnum).default(DeliveryFilterTypeEnum.ALL),
  search: z.string().trim().max(80).optional(),
});
export type ListDeliveriesQuery = z.infer<typeof ListDeliveriesQuerySchema>;

export const DeliveryIdParamSchema = z.object({ id: z.string().regex(/^DLV-\d+$/, 'Invalid delivery id') });

export const ReceiveDeliverySchema = z.object({
  /** Actual quantities counted at the dock. Lines left out are received as expected. */
  lines: z
    .array(
      z.object({
        sku: z.string(),
        received: z.number().int('Received quantity must be a whole number').min(0, 'Received quantity cannot be negative').max(100_000),
      }),
    )
    .default([]),
});
export type ReceiveDeliveryInput = z.infer<typeof ReceiveDeliverySchema>;
