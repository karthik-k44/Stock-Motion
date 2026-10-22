import { z } from 'zod';
import { AdjustModeTypeEnum, AdjustReasonTypeEnum, ItemKindTypeEnum, StockStatusTypeEnum } from '@/backend/types/item';

export const SkuSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9._-]{0,39}$/, 'Use letters, numbers, dots and dashes, e.g. MUG-001');

const decimals = (places: number) => (v: number) => Math.abs(v * 10 ** places - Math.round(v * 10 ** places)) < 1e-6;

export const CostSchema = z
  .number({ invalid_type_error: 'Enter a cost' })
  .min(0, 'Cost cannot be negative')
  .max(99_999_999)
  .refine(decimals(4), 'Use at most 4 decimal places');

export const PriceSchema = z
  .number({ invalid_type_error: 'Enter a price' })
  .min(0, 'Price cannot be negative')
  .max(99_999_999)
  .refine(decimals(2), 'Use at most 2 decimal places');

export const QuantitySchema = z
  .number({ invalid_type_error: 'Quantity must be a number' })
  .int('Quantity must be a whole number')
  .min(0)
  .max(10_000_000);

export const ItemFilterStatusEnum = {
  ...StockStatusTypeEnum,
  RESERVED: 'RESERVED',
  INCOMING: 'INCOMING',
} as const;

export const ListItemsQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  category: z.string().max(40).optional(),
  zone: z.string().max(12).optional(),
  kind: z.nativeEnum(ItemKindTypeEnum).optional(),
  status: z.nativeEnum(ItemFilterStatusEnum).optional(),
});
export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>;

export const SkuParamSchema = z.object({ sku: SkuSchema });

export const ComponentsSchema = z
  .array(z.object({ sku: SkuSchema, qty: QuantitySchema.min(1, 'Use at least 1') }))
  .max(30, 'Up to 30 components')
  .refine((list) => new Set(list.map((c) => c.sku)).size === list.length, 'Each component can only be listed once');

const ItemFields = {
  name: z.string().trim().min(1, 'Name the item').max(120),
  category: z.string().trim().min(1, 'Choose a category').max(40),
  unit: z.string().trim().min(1, 'Choose a unit').max(12),
  reorderLevel: QuantitySchema.default(0),
  cost: CostSchema.default(0),
  price: PriceSchema.default(0),
  supplierId: z.string().min(1).nullable().default(null),
};

export const CreateItemSchema = z
  .object({
    sku: SkuSchema,
    kind: z.nativeEnum(ItemKindTypeEnum).default(ItemKindTypeEnum.STOCK),
    onHand: QuantitySchema.default(0),
    location: z.string().trim().toUpperCase().min(1).nullable().default(null),
    components: ComponentsSchema.default([]),
    ...ItemFields,
  })
  .superRefine((v, ctx) => {
    if (v.kind !== ItemKindTypeEnum.STOCK && v.onHand > 0) {
      ctx.addIssue({ code: 'custom', path: ['onHand'], message: 'Only stock items have stock on hand' });
    }
    if (v.kind !== ItemKindTypeEnum.STOCK && v.location) {
      ctx.addIssue({ code: 'custom', path: ['location'], message: 'Only stock items have a location' });
    }
    if (v.kind !== ItemKindTypeEnum.MADE && v.components.length) {
      ctx.addIssue({ code: 'custom', path: ['components'], message: 'Only made items have components' });
    }
  });
export type CreateItemInput = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = z.object(ItemFields);
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

export const SetComponentsSchema = z.object({ components: ComponentsSchema.refine((l) => l.length > 0, 'Add at least one component') });
export type SetComponentsInput = z.infer<typeof SetComponentsSchema>;

export const AdjustStockSchema = z
  .object({
    mode: z.nativeEnum(AdjustModeTypeEnum),
    qty: QuantitySchema,
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
  /** null takes the item off any shelf */
  location: z.string().trim().toUpperCase().min(1, 'Choose a location').nullable(),
});
export type RelocateInput = z.infer<typeof RelocateSchema>;
