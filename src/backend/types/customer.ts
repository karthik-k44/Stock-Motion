import type { OrderResponseType } from './order';

export type CustomerResponseType = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  orderCount: number;
  openOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
};

export type CustomerDetailResponseType = CustomerResponseType & {
  orders: OrderResponseType[];
};
