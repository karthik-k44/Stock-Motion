import { z } from 'zod';
import { OrderStatusTypeEnum } from '@/backend/types/order';

export const ListOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatusTypeEnum).optional(),
  search: z.string().trim().max(80).optional(),
});
export type ListOrdersQuery = z.infer<typeof ListOrdersQuerySchema>;

export const OrderIdParamSchema = z.object({ id: z.string().regex(/^SO-\d+$/, 'Invalid order id') });

export const OrderLineParamSchema = OrderIdParamSchema.extend({
  sku: z.string().regex(/^[A-Z]{3}-\d{4}$/, 'Invalid SKU'),
});

export const UpdateOrderSchema = z.object({
  assignee: z.string().min(1, 'Choose who should pick this order'),
});
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
