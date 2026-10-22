export const BusinessTypeEnum = {
  RETAIL: 'RETAIL',
  CAFE: 'CAFE',
  TRADES: 'TRADES',
} as const;
export type BusinessTypeEnum = (typeof BusinessTypeEnum)[keyof typeof BusinessTypeEnum];

/** One stage of a template's order flow. Orders move through the stages in array order. */
export type OrderStageType = {
  status: string;
  label: string;
  /** Button that moves an order into this stage; null for the first stage. */
  action: string | null;
  /** Open line quantities are allocated (reserved) while an order is in this stage. */
  reserves: boolean;
  /** Lines can be picked / used one at a time in this stage. */
  consumeLines: boolean;
  /** Entering this stage takes every still-open quantity out of stock (e.g. a ticket is served). */
  consumeOnEnter: boolean;
  /** Every line must be done before an order can enter this stage. */
  requiresAllDone: boolean;
  /** Terminal stage; the order counts towards revenue. */
  closed: boolean;
};

export type StorageZoneType = {
  code: string;
  name: string;
  levels: number;
  bins: number;
  levelLabel: string;
  binLabel: string;
};

export type TemplateLabelsType = {
  item: string;
  items: string;
  made: string;
  madePlural: string;
  order: string;
  orders: string;
  customer: string;
  customers: string;
  delivery: string;
  deliveries: string;
  supplier: string;
  suppliers: string;
  location: string;
  locations: string;
  consume: string;
  consumed: string;
  vehicle: string;
};

export type TemplateRoleType = { code: string; label: string };

export type TemplateResponseType = {
  type: BusinessTypeEnum;
  name: string;
  tagline: string;
  labels: TemplateLabelsType;
  orderPrefix: string;
  deliveryPrefix: string;
  orderFlow: OrderStageType[];
  /** OWNER and MANAGER first, then the template's staff roles. */
  roles: TemplateRoleType[];
  categories: { code: string; name: string }[];
  units: string[];
  zones: StorageZoneType[];
  /** One item per location (warehouse bins) versus shared shelves. */
  exclusiveLocations: boolean;
};
