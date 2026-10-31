import { IsNull } from 'typeorm';
import type { Queryable } from '@/backend/db/client';
import { AccountEntity, RefreshTokenEntity } from '@/backend/db/entities';
import type { AccountRow, RefreshTokenRow } from '@/backend/db/schema';

const accounts = (q: Queryable) => q.getRepository(AccountEntity);
const tokens = (q: Queryable) => q.getRepository(RefreshTokenEntity);
const now = () => 'now()';

const FindAccountById = async (q: Queryable, id: string): Promise<AccountRow | undefined> => {
  return (await accounts(q).findOneBy({ id })) ?? undefined;
};

const FindAccountByEmail = async (q: Queryable, email: string): Promise<AccountRow | undefined> => {
  return (await accounts(q).findOneBy({ email })) ?? undefined;
};

const InsertAccount = async (q: Queryable, input: { email: string; name: string; passwordHash: string }): Promise<AccountRow> => {
  const { raw } = await accounts(q)
    .createQueryBuilder()
    .insert()
    .values({ email: input.email, name: input.name, password_hash: input.passwordHash })
    .returning('*')
    .execute();
  return raw[0];
};

const UpdateAccountName = async (q: Queryable, id: string, name: string): Promise<AccountRow> => {
  const { raw } = await accounts(q).createQueryBuilder().update().set({ name }).where('id = :id', { id }).returning('*').execute();
  return raw[0];
};

const InsertRefreshToken = async (q: Queryable, accountId: string, tokenHash: string, days: number): Promise<void> => {
  await tokens(q)
    .createQueryBuilder()
    .insert()
    .values({ token_hash: tokenHash, account_id: accountId, expires_at: () => 'now() + make_interval(days => :days)' })
    .setParameter('days', days)
    .execute();
};

/** Compare-and-set: revokes the token only if it is still live, so each token can be used once. */
const ConsumeRefreshToken = async (q: Queryable, tokenHash: string): Promise<RefreshTokenRow | undefined> => {
  const { raw } = await tokens(q)
    .createQueryBuilder()
    .update()
    .set({ revoked_at: now })
    .where('token_hash = :tokenHash AND revoked_at IS NULL AND expires_at > now()', { tokenHash })
    .returning('*')
    .execute();
  return raw[0];
};

const FindRefreshToken = async (q: Queryable, tokenHash: string): Promise<RefreshTokenRow | undefined> => {
  return (await tokens(q).findOneBy({ token_hash: tokenHash })) ?? undefined;
};

const RevokeRefreshToken = async (q: Queryable, tokenHash: string): Promise<void> => {
  await tokens(q).update({ token_hash: tokenHash, revoked_at: IsNull() }, { revoked_at: now });
};

const RevokeAllRefreshTokens = async (q: Queryable, accountId: string): Promise<void> => {
  await tokens(q).update({ account_id: accountId, revoked_at: IsNull() }, { revoked_at: now });
};

export const authRepository = {
  FindAccountById,
  FindAccountByEmail,
  InsertAccount,
  UpdateAccountName,
  InsertRefreshToken,
  ConsumeRefreshToken,
  FindRefreshToken,
  RevokeRefreshToken,
  RevokeAllRefreshTokens,
};
