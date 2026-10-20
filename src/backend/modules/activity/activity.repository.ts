import type { Queryable } from '@/backend/db/client';
import type { ActivityRow, DbDate } from '@/backend/db/schema';

/** Activity rows with the actor's name. */
const SELECT = `
  SELECT a.id, a.at, a.kind, a.account_id, acc.name AS actor_name, a.message, a.ref_type, a.ref_id, a.meta
  FROM activity a LEFT JOIN accounts acc ON acc.id = a.account_id`;

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

const Insert = async (q: Queryable, input: InsertActivityType): Promise<ActivityRow> => {
  const { rows } = await q.query<ActivityRow>(
    `INSERT INTO activity (business_id, at, kind, account_id, message, ref_type, ref_id, meta)
     VALUES ($1, COALESCE($2, now()), $3, $4, $5, $6, $7, $8)
     RETURNING id, at, kind, account_id, NULL::text AS actor_name, message, ref_type, ref_id, meta`,
    [
      input.businessId, input.at ?? null, input.kind, input.accountId, input.message,
      input.refType ?? null, input.refId ?? null, JSON.stringify(input.meta ?? {}),
    ],
  );
  return rows[0];
};

const List = async (
  q: Queryable,
  businessId: string,
  filters: { kind?: string; accountId?: string; search?: string; refType?: string; refId?: string; limit: number },): Promise<ActivityRow[]> => {
  const where = ['a.business_id = $1'];
  const params: unknown[] = [businessId];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };
  if (filters.kind) add('a.kind = ?', filters.kind);
  if (filters.accountId) add('a.account_id = ?', filters.accountId);
  if (filters.refType) add('a.ref_type = ?', filters.refType);
  if (filters.refId) add('a.ref_id = ?', filters.refId);
  if (filters.search) add('(a.message ILIKE ? OR a.ref_id ILIKE ?)', `%${filters.search}%`);
  params.push(filters.limit);
  const { rows } = await q.query<ActivityRow>(
    `${SELECT} WHERE ${where.join(' AND ')} ORDER BY a.at DESC, a.id DESC LIMIT $${params.length}`,
    params,
  );
  return rows;
};

export const activityRepository = { Insert, List };
