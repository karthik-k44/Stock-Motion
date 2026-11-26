import { z } from 'zod';
import { MAX_INVENTORIES } from '@/backend/modules/billing/plans';
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
});
export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>;

/** Several inventories at once, right after choosing a plan: one per inventory paid for, all in one currency. */
export const CreateBusinessesSchema = z.object({
  currency: CurrencySchema.default('USD'),
  inventories: z
    .array(CreateBusinessSchema.pick({ name: true, type: true }))
    .min(1, 'Add at least one inventory')
    .max(MAX_INVENTORIES),
});
export type CreateBusinessesInput = z.infer<typeof CreateBusinessesSchema>;

export const UpdateBusinessSchema = z
  .object({
    name: z.string().trim().min(1, 'Name your business').max(80).optional(),
    currency: CurrencySchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.currency !== undefined, 'Nothing to update');
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>;

export const UpdateMemberSchema = z.object({ role: z.string().min(1, 'Choose a role') });
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;

export const AccountIdParamSchema = z.object({ accountId: z.string().min(1) });
