import { z } from 'zod';
import { CostSchema, SkuSchema } from '@/backend/modules/items/items.validators';
import { DeliveryStatusTypeEnum } from '@/backend/types/delivery';

export const DeliveryFilterTypeEnum = {
  ALL: 'ALL',
  UPCOMING: 'UPCOMING',
  RECEIVED: 'RECEIVED',
} as const;

export const ListDeliveriesQuerySchema = z.object({
  view: z.nativeEnum(DeliveryFilterTypeEnum).default(DeliveryFilterTypeEnum.ALL),
  search: z.string().trim().max(80).optional(),
  supplierId: z.string().max(64).optional(),
});

export const DeliveryNumberParamSchema = z.object({
  number: z.string().trim().toUpperCase().regex(/^[A-Z]{1,6}-\d{1,9}$/, 'Invalid delivery number'),
});

export const CreateDeliverySchema = z
  .object({
    supplierId: z.string().min(1).nullable().default(null),
    supplierName: z.string().trim().max(80).default(''),
    expectedAt: z.string().datetime({ offset: true, message: 'Use an ISO date and time' }),
    vehicle: z.string().trim().max(40).default(''),
    reference: z.string().trim().max(40).default(''),
    status: z.enum([DeliveryStatusTypeEnum.SCHEDULED, DeliveryStatusTypeEnum.IN_TRANSIT]).default(DeliveryStatusTypeEnum.SCHEDULED),
    lines: z
      .array(
        z.object({
          sku: SkuSchema,
          expected: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(10_000_000),
          /** Defaults to the item's current cost */
          unitCost: CostSchema.optional(),
        }),
      )
      .min(1, 'Add at least one line')
      .max(100)
      .refine((lines) => new Set(lines.map((l) => l.sku)).size === lines.length, 'Each item can only be listed once'),
  })
  .refine((v) => v.supplierId || v.supplierName, { path: ['supplierName'], message: 'Choose a supplier' });
export type CreateDeliveryInput = z.infer<typeof CreateDeliverySchema>;

export const ReorderSchema = z.object({
  /** Only reorder from this supplier */
  supplierId: z.string().min(1).nullable().default(null),
});
export type ReorderInput = z.infer<typeof ReorderSchema>;

/** Forward moves only; RECEIVED happens through receive. */
export const UpdateDeliveryStatusSchema = z.object({
  to: z.enum([DeliveryStatusTypeEnum.IN_TRANSIT, DeliveryStatusTypeEnum.ARRIVED]),
});
export type UpdateDeliveryStatusInput = z.infer<typeof UpdateDeliveryStatusSchema>;

export const ReceiveDeliverySchema = z.object({
  /** Actual quantities counted. Lines left out are received as expected. */
  lines: z
    .array(
      z.object({
        sku: SkuSchema,
        received: z.number().int('Received quantity must be a whole number').min(0, 'Received quantity cannot be negative').max(10_000_000),
      }),
    )
    .default([]),
});
export type ReceiveDeliveryInput = z.infer<typeof ReceiveDeliverySchema>;
