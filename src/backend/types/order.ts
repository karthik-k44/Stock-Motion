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
