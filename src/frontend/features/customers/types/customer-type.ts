import { z } from 'zod';
import type { OrderResponseType } from '@/frontend/features/orders/types';

export type CustomerResponseType = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  orderCount: number;
  openOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
};

export type CustomerDetailResponseType = CustomerResponseType & { orders: OrderResponseType[] };

export const CustomerSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(80),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(200),
  notes: z.string().trim().max(500),
});
export type CustomerInput = z.infer<typeof CustomerSchema>;
