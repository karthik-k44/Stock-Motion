import type { Queryable } from '@/backend/db/client';
import { AccountEntity, ActivityEntity, NameOf } from '@/backend/db/entities';
import type { ActivityRow, DbDate } from '@/backend/db/schema';

export type InsertActivityType = {
  businessId: string;
  kind: string;
  accountId: string | null;
  message: string;
  refType?: string | null;
  refId?: string | null;
  meta?: object;
  /** Defaults to now; sample data backdates its history. */
  at?: DbDate;
};

const COLUMNS = ['id', 'at', 'kind', 'account_id', 'message', 'ref_type', 'ref_id', 'meta'];

/** Append-only: there is no update or delete here, and the database refuses updates (migrations/…-append-only-ledgers). */
const Insert = async (q: Queryable, input: InsertActivityType): Promise<ActivityRow> => {
  const { raw } = await q
    .getRepository(ActivityEntity)
    .createQueryBuilder()
    .insert()
    .values({
      business_id: input.businessId,
      at: input.at,
      kind: input.kind,
      account_id: input.accountId,
      message: input.message,
      ref_type: input.refType ?? null,
      ref_id: input.refId ?? null,
      meta: input.meta ?? {},
    })
    .returning(COLUMNS)
    .execute();
  return { ...raw[0], actor_name: null };
};

const List = (
  q: Queryable,
  businessId: string,
  filters: { kind?: string; accountId?: string; search?: string; refType?: string; refId?: string; limit: number },): Promise<ActivityRow[]> => {
  const query = q
    .createQueryBuilder(ActivityEntity, 'a')
    .select(COLUMNS.map((c) => `a.${c} AS ${c}`))
    .addSelect('acc.name', 'actor_name')
    .leftJoin(NameOf(AccountEntity), 'acc', 'acc.id = a.account_id')
    .where('a.business_id = :businessId', { businessId });
  if (filters.kind) query.andWhere('a.kind = :kind', { kind: filters.kind });
  if (filters.accountId) query.andWhere('a.account_id = :accountId', { accountId: filters.accountId });
  if (filters.refType) query.andWhere('a.ref_type = :refType', { refType: filters.refType });
  if (filters.refId) query.andWhere('a.ref_id = :refId', { refId: filters.refId });
  if (filters.search) query.andWhere('(a.message ILIKE :search OR a.ref_id ILIKE :search)', { search: `%${filters.search}%` });
  return query.orderBy('a.at', 'DESC').addOrderBy('a.id', 'DESC').limit(filters.limit).getRawMany<ActivityRow>();
};

export const activityRepository = { Insert, List };
