import { foreignKey, index, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { createdAt, timestampTz } from './_shared';
import { businessTypeEnum } from './enums';
import { prefixedId } from './ids';

export const businesses = pgTable(
  'businesses',
  {
    id: prefixedId('businesses'),
    name: text().notNull(),
    type: businessTypeEnum().notNull(),
    currency: text().notNull().default('USD'),
    created_by: text(),
    created_at: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'businesses_created_by_fkey', columns: [t.created_by], foreignColumns: [accounts.id] }).onDelete('set null'),
  ],
);

/** `role` is OWNER, MANAGER or one of the template's staff roles (checked in the service). */
export const memberships = pgTable(
  'memberships',
  {
    business_id: text().notNull(),
    account_id: text().notNull(),
    role: text().notNull(),
    color: text().notNull(),
    created_at: createdAt(),
  },
  (t) => [
    primaryKey({ name: 'memberships_pkey', columns: [t.business_id, t.account_id] }),
    foreignKey({ name: 'memberships_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
    foreignKey({ name: 'memberships_account_id_fkey', columns: [t.account_id], foreignColumns: [accounts.id] }).onDelete('cascade'),
    index('memberships_account').on(t.account_id),
  ],
);

export const invites = pgTable(
  'invites',
  {
    id: prefixedId('invites'),
    token_hash: text().notNull().unique('invites_token_hash_key'),
    business_id: text().notNull(),
    role: text().notNull(),
    created_by: text(),
    expires_at: timestampTz().notNull(),
    accepted_at: timestampTz(),
    accepted_by: text(),
    revoked_at: timestampTz(),
    created_at: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'invites_business_id_fkey', columns: [t.business_id], foreignColumns: [businesses.id] }).onDelete('cascade'),
    foreignKey({ name: 'invites_created_by_fkey', columns: [t.created_by], foreignColumns: [accounts.id] }).onDelete('set null'),
    foreignKey({ name: 'invites_accepted_by_fkey', columns: [t.accepted_by], foreignColumns: [accounts.id] }).onDelete('set null'),
    index('invites_business').on(t.business_id),
  ],
);

export type BusinessRow = typeof businesses.$inferSelect;
export type MembershipRow = typeof memberships.$inferSelect;
export type InviteRow = typeof invites.$inferSelect;
