import { z } from 'zod';
import { BusinessTypeEnum } from '@/backend/types/template';

export const CurrencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code, e.g. USD');

export const CreateBusinessSchema = z.object({
  name: z.string().trim().min(1, 'Name your business').max(80),
  type: z.nativeEnum(BusinessTypeEnum, { errorMap: () => ({ message: 'Choose a business type' }) }),
  currency: CurrencySchema.default('USD'),
  /** Start with the template's sample products, orders and deliveries */
  sampleData: z.boolean().default(false),
});
export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>;

export const UpdateBusinessSchema = z
  .object({
    name: z.string().trim().min(1, 'Name your business').max(80).optional(),
    currency: CurrencySchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.currency !== undefined, 'Nothing to update');
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>;

export const ResetDataSchema = z.object({ sampleData: z.boolean() });
export type ResetDataInput = z.infer<typeof ResetDataSchema>;

export const UpdateMemberSchema = z.object({ role: z.string().min(1, 'Choose a role') });
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;

export const AccountIdParamSchema = z.object({ accountId: z.string().min(1) });
