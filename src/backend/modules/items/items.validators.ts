import { z } from 'zod';
import {
  AdjustModeTypeEnum,
  AdjustReasonTypeEnum,
  CategoryTypeEnum,
  StockStatusTypeEnum,
} from '@/backend/types/item';

export const ItemFilterStatusEnum = {
  ...StockStatusTypeEnum,
  RESERVED: 'RESERVED',
  INCOMING: 'INCOMING',
} as const;

export const ListItemsQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  category: z.nativeEnum(CategoryTypeEnum).optional(),
  aisle: z.enum(['A', 'B', 'C', 'D']).optional(),
  status: z.nativeEnum(ItemFilterStatusEnum).optional(),
});
export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>;

export const SkuParamSchema = z.object({ sku: z.string().regex(/^[A-Z]{3}-\d{4}$/, 'Invalid SKU') });

export const AdjustStockSchema = z
  .object({
    mode: z.nativeEnum(AdjustModeTypeEnum),
    qty: z.number({ invalid_type_error: 'Quantity must be a number' }).int('Quantity must be a whole number').min(0).max(100_000),
    reason: z.nativeEnum(AdjustReasonTypeEnum),
    note: z.string().trim().max(200, 'Keep the note under 200 characters').default(''),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== AdjustModeTypeEnum.SET && v.qty < 1) {
      ctx.addIssue({ code: 'custom', path: ['qty'], message: 'Quantity must be at least 1' });
    }
    if (v.reason === AdjustReasonTypeEnum.OTHER && !v.note) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: 'Add a note explaining the adjustment' });
    }
  });
export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;

export const RelocateSchema = z.object({
  location: z.string().regex(/^[A-D]-[1-3]-[1-4]$/, 'Choose a valid bin, e.g. B-2-4'),
});
export type RelocateInput = z.infer<typeof RelocateSchema>;
