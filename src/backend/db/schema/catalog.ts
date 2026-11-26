import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, pgTable, primaryKey, text, unique } from 'drizzle-orm/pg-core';
import { businesses } from './businesses';
import { createdAt } from './_shared';
import { prefixedId } from './ids';

export const locations = pgTable(
  'locations',
  {
    business_id: text().notNull(),
    code: text().notNull(),
    zone: text().notNull(),
    name: text().notNull(),
    position: integer().notNull().default(0),
  },
  (t) => [
    primaryKey({ name: 'locations_pkey', columns: [t.business_id, t.code] }),
    foreignKey({ name: 'locations_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
  ],
);

export const categories = pgTable(
  'categories',
  {
    business_id: text().notNull(),
    code: text().notNull(),
    name: text().notNull(),
    position: integer().notNull().default(0),
  },
  (t) => [
    primaryKey({ name: 'categories_pkey', columns: [t.business_id, t.code] }),
    foreignKey({ name: 'categories_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
  ],
);

export const suppliers = pgTable(
  'suppliers',
  {
    id: prefixedId('suppliers'),
    business_id: text().notNull(),
    name: text().notNull(),
    contact: text().notNull().default(''),
    email: text().notNull().default(''),
    phone: text().notNull().default(''),
    lead_days: integer().notNull().default(2),
    created_at: createdAt(),
  },
  (t) => [
    check('suppliers_lead_days_check', sql`${t.lead_days} >= 0`),
    unique('suppliers_business_id_name_key').on(t.business_id, t.name),
    foreignKey({ name: 'suppliers_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
  ],
);

export const customers = pgTable(
  'customers',
  {
    id: prefixedId('customers'),
    business_id: text().notNull(),
    name: text().notNull(),
    email: text().notNull().default(''),
    phone: text().notNull().default(''),
    address: text().notNull().default(''),
    notes: text().notNull().default(''),
    created_at: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'customers_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
    index('customers_business').on(t.business_id, t.name),
  ],
);

export type LocationRow = typeof locations.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type SupplierRow = typeof suppliers.$inferSelect;
export type CustomerRow = typeof customers.$inferSelect;
