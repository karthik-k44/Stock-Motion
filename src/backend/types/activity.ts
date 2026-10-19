export const ActivityKindTypeEnum = {
  DELIVERY: 'DELIVERY',
  ADJUSTMENT: 'ADJUSTMENT',
  ALLOCATION: 'ALLOCATION',
  PICK: 'PICK',
  PACK: 'PACK',
  SHIP: 'SHIP',
  RELOCATION: 'RELOCATION',
  SYSTEM: 'SYSTEM',
} as const;
export type ActivityKindTypeEnum = (typeof ActivityKindTypeEnum)[keyof typeof ActivityKindTypeEnum];

export const ActivityRefTypeEnum = {
  ORDER: 'ORDER',
  DELIVERY: 'DELIVERY',
  ITEM: 'ITEM',
} as const;
export type ActivityRefTypeEnum = (typeof ActivityRefTypeEnum)[keyof typeof ActivityRefTypeEnum];

/** Structured context so clients can animate who did what, where. */
export type ActivityMetaType = {
  assignee?: string;
  skus?: string[];
  locations?: string[];
  from?: string;
  to?: string;
};

export type ActivityResponseType = {
  id: number;
  at: string;
  kind: ActivityKindTypeEnum;
  userId: string;
  message: string;
  refType: ActivityRefTypeEnum | null;
  refId: string | null;
  meta: ActivityMetaType;
};
