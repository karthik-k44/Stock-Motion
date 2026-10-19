import { z } from 'zod';

export const DeliveryStatusTypeEnum = {
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  RECEIVED: 'RECEIVED',
} as const;
export type DeliveryStatusTypeEnum = (typeof DeliveryStatusTypeEnum)[keyof typeof DeliveryStatusTypeEnum];

export const DeliveryViewTypeEnum = { ALL: 'ALL', UPCOMING: 'UPCOMING', RECEIVED: 'RECEIVED' } as const;
export type DeliveryViewTypeEnum = (typeof DeliveryViewTypeEnum)[keyof typeof DeliveryViewTypeEnum];

export type DeliveryLineResponseType = {
  sku: string;
  name: string;
  unit: string;
  location: string | null;
  expected: number;
  received: number | null;
  unitCost: number;
};

export type DeliveryResponseType = {
  number: string;
  supplierId: string | null;
  supplierName: string;
  vehicle: string;
  reference: string;
  expectedAt: string;
  receivedAt: string | null;
  status: DeliveryStatusTypeEnum;
  lines: DeliveryLineResponseType[];
  totalExpected: number;
  totalCost: number;
};

export type ListDeliveriesParams = { view?: DeliveryViewTypeEnum; search?: string; supplierId?: string };

export const ReceivedLineSchema = z.object({
  sku: z.string(),
  received: z.number({ invalid_type_error: 'Enter the counted quantity' }).int('Use a whole number').min(0, 'Cannot be negative').max(10_000_000, 'That looks too large'),
});
export const ReceiveDeliverySchema = z.object({ lines: z.array(ReceivedLineSchema) });
export type ReceiveDeliveryInput = z.infer<typeof ReceiveDeliverySchema>;

export const NewDeliverySchema = z.object({
  supplierId: z.string().min(1, 'Choose a supplier'),
  expectedAt: z.string().min(1, 'Choose when it arrives'),
  vehicle: z.string().trim().max(40),
  reference: z.string().trim().max(40),
  status: z.enum([DeliveryStatusTypeEnum.SCHEDULED, DeliveryStatusTypeEnum.IN_TRANSIT]),
  lines: z
    .array(z.object({ sku: z.string().min(1), expected: z.number({ invalid_type_error: 'Enter a quantity' }).int('Whole numbers only').min(1, 'At least 1') }))
    .min(1, 'Add at least one line'),
});
export type NewDeliveryInput = z.infer<typeof NewDeliverySchema>;

/** Every delivery type under one name. */
export type TDeliveryType = {
  Response: DeliveryResponseType;
  Line: DeliveryLineResponseType;
  Status: DeliveryStatusTypeEnum;
  View: DeliveryViewTypeEnum;
  ListParams: ListDeliveriesParams;
  ReceiveInput: ReceiveDeliveryInput;
  NewInput: NewDeliveryInput;
};
