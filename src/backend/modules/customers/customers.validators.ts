import { z } from 'zod';

export const CustomerSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(80),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email('Enter a valid email')]).default(''),
  phone: z.string().trim().max(40).default(''),
  address: z.string().trim().max(200).default(''),
  notes: z.string().trim().max(500).default(''),
});
export type CustomerInput = z.infer<typeof CustomerSchema>;

export const ListCustomersQuerySchema = z.object({ search: z.string().trim().max(80).optional() });

export const CustomerIdParamSchema = z.object({ id: z.string().min(1) });
