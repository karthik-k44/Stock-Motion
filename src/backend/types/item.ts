export const CategoryTypeEnum = {
  ELECTRONICS: 'ELECTRONICS',
  OFFICE: 'OFFICE',
  HOME_KITCHEN: 'HOME_KITCHEN',
  APPAREL: 'APPAREL',
  OUTDOOR: 'OUTDOOR',
  HEALTH_BEAUTY: 'HEALTH_BEAUTY',
} as const;
export type CategoryTypeEnum = (typeof CategoryTypeEnum)[keyof typeof CategoryTypeEnum];

export const StockStatusTypeEnum = {
  IN_STOCK: 'IN_STOCK',
  LOW: 'LOW',
  OUT: 'OUT',
} as const;
export type StockStatusTypeEnum = (typeof StockStatusTypeEnum)[keyof typeof StockStatusTypeEnum];

export const MovementTypeEnum = {
  RECEIPT: 'RECEIPT',
  PICK: 'PICK',
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
  /** Allocated to orders that are being picked */
  reserved: number;
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
  userId: string;
  note: string;
};

export type ItemDetailResponseType = ItemResponseType & {
  movements: MovementResponseType[];
  openOrders: { orderId: string; customer: string; status: string; qty: number; picked: number }[];
  incomingDeliveries: { deliveryId: string; supplier: string; expectedAt: string; expected: number }[];
};
