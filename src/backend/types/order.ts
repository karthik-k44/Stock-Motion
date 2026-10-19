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
  status: string;
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
