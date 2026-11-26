import { and, desc, eq, ilike, or } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { accounts, activity, NewestIdFirst, type ActivityRow, type DbDate } from '@/backend/db/schema';

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

const toRecord = (input: InsertActivityType) => ({
  business_id: input.businessId,
  at: input.at === undefined ? undefined : new Date(input.at),
  kind: input.kind,
  account_id: input.accountId,
  message: input.message,
  ref_type: input.refType ?? null,
  ref_id: input.refId ?? null,
  meta: input.meta ?? {},
});

const COLUMNS = {
  id: activity.id,
  at: activity.at,
  kind: activity.kind,
  account_id: activity.account_id,
  message: activity.message,
  ref_type: activity.ref_type,
  ref_id: activity.ref_id,
  meta: activity.meta,
};

/** Append-only: there is no update or delete here, and the database refuses updates (migration 0001). */
const Insert = async (q: Queryable, input: InsertActivityType): Promise<ActivityRow> => {
  const [row] = await q.insert(activity).values(toRecord(input)).returning(COLUMNS);
  return { ...row, actor_name: null };
};

/** Many entries in one statement, kept in the given order (ids follow it). */
const InsertMany = async (q: Queryable, rows: InsertActivityType[]): Promise<void> => {
  if (rows.length) await q.insert(activity).values(rows.map(toRecord));
};

const List = (
  q: Queryable,
  businessId: string,
  filters: { kind?: string; accountId?: string; search?: string; refType?: string; refId?: string; limit: number },): Promise<ActivityRow[]> => {
  const search = filters.search ? `%${filters.search}%` : undefined;
  return q
    .select({ ...COLUMNS, actor_name: accounts.name })
    .from(activity)
    .leftJoin(accounts, eq(accounts.id, activity.account_id))
    .where(
      and(
        eq(activity.business_id, businessId),
        filters.kind ? eq(activity.kind, filters.kind) : undefined,
        filters.accountId ? eq(activity.account_id, filters.accountId) : undefined,
        filters.refType ? eq(activity.ref_type, filters.refType) : undefined,
        filters.refId ? eq(activity.ref_id, filters.refId) : undefined,
        search ? or(ilike(activity.message, search), ilike(activity.ref_id, search)) : undefined,
      ),
    )
    .orderBy(desc(activity.at), ...NewestIdFirst(activity.id))
    .limit(filters.limit);
};

export const activityRepository = { Insert, InsertMany, List };
