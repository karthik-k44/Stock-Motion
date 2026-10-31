/**
 * Row types are snake_case, exactly as the columns are named: the TypeORM entities (`db/entities`) use them as their
 * shapes, and raw query rows have the same keys. Timestamps come back as Date; NUMERIC columns as strings.
 */
export type DbDate = Date | string;
export type DbNumeric = number | string;

/** Every table, children first, so a business's rows can be wiped in order. */
export const BUSINESS_TABLES = [
  'activity',
  'movements',
  'delivery_lines',
  'deliveries',
  'order_lines',
  'orders',
  'item_components',
  'items',
  'customers',
  'suppliers',
  'categories',
  'locations',
] as const;

export const ALL_TABLES = [...BUSINESS_TABLES, 'invites', 'memberships', 'businesses', 'refresh_tokens', 'accounts'] as const;
