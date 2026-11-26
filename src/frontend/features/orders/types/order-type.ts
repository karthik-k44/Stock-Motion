import { z } from 'zod';

/** Mirrors backend types/order.ts: every template's order stages, plus CANCELLED. */
export const OrderStatusTypeEnum = {
  NEW: 'NEW',
  PICKING: 'PICKING',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  PREPARING: 'PREPARING',
  SERVED: 'SERVED',
  QUOTED: 'QUOTED',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatusTypeEnum = (typeof OrderStatusTypeEnum)[keyof typeof OrderStatusTypeEnum];

export type OrderLineResponseType = {
  sku: string;
  name: string;
  kind: string;
  unit: string;
  location: string | null;
  qty: number;
  done: number;
  unitPrice: number;
};

export type OrderResponseType = {
  number: string;
  customerId: string | null;
  customerName: string;
  status: OrderStatusTypeEnum;
  reserves: boolean;
  closed: boolean;
  cancelled: boolean;
  dueAt: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  notes: string;
  createdAt: string;
  closedAt: string | null;
  lines: OrderLineResponseType[];
  totalUnits: number;
  doneUnits: number;
  total: number;
};

export type ListOrdersParams = { status?: string; open?: boolean; search?: string; customerId?: string };

export type OrderLineInput = { sku: string; qty: number; unitPrice?: number };

export const NewOrderSchema = z
  .object({
    customerId: z.string().nullable(),
    customerName: z.string().trim().max(80),
    dueAt: z.string().nullable(),
    assigneeId: z.string().nullable(),
    notes: z.string().trim().max(500),
    lines: z
      .array(z.object({ sku: z.string().min(1), qty: z.number({ invalid_type_error: 'Enter a quantity' }).int('Whole numbers only').min(1, 'At least 1') }))
      .min(1, 'Add at least one line'),
  })
  .refine((v) => v.customerId || v.customerName, { path: ['customerName'], message: 'Choose a customer or type a name' });
export type NewOrderInput = z.infer<typeof NewOrderSchema>;

export type UpdateOrderInput = {
  customerId?: string | null;
  customerName?: string;
  dueAt?: string | null;
  assigneeId?: string | null;
  notes?: string;
};

/** Stock shortage detail returned with a 409 when an order can't be reserved. */
export type OrderShortageType = { sku: string; name: string; unit: string; needed: number; available: number };
