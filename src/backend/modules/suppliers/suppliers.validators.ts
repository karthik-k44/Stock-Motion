import { z } from 'zod';

export const SupplierSchema = z.object({
  name: z.string().trim().min(1, 'Name the supplier').max(80),
  contact: z.string().trim().max(80).default(''),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email('Enter a valid email')]).default(''),
  phone: z.string().trim().max(40).default(''),
  leadDays: z.number().int().min(0).max(120).default(2),
});
export type SupplierInput = z.infer<typeof SupplierSchema>;

export const ListSuppliersQuerySchema = z.object({ search: z.string().trim().max(80).optional() });

export const SupplierIdParamSchema = z.object({ id: z.string().min(1) });
