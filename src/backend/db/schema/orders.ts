import { sql } from 'drizzle-orm';
import { boolean, check, foreignKey, index, integer, numeric, pgTable, primaryKey, text, unique } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { businesses } from './businesses';
import { customers } from './catalog';
import { items } from './items';
import { createdAt, timestampTz, type DbNumeric } from './_shared';
import { prefixedId } from './ids';

/**
 * `status` is a stage of the business template's order flow. `reserves` and `closed` are copied from that stage on
 * every transition, so stock maths never needs the template.
 */
export const orders = pgTable(
  'orders',
  {
    id: prefixedId('orders'),
    business_id: text().notNull(),
    number: text().notNull(),
    customer_id: text(),
    customer_name: text().notNull(),
    status: text().notNull(),
    reserves: boolean().notNull().default(false),
    closed: boolean().notNull().default(false),
    cancelled: boolean().notNull().default(false),
    due_at: timestampTz(),
    assignee_id: text(),
    notes: text().notNull().default(''),
    created_at: createdAt(),
    closed_at: timestampTz(),
  },
  (t) => [
    unique('orders_business_id_number_key').on(t.business_id, t.number),
    foreignKey({ name: 'orders_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
    foreignKey({ name: 'orders_customer_id_fkey', columns: [t.customer_id], foreignColumns: [customers.id] }).onDelete('set null'),
    foreignKey({ name: 'orders_assignee_id_fkey', columns: [t.assignee_id], foreignColumns: [accounts.id] }).onDelete('set null'),
    index('orders_business').on(t.business_id, t.closed, t.created_at.desc().nullsFirst()),
  ],
);

/** `done` is the quantity already picked / used. */
export const orderLines = pgTable(
  'order_lines',
  {
    order_id: text().notNull(),
    item_id: text().notNull(),
    position: integer().notNull(),
    qty: integer().notNull(),
    done: integer().notNull().default(0),
    unit_price: numeric({ precision: 12, scale: 2 }).notNull().default(sql`0`),
  },
  (t) => [
    primaryKey({ name: 'order_lines_pkey', columns: [t.order_id, t.item_id] }),
    check('order_lines_qty_check', sql`${t.qty} > 0`),
    check('order_lines_check', sql`${t.done} >= 0 AND ${t.done} <= ${t.qty}`),
    check('order_lines_unit_price_check', sql`${t.unit_price} >= 0`),
    foreignKey({ name: 'order_lines_order_id_fkey', columns: [t.order_id], foreignColumns: [orders.id] }).onDelete('cascade'),
    foreignKey({ name: 'order_lines_item_id_fkey', columns: [t.item_id], foreignColumns: [items.id] }),
    index('order_lines_item').on(t.item_id),
  ],
);

export type OrderRecord = typeof orders.$inferSelect;
/** An order with its assignee's name. */
export type OrderRow = OrderRecord & { assignee_name: string | null };

/** An order line with its item's details. */
export type OrderLineRow = {
  order_id: string;
  item_id: string;
  sku: string;
  name: string;
  kind: string;
  unit: string;
  location: string | null;
  qty: number;
  done: number;
  unit_price: DbNumeric;
};
