/**
 * Every stage of every template's order flow (retail NEW → PICKING → PACKED → SHIPPED, café NEW → PREPARING → SERVED,
 * trades QUOTED → SCHEDULED → IN_PROGRESS → DONE), plus CANCELLED. A new template's stages are added here and in a
 * migration (the database stores this as the order_status enum).
 */
export const OrderStatusTypeEnum = {
  NEW: 'NEW',
  PICKING: 'PICKING',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  PREPARING: 'PREPARING',
  SERVED: 'SERVED',
  QUOTED: 'QUOTED',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatusTypeEnum = (typeof OrderStatusTypeEnum)[keyof typeof OrderStatusTypeEnum];

export type OrderLineResponseType = {
  sku: string;
  name: string;
  kind: string;
  unit: string;
  location: string | null;
  qty: number;
  /** Picked / used so far */
  done: number;
  unitPrice: number;
};

export type OrderResponseType = {
  number: string;
  customerId: string | null;
  customerName: string;
  status: OrderStatusTypeEnum;
  reserves: boolean;
  closed: boolean;
  cancelled: boolean;
  dueAt: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  notes: string;
  createdAt: string;
  closedAt: string | null;
  lines: OrderLineResponseType[];
  totalUnits: number;
  doneUnits: number;
  total: number;
};
