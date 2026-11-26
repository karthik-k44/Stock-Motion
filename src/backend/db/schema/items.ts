import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, numeric, pgTable, pgView, primaryKey, text, unique } from 'drizzle-orm/pg-core';
import { businesses } from './businesses';
import { locations, suppliers } from './catalog';
import { ItemKindTypeEnum } from '@/backend/types/item';
import { createdAt, timestampTz } from './_shared';
import { itemKindEnum } from './enums';
import { prefixedId } from './ids';

/**
 * STOCK is counted on the shelf; MADE (menu item, job kit, bundle) is built from `item_components` and has no stock
 * of its own; SERVICE is sold but never stocked. Quantities are whole numbers in the item's unit; cost keeps 4 decimals
 * so a gram of coffee can cost 0.0250. `on_hand` is the only stored quantity — the rest is derived in `item_views`.
 */
export const items = pgTable(
  'items',
  {
    id: prefixedId('items'),
    business_id: text().notNull(),
    sku: text().notNull(),
    name: text().notNull(),
    category: text().notNull(),
    unit: text().notNull(),
    kind: itemKindEnum().notNull().default(ItemKindTypeEnum.STOCK),
    on_hand: integer().notNull().default(0),
    reorder_level: integer().notNull().default(0),
    cost: numeric({ precision: 12, scale: 4 }).notNull().default(sql`0`),
    price: numeric({ precision: 12, scale: 2 }).notNull().default(sql`0`),
    location: text(),
    supplier_id: text(),
    archived_at: timestampTz(),
    created_at: createdAt(),
  },
  (t) => [
    check('items_on_hand_check', sql`${t.on_hand} >= 0`),
    check('items_reorder_level_check', sql`${t.reorder_level} >= 0`),
    check('items_cost_check', sql`${t.cost} >= 0`),
    check('items_price_check', sql`${t.price} >= 0`),
    unique('items_business_id_sku_key').on(t.business_id, t.sku),
    foreignKey({ name: 'items_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
    foreignKey({ name: 'items_supplier_id_fkey', columns: [t.supplier_id], foreignColumns: [suppliers.id] }).onDelete('set null'),
    foreignKey({
      name: 'items_business_id_location_fkey',
      columns: [t.business_id, t.location],
      foreignColumns: [locations.business_id, locations.code],
    }),
    index('items_business').on(t.business_id),
  ],
);

/** The recipe of a made item: which stock items it uses, and how many of each. */
export const itemComponents = pgTable(
  'item_components',
  {
    parent_id: text().notNull(),
    component_id: text().notNull(),
    qty: integer().notNull(),
  },
  (t) => [
    primaryKey({ name: 'item_components_pkey', columns: [t.parent_id, t.component_id] }),
    check('item_components_qty_check', sql`${t.qty} > 0`),
    check('item_components_check', sql`${t.parent_id} <> ${t.component_id}`),
    foreignKey({ name: 'item_components_parent_id_fkey', columns: [t.parent_id], foreignColumns: [items.id] }).onDelete('cascade'),
    foreignKey({ name: 'item_components_component_id_fkey', columns: [t.component_id], foreignColumns: [items.id] }).onDelete('restrict'),
    index('item_components_component').on(t.component_id),
  ],
);

/**
 * Read-only: the `item_views` view (defined in the first migration) derives reserved, available, incoming and status
 * from orders and deliveries. It is the one place stock maths lives; writes always go to `items`.
 */
export const itemViews = pgView('item_views', {
  id: text().notNull(),
  business_id: text().notNull(),
  sku: text().notNull(),
  name: text().notNull(),
  category: text().notNull(),
  unit: text().notNull(),
  kind: itemKindEnum().notNull(),
  on_hand: integer().notNull(),
  reorder_level: integer().notNull(),
  cost: numeric({ precision: 12, scale: 4 }).notNull(),
  price: numeric({ precision: 12, scale: 2 }).notNull(),
  location: text(),
  supplier_id: text(),
  reserved: integer().notNull(),
  incoming: integer().notNull(),
  available: integer().notNull(),
  status: text().notNull(),
}).existing();

export type ItemRow = typeof items.$inferSelect;
export type ItemViewRow = typeof itemViews.$inferSelect;
export type ItemComponentRow = typeof itemComponents.$inferSelect;
