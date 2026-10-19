import type { Queryable } from '@/backend/db/client';
import type { AccountRow, RefreshTokenRow } from '@/backend/db/schema';

async function FindAccountById(q: Queryable, id: string): Promise<AccountRow | undefined> {
  const { rows } = await q.query<AccountRow>('SELECT * FROM accounts WHERE id = $1', [id]);
  return rows[0];
}

async function FindAccountByEmail(q: Queryable, email: string): Promise<AccountRow | undefined> {
  const { rows } = await q.query<AccountRow>('SELECT * FROM accounts WHERE email = $1', [email]);
  return rows[0];
}

async function InsertAccount(q: Queryable, input: { email: string; name: string; passwordHash: string }): Promise<AccountRow> {
  const { rows } = await q.query<AccountRow>(
    'INSERT INTO accounts (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [input.email, input.name, input.passwordHash],
  );
  return rows[0];
}

async function UpdateAccountName(q: Queryable, id: string, name: string): Promise<AccountRow> {
  const { rows } = await q.query<AccountRow>('UPDATE accounts SET name = $2 WHERE id = $1 RETURNING *', [id, name]);
  return rows[0];
}

async function InsertRefreshToken(q: Queryable, accountId: string, tokenHash: string, days: number): Promise<void> {
  await q.query(
    'INSERT INTO refresh_tokens (token_hash, account_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))',
    [tokenHash, accountId, days],
  );
}

/** Compare-and-set: revokes the token only if it is still live, so each token can be used once. */
async function ConsumeRefreshToken(q: Queryable, tokenHash: string): Promise<RefreshTokenRow | undefined> {
  const { rows } = await q.query<RefreshTokenRow>(
    `UPDATE refresh_tokens SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now() RETURNING *`,
    [tokenHash],
  );
  return rows[0];
}

async function FindRefreshToken(q: Queryable, tokenHash: string): Promise<RefreshTokenRow | undefined> {
  const { rows } = await q.query<RefreshTokenRow>('SELECT * FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  return rows[0];
}

async function RevokeRefreshToken(q: Queryable, tokenHash: string): Promise<void> {
  await q.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL', [tokenHash]);
}

async function RevokeAllRefreshTokens(q: Queryable, accountId: string): Promise<void> {
  await q.query('UPDATE refresh_tokens SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [accountId]);
}

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
