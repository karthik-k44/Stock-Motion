/** Every table, in dependency order (children first) — used to truncate before a reseed. */
export const ALL_TABLES = [
  'activity',
  'movements',
  'delivery_lines',
  'deliveries',
  'order_lines',
  'orders',
  'items',
  'locations',
  'users',
] as const;
