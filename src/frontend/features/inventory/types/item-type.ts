import { z } from 'zod';

export const CategoryTypeEnum = {
  ELECTRONICS: 'ELECTRONICS',
  OFFICE: 'OFFICE',
  HOME_KITCHEN: 'HOME_KITCHEN',
  APPAREL: 'APPAREL',
  OUTDOOR: 'OUTDOOR',
  HEALTH_BEAUTY: 'HEALTH_BEAUTY',
} as const;
export type CategoryTypeEnum = (typeof CategoryTypeEnum)[keyof typeof CategoryTypeEnum];

export const StockStatusTypeEnum = { IN_STOCK: 'IN_STOCK', LOW: 'LOW', OUT: 'OUT' } as const;
export type StockStatusTypeEnum = (typeof StockStatusTypeEnum)[keyof typeof StockStatusTypeEnum];

/** Stock statuses plus the two derived filters (has reserved / has incoming stock). */
export const ItemFilterStatusTypeEnum = { ...StockStatusTypeEnum, RESERVED: 'RESERVED', INCOMING: 'INCOMING' } as const;
export type ItemFilterStatusTypeEnum = (typeof ItemFilterStatusTypeEnum)[keyof typeof ItemFilterStatusTypeEnum];

export const MovementTypeEnum = { RECEIPT: 'RECEIPT', PICK: 'PICK', ADJUSTMENT: 'ADJUSTMENT', RELOCATION: 'RELOCATION' } as const;
export type MovementTypeEnum = (typeof MovementTypeEnum)[keyof typeof MovementTypeEnum];

export const AdjustModeTypeEnum = { ADD: 'ADD', REMOVE: 'REMOVE', SET: 'SET' } as const;
export type AdjustModeTypeEnum = (typeof AdjustModeTypeEnum)[keyof typeof AdjustModeTypeEnum];

export const AdjustReasonTypeEnum = {
  CYCLE_COUNT: 'CYCLE_COUNT',
  DAMAGED: 'DAMAGED',
  FOUND: 'FOUND',
  RETURN: 'RETURN',
  OTHER: 'OTHER',
} as const;
export type AdjustReasonTypeEnum = (typeof AdjustReasonTypeEnum)[keyof typeof AdjustReasonTypeEnum];

export type ItemResponseType = {
  sku: string;
  name: string;
  category: CategoryTypeEnum;
  unit: string;
  onHand: number;
  reorderLevel: number;
  location: string | null;
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
  userId: string;
  note: string;
};

export type ItemDetailResponseType = ItemResponseType & {
  movements: MovementResponseType[];
  openOrders: { orderId: string; customer: string; status: string; qty: number; picked: number }[];
  incomingDeliveries: { deliveryId: string; supplier: string; expectedAt: string; expected: number }[];
};

export type ListItemsParams = {
  search?: string;
  category?: CategoryTypeEnum;
  aisle?: string;
  status?: ItemFilterStatusTypeEnum;
};

export const AdjustStockSchema = z
  .object({
    mode: z.nativeEnum(AdjustModeTypeEnum),
    qty: z.number({ required_error: 'Enter a quantity', invalid_type_error: 'Enter a quantity' }).int('Use a whole number').min(0, 'Quantity cannot be negative').max(100_000, 'That is more than a bin can hold'),
    reason: z.nativeEnum(AdjustReasonTypeEnum),
    note: z.string().trim().max(200, 'Keep the note under 200 characters'),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== AdjustModeTypeEnum.SET && v.qty < 1) ctx.addIssue({ code: 'custom', path: ['qty'], message: 'Enter at least 1' });
    if (v.reason === AdjustReasonTypeEnum.OTHER && !v.note) ctx.addIssue({ code: 'custom', path: ['note'], message: 'Explain the adjustment' });
  });
export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;

export type RelocateInput = { location: string };

/** Every inventory type under one name. */
export type TItemType = {
  Response: ItemResponseType;
  Detail: ItemDetailResponseType;
  Movement: MovementResponseType;
  ListParams: ListItemsParams;
  AdjustInput: AdjustStockInput;
  RelocateInput: RelocateInput;
  Category: CategoryTypeEnum;
  StockStatus: StockStatusTypeEnum;
  FilterStatus: ItemFilterStatusTypeEnum;
  AdjustMode: AdjustModeTypeEnum;
  AdjustReason: AdjustReasonTypeEnum;
};
