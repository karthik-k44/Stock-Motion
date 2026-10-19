import { z } from 'zod';
import { PriceSchema, SkuSchema } from '@/backend/modules/items/items.validators';

const QueryBoolean = z.enum(['true', 'false']).transform((v) => v === 'true');

export const OrderNumberParamSchema = z.object({
  number: z.string().trim().toUpperCase().regex(/^[A-Z]{1,6}-\d{1,9}$/, 'Invalid order number'),
});

export const ListOrdersQuerySchema = z.object({
  status: z.string().max(30).optional(),
  open: QueryBoolean.optional(),
  search: z.string().trim().max(80).optional(),
  customerId: z.string().max(64).optional(),
});
export type ListOrdersQuery = z.infer<typeof ListOrdersQuerySchema>;

export const OrderLinesSchema = z
  .array(
    z.object({
      sku: SkuSchema,
      qty: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(100_000),
      /** Defaults to the item's current price */
      unitPrice: PriceSchema.optional(),
    }),
  )
  .min(1, 'Add at least one line')
  .max(100)
  .refine((lines) => new Set(lines.map((l) => l.sku)).size === lines.length, 'Each item can only be listed once');
export type OrderLinesInput = z.infer<typeof OrderLinesSchema>;

const DueAt = z.string().datetime({ offset: true, message: 'Use an ISO date and time' }).nullable();

export const CreateOrderSchema = z
  .object({
    customerId: z.string().min(1).nullable().default(null),
    /** Free label when there is no customer record, e.g. "Table 4" or "Walk-in" */
    customerName: z.string().trim().max(80).default(''),
    dueAt: DueAt.default(null),
    assigneeId: z.string().min(1).nullable().default(null),
    notes: z.string().trim().max(500).default(''),
    lines: OrderLinesSchema,
  })
  .refine((v) => v.customerId || v.customerName, { path: ['customerName'], message: 'Choose a customer or enter a name' });
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z.object({
  customerId: z.string().min(1).nullable().optional(),
  customerName: z.string().trim().min(1).max(80).optional(),
  dueAt: DueAt.optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  notes: z.string().trim().max(500).optional(),
});
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export const SetLinesSchema = z.object({ lines: OrderLinesSchema });
export type SetLinesInput = z.infer<typeof SetLinesSchema>;

/** The stage the client expects to move to — a stale screen gets a 409 instead of skipping a stage. */
export const AdvanceOrderSchema = z.object({ to: z.string().min(1).max(30) });
export type AdvanceOrderInput = z.infer<typeof AdvanceOrderSchema>;

export const ConsumeSchema = z.object({
  /** Leave out to finish every open line */
  sku: SkuSchema.optional(),
  /** Leave out to take the line's whole remaining quantity */
  qty: z.number().int().min(1).max(100_000).optional(),
});
export type ConsumeInput = z.infer<typeof ConsumeSchema>;
