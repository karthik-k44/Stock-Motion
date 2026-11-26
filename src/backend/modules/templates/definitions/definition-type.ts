import type { DeliveryStatusTypeEnum } from '@/backend/types/delivery';
import type { OrderStatusTypeEnum } from '@/backend/types/order';
import type { ItemKindTypeEnum } from '@/backend/types/item';
import type { TemplateResponseType } from '@/backend/types/template';

/** Sample data a new business can start with. Times are relative to "now" so it always looks current. */
export type SampleDataType = {
  suppliers: { name: string; contact: string; email: string; phone: string; leadDays: number }[];
  customers: { name: string; email: string; phone: string; address: string; notes?: string }[];
  items: {
    sku: string;
    name: string;
    category: string;
    unit: string;
    kind?: ItemKindTypeEnum;
    onHand?: number;
    reorderLevel: number;
    cost: number;
    price: number;
    location?: string | null;
    supplier?: string | null;
    /** [component sku, qty] — only for MADE items */
    components?: [string, number][];
  }[];
  orders: {
    number: string;
    /** A customer name from `customers`, or a free label like "Table 4" */
    customer: string;
    status: OrderStatusTypeEnum;
    dueDays?: number;
    dueHour?: number;
    createdMinsAgo: number;
    closedMinsAgo?: number;
    /** [sku, qty, done] */
    lines: [string, number, number][];
  }[];
  deliveries: {
    number: string;
    supplier: string;
    vehicle: string;
    reference: string;
    dueDays: number;
    dueHour: number;
    dueMin: number;
    status: DeliveryStatusTypeEnum;
    /** [sku, expected] */
    lines: [string, number][];
  }[];
};

export type TemplateDefinitionType = {
  template: TemplateResponseType;
  sample: SampleDataType;
};
