export const ActivityKindTypeEnum = {
  DELIVERY: 'DELIVERY',
  ADJUSTMENT: 'ADJUSTMENT',
  ALLOCATION: 'ALLOCATION',
  CONSUME: 'CONSUME',
  STATUS: 'STATUS',
  RELOCATION: 'RELOCATION',
  CATALOG: 'CATALOG',
  TEAM: 'TEAM',
  SYSTEM: 'SYSTEM',
} as const;
export type ActivityKindTypeEnum = (typeof ActivityKindTypeEnum)[keyof typeof ActivityKindTypeEnum];

export const ActivityRefTypeEnum = {
  ORDER: 'ORDER',
  DELIVERY: 'DELIVERY',
  ITEM: 'ITEM',
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
} as const;
export type ActivityRefTypeEnum = (typeof ActivityRefTypeEnum)[keyof typeof ActivityRefTypeEnum];

/** Structured context so clients can animate who did what, where. */
export type ActivityMetaType = {
  assignee?: string | null;
  skus?: string[];
  locations?: string[];
  from?: string;
  to?: string;
  status?: string;
};

export type ActivityResponseType = {
  id: number;
  at: string;
  kind: ActivityKindTypeEnum;
  accountId: string | null;
  actorName: string | null;
  message: string;
  refType: ActivityRefTypeEnum | null;
  refId: string | null;
  meta: ActivityMetaType;
};
