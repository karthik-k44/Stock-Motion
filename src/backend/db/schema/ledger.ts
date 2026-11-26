import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { businesses } from './businesses';
import { items } from './items';
import { timestampTz, type DbDate } from './_shared';
import { prefixedId } from './ids';

/** The stock ledger: one row per change to an item's on-hand count. Append-only (a trigger refuses updates). */
export const movements = pgTable(
  'movements',
  {
    id: prefixedId('movements'),
    business_id: text().notNull(),
    at: timestampTz().notNull().defaultNow(),
    item_id: text().notNull(),
    type: text().notNull(),
    delta: integer().notNull(),
    balance: integer().notNull(),
    ref: text(),
    account_id: text(),
    note: text().notNull().default(''),
  },
  (t) => [
    check('movements_type_check', sql`${t.type} IN ('RECEIPT','CONSUME','ADJUSTMENT','RELOCATION')`),
    foreignKey({ name: 'movements_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
    foreignKey({ name: 'movements_item_id_fkey', columns: [t.item_id], foreignColumns: [items.id] }).onDelete('cascade'),
    foreignKey({ name: 'movements_account_id_fkey', columns: [t.account_id], foreignColumns: [accounts.id] }).onDelete('set null'),
    index('movements_item_at').on(t.item_id, t.at.desc().nullsFirst()),
  ],
);

/** Who did what, and when. Append-only (a trigger refuses updates). */
export const activity = pgTable(
  'activity',
  {
    id: prefixedId('activity'),
    business_id: text().notNull(),
    at: timestampTz().notNull().defaultNow(),
    kind: text().notNull(),
    account_id: text(),
    message: text().notNull(),
    ref_type: text(),
    ref_id: text(),
    meta: jsonb().notNull().default({}),
  },
  (t) => [
    check(
      'activity_kind_check',
      sql`${t.kind} IN ('DELIVERY','ADJUSTMENT','ALLOCATION','CONSUME','STATUS','RELOCATION','CATALOG','TEAM','SYSTEM')`,
    ),
    check('activity_ref_type_check', sql`${t.ref_type} IN ('ORDER','DELIVERY','ITEM','CUSTOMER','SUPPLIER')`),
    foreignKey({ name: 'activity_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
    foreignKey({ name: 'activity_account_id_fkey', columns: [t.account_id], foreignColumns: [accounts.id] }).onDelete('set null'),
    index('activity_business_at').on(t.business_id, t.at.desc().nullsFirst()),
  ],
);

export type MovementRecord = typeof movements.$inferSelect;
export type ActivityRecord = typeof activity.$inferSelect;

/** A ledger row joined with the item sku and actor name. */
export type MovementRow = {
  id: string;
  at: DbDate;
  sku: string;
  type: string;
  delta: number;
  balance: number;
  ref: string | null;
  account_id: string | null;
  actor_name: string | null;
  note: string;
};

/** An activity row joined with the actor name. */
export type ActivityRow = Omit<ActivityRecord, 'business_id'> & { actor_name: string | null };
