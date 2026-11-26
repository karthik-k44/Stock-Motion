import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, numeric, pgTable, primaryKey, text, unique } from 'drizzle-orm/pg-core';
import { businesses } from './businesses';
import { suppliers } from './catalog';
import { items } from './items';
import { createdAt, timestampTz, type DbNumeric } from './_shared';
import { deliveryStatusEnum } from './enums';
import { prefixedId } from './ids';

export const deliveries = pgTable(
  'deliveries',
  {
    id: prefixedId('deliveries'),
    business_id: text().notNull(),
    number: text().notNull(),
    supplier_id: text(),
    supplier_name: text().notNull(),
    vehicle: text().notNull().default(''),
    reference: text().notNull().default(''),
    expected_at: timestampTz().notNull(),
    received_at: timestampTz(),
    status: deliveryStatusEnum().notNull(),
    created_at: createdAt(),
  },
  (t) => [
    unique('deliveries_business_id_number_key').on(t.business_id, t.number),
    foreignKey({ name: 'deliveries_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
    foreignKey({ name: 'deliveries_supplier_id_fkey', columns: [t.supplier_id], foreignColumns: [suppliers.id] }).onDelete('set null'),
    index('deliveries_business').on(t.business_id, t.status),
  ],
);

export const deliveryLines = pgTable(
  'delivery_lines',
  {
    delivery_id: text().notNull(),
    item_id: text().notNull(),
    position: integer().notNull(),
    expected: integer().notNull(),
    received: integer(),
    unit_cost: numeric({ precision: 12, scale: 4 }).notNull().default(sql`0`),
  },
  (t) => [
    primaryKey({ name: 'delivery_lines_pkey', columns: [t.delivery_id, t.item_id] }),
    check('delivery_lines_expected_check', sql`${t.expected} > 0`),
    check('delivery_lines_received_check', sql`${t.received} >= 0`),
    check('delivery_lines_unit_cost_check', sql`${t.unit_cost} >= 0`),
    foreignKey({ name: 'delivery_lines_delivery_id_fkey', columns: [t.delivery_id], foreignColumns: [deliveries.id] }).onDelete('cascade'),
    foreignKey({ name: 'delivery_lines_item_id_fkey', columns: [t.item_id], foreignColumns: [items.id] }),
    index('delivery_lines_item').on(t.item_id),
  ],
);

export type DeliveryRow = typeof deliveries.$inferSelect;

/** A delivery line with its item's details. */
export type DeliveryLineRow = {
  delivery_id: string;
  item_id: string;
  sku: string;
  name: string;
  unit: string;
  location: string | null;
  expected: number;
  received: number | null;
  unit_cost: DbNumeric;
};
