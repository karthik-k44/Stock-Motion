import type { DbDate } from './_shared';

/** Row shapes as returned by the database (snake_case, before mapping). */
export type BusinessRow = {
  id: string;
  name: string;
  type: string;
  currency: string;
  created_by: string | null;
  created_at: DbDate;
};

export type MembershipRow = {
  business_id: string;
  account_id: string;
  role: string;
  color: string;
  created_at: DbDate;
};

export type InviteRow = {
  id: string;
  token_hash: string;
  business_id: string;
  role: string;
  created_by: string | null;
  expires_at: DbDate;
  accepted_at: DbDate | null;
  revoked_at: DbDate | null;
  created_at: DbDate;
};
