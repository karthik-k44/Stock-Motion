export const DeliveryStatusTypeEnum = {
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  RECEIVED: 'RECEIVED',
} as const;
export type DeliveryStatusTypeEnum = (typeof DeliveryStatusTypeEnum)[keyof typeof DeliveryStatusTypeEnum];

/** Which deliveries a list shows: all, the ones still to come, or the ones received. */
export const DeliveryFilterTypeEnum = {
  ALL: 'ALL',
  UPCOMING: 'UPCOMING',
  RECEIVED: 'RECEIVED',
} as const;
export type DeliveryFilterTypeEnum = (typeof DeliveryFilterTypeEnum)[keyof typeof DeliveryFilterTypeEnum];

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
