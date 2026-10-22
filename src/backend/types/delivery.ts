export const DeliveryStatusTypeEnum = {
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  RECEIVED: 'RECEIVED',
} as const;
export type DeliveryStatusTypeEnum = (typeof DeliveryStatusTypeEnum)[keyof typeof DeliveryStatusTypeEnum];

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
