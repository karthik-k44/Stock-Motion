import { IsNull, Raw } from 'typeorm';
import type { Queryable } from '@/backend/db/client';
import { InviteEntity } from '@/backend/db/entities';
import type { InviteRow } from '@/backend/db/schema';

const invites = (q: Queryable) => q.getRepository(InviteEntity);

const Insert = async (
  q: Queryable,
  input: { tokenHash: string; businessId: string; role: string; createdBy: string; days: number },): Promise<InviteRow> => {
  const { raw } = await invites(q)
    .createQueryBuilder()
    .insert()
    .values({
      token_hash: input.tokenHash,
      business_id: input.businessId,
      role: input.role,
      created_by: input.createdBy,
      expires_at: () => 'now() + make_interval(days => :days)',
    })
    .setParameter('days', input.days)
    .returning('*')
    .execute();
  return raw[0];
};

const ListPending = (q: Queryable, businessId: string): Promise<InviteRow[]> => {
  return invites(q).find({
    where: { business_id: businessId, accepted_at: IsNull(), revoked_at: IsNull(), expires_at: Raw((at) => `${at} > now()`) },
    order: { created_at: 'DESC' },
  });
};

/** Returns false when there was no pending invite with that id. */
const Revoke = async (q: Queryable, businessId: string, inviteId: string): Promise<boolean> => {
  const { affected } = await invites(q).update(
    { id: inviteId, business_id: businessId, accepted_at: IsNull() },
    { revoked_at: () => 'now()' },
  );
  return (affected ?? 0) > 0;
};

const FindByTokenHash = async (q: Queryable, tokenHash: string, lock = false): Promise<InviteRow | undefined> => {
  const query = invites(q).createQueryBuilder('i').where('i.token_hash = :tokenHash', { tokenHash });
  return (await (lock ? query.setLock('pessimistic_write') : query).getOne()) ?? undefined;
};

const MarkAccepted = async (q: Queryable, inviteId: string, accountId: string): Promise<void> => {
  await invites(q).update({ id: inviteId }, { accepted_at: () => 'now()', accepted_by: accountId });
};

export const invitesRepository = { Insert, ListPending, Revoke, FindByTokenHash, MarkAccepted };
