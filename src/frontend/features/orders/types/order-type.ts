export const OrderStatusTypeEnum = {
  NEW: 'NEW',
  PICKING: 'PICKING',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
} as const;
export type OrderStatusTypeEnum = (typeof OrderStatusTypeEnum)[keyof typeof OrderStatusTypeEnum];

export type OrderLineResponseType = {
  sku: string;
  name: string;
  location: string | null;
  qty: number;
  picked: number;
};

export type OrderResponseType = {
  id: string;
  customer: string;
  requestedDate: string;
  createdAt: string;
  status: OrderStatusTypeEnum;
  assignee: string;
  lines: OrderLineResponseType[];
  totalUnits: number;
  pickedUnits: number;
};

export type ListOrdersParams = { status?: OrderStatusTypeEnum; search?: string };

export type UpdateOrderInput = { assignee: string };

/** Allocation failure detail returned with a 409 from start-picking. */
export type OrderShortageType = { sku: string; name: string; needed: number; available: number };

/** Every order type under one name. */
export type TOrderType = {
  Response: OrderResponseType;
  Line: OrderLineResponseType;
  Status: OrderStatusTypeEnum;
  ListParams: ListOrdersParams;
  UpdateInput: UpdateOrderInput;
  Shortage: OrderShortageType;
};
