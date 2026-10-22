export const ItemKindTypeEnum = {
  /** Counted on a shelf */
  STOCK: 'STOCK',
  /** Built from components: a menu item, job kit or bundle */
  MADE: 'MADE',
  /** Sold but never stocked: labour, call-out fee, delivery charge */
  SERVICE: 'SERVICE',
} as const;
export type ItemKindTypeEnum = (typeof ItemKindTypeEnum)[keyof typeof ItemKindTypeEnum];

export const StockStatusTypeEnum = {
  IN_STOCK: 'IN_STOCK',
  LOW: 'LOW',
  OUT: 'OUT',
} as const;
export type StockStatusTypeEnum = (typeof StockStatusTypeEnum)[keyof typeof StockStatusTypeEnum];

export const MovementTypeEnum = {
  RECEIPT: 'RECEIPT',
  CONSUME: 'CONSUME',
  ADJUSTMENT: 'ADJUSTMENT',
  RELOCATION: 'RELOCATION',
} as const;
export type MovementTypeEnum = (typeof MovementTypeEnum)[keyof typeof MovementTypeEnum];

export const AdjustModeTypeEnum = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  SET: 'SET',
} as const;
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
  /** Allocated to orders in a reserving stage */
  reserved: number;
  /** Stock: on hand − reserved. Made items: how many can be made from available components. */
  available: number;
  /** Expected on deliveries that have not been received */
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

export type ComponentResponseType = {
  sku: string;
  name: string;
  unit: string;
  qty: number;
  available: number;
};

export type ItemDetailResponseType = ItemResponseType & {
  supplierName: string | null;
  /** What a made item is built from */
  components: ComponentResponseType[];
  /** Made items that use this stock item */
  usedIn: { sku: string; name: string; qty: number }[];
  movements: MovementResponseType[];
  openOrders: { number: string; customerName: string; status: string; qty: number; done: number }[];
  incomingDeliveries: { number: string; supplierName: string; expectedAt: string; expected: number }[];
};
