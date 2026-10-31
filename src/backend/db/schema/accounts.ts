import type { DbDate } from './_shared';

/** Row shapes as returned by the database (snake_case, before mapping). */
export type AccountRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: DbDate;
};

export type RefreshTokenRow = {
  token_hash: string;
  account_id: string;
  expires_at: DbDate;
  revoked_at: DbDate | null;
  created_at: DbDate;
};
