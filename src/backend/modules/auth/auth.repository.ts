import { and, eq, gt, isNotNull, isNull, lte, or } from 'drizzle-orm';
import { DaysFromNow } from '@/backend/common/utils/dates';
import type { Queryable } from '@/backend/db/client';
import { accounts, refreshTokens, type AccountRow, type RefreshTokenRow } from '@/backend/db/schema';

const FindAccountById = async (q: Queryable, id: string): Promise<AccountRow | undefined> => {
  const [row] = await q.select().from(accounts).where(eq(accounts.id, id));
  return row;
};

const FindAccountByEmail = async (q: Queryable, email: string): Promise<AccountRow | undefined> => {
  const [row] = await q.select().from(accounts).where(eq(accounts.email, email));
  return row;
};

const LockAccountByEmail = async (q: Queryable, email: string): Promise<AccountRow | undefined> => {
  const [row] = await q.select().from(accounts).where(eq(accounts.email, email)).for('update');
  return row;
};

const InsertAccount = async (q: Queryable, input: { email: string; name: string; passwordHash: string }): Promise<AccountRow> => {
  const [row] = await q.insert(accounts).values({ email: input.email, name: input.name, password_hash: input.passwordHash }).returning();
  return row;
};

const UpdateAccountName = async (q: Queryable, id: string, name: string): Promise<AccountRow> => {
  const [row] = await q.update(accounts).set({ name }).where(eq(accounts.id, id)).returning();
  return row;
};

const InsertRefreshToken = async (q: Queryable, accountId: string, tokenHash: string, days: number): Promise<void> => {
  await q.insert(refreshTokens).values({ token_hash: tokenHash, account_id: accountId, expires_at: DaysFromNow(days) });
};

/** Compare-and-set: revokes the token only if it is still live, so each token can be used once. */
const ConsumeRefreshToken = async (q: Queryable, tokenHash: string): Promise<RefreshTokenRow | undefined> => {
  const [row] = await q
    .update(refreshTokens)
    .set({ revoked_at: new Date() })
    .where(and(eq(refreshTokens.token_hash, tokenHash), isNull(refreshTokens.revoked_at), gt(refreshTokens.expires_at, new Date())))
    .returning();
  return row;
};

const FindRefreshToken = async (q: Queryable, tokenHash: string): Promise<RefreshTokenRow | undefined> => {
  const [row] = await q.select().from(refreshTokens).where(eq(refreshTokens.token_hash, tokenHash));
  return row;
};

const RevokeRefreshToken = async (q: Queryable, tokenHash: string): Promise<void> => {
  await q
    .update(refreshTokens)
    .set({ revoked_at: new Date() })
    .where(and(eq(refreshTokens.token_hash, tokenHash), isNull(refreshTokens.revoked_at)));
};

const RevokeAllRefreshTokens = async (q: Queryable, accountId: string): Promise<void> => {
  await q
    .update(refreshTokens)
    .set({ revoked_at: new Date() })
    .where(and(eq(refreshTokens.account_id, accountId), isNull(refreshTokens.revoked_at)));
};

/** Drop an account's spent and expired refresh tokens (the shared demo account collects one per sign-in). */
const DeleteDeadRefreshTokens = async (q: Queryable, accountId: string): Promise<void> => {
  await q
    .delete(refreshTokens)
    .where(and(eq(refreshTokens.account_id, accountId), or(isNotNull(refreshTokens.revoked_at), lte(refreshTokens.expires_at, new Date()))));
};

export const authRepository = {
  FindAccountById,
  FindAccountByEmail,
  LockAccountByEmail,
  InsertAccount,
  UpdateAccountName,
  InsertRefreshToken,
  ConsumeRefreshToken,
  FindRefreshToken,
  RevokeRefreshToken,
  RevokeAllRefreshTokens,
  DeleteDeadRefreshTokens,
};
