import { z } from 'zod';

export type SupplierResponseType = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  leadDays: number;
  itemCount: number;
  openDeliveries: number;
  createdAt: string;
};

export const SupplierSchema = z.object({
  name: z.string().trim().min(1, 'Name the supplier').max(80),
  contact: z.string().trim().max(80),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  phone: z.string().trim().max(40),
  leadDays: z.number({ invalid_type_error: 'Enter a number of days' }).int('Whole days').min(0).max(120),
});
export type SupplierInput = z.infer<typeof SupplierSchema>;

/** Every supplier type under one name. */
export type TSupplierType = {
  Response: SupplierResponseType;
  Input: SupplierInput;
};
