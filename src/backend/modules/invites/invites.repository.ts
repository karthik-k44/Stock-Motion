import type { Queryable } from '@/backend/db/client';
import type { InviteRow } from '@/backend/db/schema';

const Insert = async (
  q: Queryable,
  input: { tokenHash: string; businessId: string; role: string; createdBy: string; days: number },): Promise<InviteRow> => {
  const { rows } = await q.query<InviteRow>(
    `INSERT INTO invites (token_hash, business_id, role, created_by, expires_at)
     VALUES ($1, $2, $3, $4, now() + make_interval(days => $5)) RETURNING *`,
    [input.tokenHash, input.businessId, input.role, input.createdBy, input.days],
  );
  return rows[0];
};

const ListPending = async (q: Queryable, businessId: string): Promise<InviteRow[]> => {
  const { rows } = await q.query<InviteRow>(
    `SELECT * FROM invites
     WHERE business_id = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC`,
    [businessId],
  );
  return rows;
};

/** Returns false when there was no pending invite with that id. */
const Revoke = async (q: Queryable, businessId: string, inviteId: string): Promise<boolean> => {
  const { rows } = await q.query(
    'UPDATE invites SET revoked_at = now() WHERE id = $1 AND business_id = $2 AND accepted_at IS NULL RETURNING id',
    [inviteId, businessId],
  );
  return rows.length > 0;
};

const FindByTokenHash = async (q: Queryable, tokenHash: string, lock = false): Promise<InviteRow | undefined> => {
  const { rows } = await q.query<InviteRow>(`SELECT * FROM invites WHERE token_hash = $1 ${lock ? 'FOR UPDATE' : ''}`, [tokenHash]);
  return rows[0];
};

const MarkAccepted = async (q: Queryable, inviteId: string, accountId: string): Promise<void> => {
  await q.query('UPDATE invites SET accepted_at = now(), accepted_by = $2 WHERE id = $1', [inviteId, accountId]);
};

export const invitesRepository = { Insert, ListPending, Revoke, FindByTokenHash, MarkAccepted };
