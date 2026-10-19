export const DeliveryStatusTypeEnum = {
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN_TRANSIT',
  UNLOADING: 'UNLOADING',
  RECEIVED: 'RECEIVED',
} as const;
export type DeliveryStatusTypeEnum = (typeof DeliveryStatusTypeEnum)[keyof typeof DeliveryStatusTypeEnum];

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
