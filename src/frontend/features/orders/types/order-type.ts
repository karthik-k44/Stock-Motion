import { z } from 'zod';

export const CANCELLED_STATUS = 'CANCELLED';

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
  status: string;
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

/** Every order type under one name. */
export type TOrderType = {
  Response: OrderResponseType;
  Line: OrderLineResponseType;
  ListParams: ListOrdersParams;
  LineInput: OrderLineInput;
  NewInput: NewOrderInput;
  UpdateInput: UpdateOrderInput;
  Shortage: OrderShortageType;
};
