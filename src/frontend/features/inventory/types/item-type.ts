import { z } from 'zod';

export const ItemKindTypeEnum = { STOCK: 'STOCK', MADE: 'MADE', SERVICE: 'SERVICE' } as const;
export type ItemKindTypeEnum = (typeof ItemKindTypeEnum)[keyof typeof ItemKindTypeEnum];

export const StockStatusTypeEnum = { IN_STOCK: 'IN_STOCK', LOW: 'LOW', OUT: 'OUT' } as const;
export type StockStatusTypeEnum = (typeof StockStatusTypeEnum)[keyof typeof StockStatusTypeEnum];

/** Stock statuses plus the two derived filters (has reserved / has incoming stock). */
export const ItemFilterStatusTypeEnum = { ...StockStatusTypeEnum, RESERVED: 'RESERVED', INCOMING: 'INCOMING' } as const;
export type ItemFilterStatusTypeEnum = (typeof ItemFilterStatusTypeEnum)[keyof typeof ItemFilterStatusTypeEnum];

export const MovementTypeEnum = { RECEIPT: 'RECEIPT', CONSUME: 'CONSUME', ADJUSTMENT: 'ADJUSTMENT', RELOCATION: 'RELOCATION' } as const;
export type MovementTypeEnum = (typeof MovementTypeEnum)[keyof typeof MovementTypeEnum];

export const AdjustModeTypeEnum = { ADD: 'ADD', REMOVE: 'REMOVE', SET: 'SET' } as const;
export type AdjustModeTypeEnum = (typeof AdjustModeTypeEnum)[keyof typeof AdjustModeTypeEnum];

export const AdjustReasonTypeEnum = {
  CYCLE_COUNT: 'CYCLE_COUNT',
  DAMAGED: 'DAMAGED',
  WASTE: 'WASTE',
  FOUND: 'FOUND',
  RETURN: 'RETURN',
  OTHER: 'OTHER',
} as const;
export type AdjustReasonTypeEnum = (typeof AdjustReasonTypeEnum)[keyof typeof AdjustReasonTypeEnum];

export type ItemResponseType = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  kind: ItemKindTypeEnum;
  onHand: number;
  reorderLevel: number;
  cost: number;
  price: number;
  location: string | null;
  supplierId: string | null;
  reserved: number;
  available: number;
  incoming: number;
  status: StockStatusTypeEnum;
};

export type MovementResponseType = {
  id: number;
  at: string;
  sku: string;
  type: MovementTypeEnum;
  delta: number;
  balance: number;
  ref: string | null;
  accountId: string | null;
  actorName: string | null;
  note: string;
};

export type ComponentResponseType = { sku: string; name: string; unit: string; qty: number; available: number };

export type ItemDetailResponseType = ItemResponseType & {
  supplierName: string | null;
  components: ComponentResponseType[];
  usedIn: { sku: string; name: string; qty: number }[];
  movements: MovementResponseType[];
  openOrders: { number: string; customerName: string; status: string; qty: number; done: number }[];
  incomingDeliveries: { number: string; supplierName: string; expectedAt: string; expected: number }[];
};

export type CategoryResponseType = { code: string; name: string; itemCount: number };

export type ListItemsParams = {
  search?: string;
  category?: string;
  zone?: string;
  kind?: ItemKindTypeEnum;
  status?: ItemFilterStatusTypeEnum;
};

export const AdjustStockSchema = z
  .object({
    mode: z.nativeEnum(AdjustModeTypeEnum),
    qty: z.number({ required_error: 'Enter a quantity', invalid_type_error: 'Enter a quantity' }).int('Use a whole number').min(0, 'Quantity cannot be negative').max(10_000_000, 'That is too many'),
    reason: z.nativeEnum(AdjustReasonTypeEnum),
    note: z.string().trim().max(200, 'Keep the note under 200 characters'),
    /** Sent with a count, so a count taken against stale numbers is refused instead of overwriting newer stock */
    expectedOnHand: z.number().int().min(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== AdjustModeTypeEnum.SET && v.qty < 1) ctx.addIssue({ code: 'custom', path: ['qty'], message: 'Enter at least 1' });
    if (v.reason === AdjustReasonTypeEnum.OTHER && !v.note) ctx.addIssue({ code: 'custom', path: ['note'], message: 'Explain the adjustment' });
  });
export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;

export type RelocateInput = { location: string | null };

const money = (places: number, label: string) =>
  z.number({ invalid_type_error: `Enter a ${label}` }).min(0, `${label[0].toUpperCase()}${label.slice(1)} can't be negative`)
    .refine((v) => Math.abs(v * 10 ** places - Math.round(v * 10 ** places)) < 1e-6, `Use at most ${places} decimals`);

export const ItemFormSchema = z.object({
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._-]{0,39}$/, 'Letters, numbers, dots and dashes, e.g. MUG-001'),
  name: z.string().trim().min(1, 'Name the item').max(120),
  category: z.string().min(1, 'Choose a category'),
  unit: z.string().trim().min(1, 'Choose a unit').max(12),
  kind: z.nativeEnum(ItemKindTypeEnum),
  onHand: z.number({ invalid_type_error: 'Enter a quantity' }).int('Use a whole number').min(0),
  reorderLevel: z.number({ invalid_type_error: 'Enter a number' }).int('Use a whole number').min(0),
  cost: money(4, 'cost'),
  price: money(2, 'price'),
  location: z.string().nullable(),
  supplierId: z.string().nullable(),
});
export type ItemFormInput = z.infer<typeof ItemFormSchema>;
export type UpdateItemInput = Omit<ItemFormInput, 'sku' | 'kind' | 'onHand' | 'location'>;

export type ComponentInput = { sku: string; qty: number };

export type ImportPreviewResponseType = {
  rows: { line: number; sku: string; name: string; action: 'CREATE' | 'UPDATE'; errors: string[] }[];
  creates: number;
  updates: number;
  errorCount: number;
  newCategories: string[];
  newSuppliers: string[];
};

/** Every inventory type under one name. */
export type TItemType = {
  Response: ItemResponseType;
  Detail: ItemDetailResponseType;
  Movement: MovementResponseType;
  Component: ComponentResponseType;
  Category: CategoryResponseType;
  ListParams: ListItemsParams;
  AdjustInput: AdjustStockInput;
  RelocateInput: RelocateInput;
  FormInput: ItemFormInput;
  UpdateInput: UpdateItemInput;
  ImportPreview: ImportPreviewResponseType;
  Kind: ItemKindTypeEnum;
  StockStatus: StockStatusTypeEnum;
  FilterStatus: ItemFilterStatusTypeEnum;
  AdjustMode: AdjustModeTypeEnum;
  AdjustReason: AdjustReasonTypeEnum;
};
