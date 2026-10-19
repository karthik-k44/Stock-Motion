import { z } from 'zod';

export const DeliveryStatusTypeEnum = {
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN_TRANSIT',
  UNLOADING: 'UNLOADING',
  RECEIVED: 'RECEIVED',
} as const;
export type DeliveryStatusTypeEnum = (typeof DeliveryStatusTypeEnum)[keyof typeof DeliveryStatusTypeEnum];

export const DeliveryViewTypeEnum = { ALL: 'ALL', UPCOMING: 'UPCOMING', RECEIVED: 'RECEIVED' } as const;
export type DeliveryViewTypeEnum = (typeof DeliveryViewTypeEnum)[keyof typeof DeliveryViewTypeEnum];

export type DeliveryLineResponseType = {
  sku: string;
  name: string;
  location: string | null;
  expected: number;
  received: number | null;
};

export type DeliveryResponseType = {
  id: string;
  supplier: string;
  truck: string;
  plate: string;
  expectedAt: string;
  receivedAt: string | null;
  status: DeliveryStatusTypeEnum;
  lines: DeliveryLineResponseType[];
  totalExpected: number;
};

export type ListDeliveriesParams = { view?: DeliveryViewTypeEnum; search?: string };

export const ReceivedLineSchema = z.object({
  sku: z.string(),
  received: z
    .number({ invalid_type_error: 'Enter the counted quantity' })
    .int('Use a whole number')
    .min(0, 'Cannot be negative')
    .max(100_000, 'That looks too large'),
});
export const ReceiveDeliverySchema = z.object({ lines: z.array(ReceivedLineSchema) });
export type ReceiveDeliveryInput = z.infer<typeof ReceiveDeliverySchema>;

/** Every delivery type under one name. */
export type TDeliveryType = {
  Response: DeliveryResponseType;
  Line: DeliveryLineResponseType;
  Status: DeliveryStatusTypeEnum;
  View: DeliveryViewTypeEnum;
  ListParams: ListDeliveriesParams;
  ReceiveInput: ReceiveDeliveryInput;
};
