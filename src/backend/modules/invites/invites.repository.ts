import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { DaysFromNow } from '@/backend/common/utils/dates';
import type { Queryable } from '@/backend/db/client';
import { invites, type InviteRow } from '@/backend/db/schema';

const Insert = async (
  q: Queryable,
  input: { tokenHash: string; businessId: string; role: string; createdBy: string; days: number },): Promise<InviteRow> => {
  const [row] = await q
    .insert(invites)
    .values({
      token_hash: input.tokenHash,
      business_id: input.businessId,
      role: input.role,
      created_by: input.createdBy,
      expires_at: DaysFromNow(input.days),
    })
    .returning();
  return row;
};

const ListPending = (q: Queryable, businessId: string): Promise<InviteRow[]> => {
  return q
    .select()
    .from(invites)
    .where(and(eq(invites.business_id, businessId), isNull(invites.accepted_at), isNull(invites.revoked_at), gt(invites.expires_at, new Date())))
    .orderBy(desc(invites.created_at));
};

/** Returns false when there was no pending invite with that id. */
const Revoke = async (q: Queryable, businessId: string, inviteId: string): Promise<boolean> => {
  const revoked = await q
    .update(invites)
    .set({ revoked_at: new Date() })
    .where(and(eq(invites.id, inviteId), eq(invites.business_id, businessId), isNull(invites.accepted_at)))
    .returning({ id: invites.id });
  return revoked.length > 0;
};

const FindByTokenHash = async (q: Queryable, tokenHash: string, lock = false): Promise<InviteRow | undefined> => {
  const query = q.select().from(invites).where(eq(invites.token_hash, tokenHash));
  const [row] = lock ? await query.for('update') : await query;
  return row;
};

const MarkAccepted = async (q: Queryable, inviteId: string, accountId: string): Promise<void> => {
  await q.update(invites).set({ accepted_at: new Date(), accepted_by: accountId }).where(eq(invites.id, inviteId));
};

export const invitesRepository = { Insert, ListPending, Revoke, FindByTokenHash, MarkAccepted };
