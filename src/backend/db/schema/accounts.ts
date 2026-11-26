import { foreignKey, index, pgTable, text } from 'drizzle-orm/pg-core';
import { createdAt, timestampTz } from './_shared';
import { prefixedId } from './ids';

export const accounts = pgTable('accounts', {
  id: prefixedId('accounts'),
  email: text().notNull().unique('accounts_email_key'),
  name: text().notNull(),
  password_hash: text().notNull(),
  created_at: createdAt(),
});

/** Stored hashed; a token is spent by setting `revoked_at`. */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    token_hash: text().primaryKey(),
    account_id: text().notNull(),
    expires_at: timestampTz().notNull(),
    revoked_at: timestampTz(),
    created_at: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'refresh_tokens_account_id_fkey', columns: [t.account_id], foreignColumns: [accounts.id] }).onDelete('cascade'),
    index('refresh_tokens_account').on(t.account_id),
  ],
);

export type AccountRow = typeof accounts.$inferSelect;
export type RefreshTokenRow = typeof refreshTokens.$inferSelect;
