import { db } from '@/backend/db/client';
import type { ActivityRow } from '@/backend/db/schema';
import type { ActivityResponseType } from '@/backend/types/activity';
import { ACTIVITY_COLUMNS, ToActivityResponse } from './activity.mapper';
import type { ListActivityQuery } from './activity.validators';

async function List(filters: ListActivityQuery): Promise<ActivityResponseType[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };
  if (filters.kind) add('kind = ?', filters.kind);
  if (filters.userId) add('user_id = ?', filters.userId);
  if (filters.search) add('(message ILIKE ? OR ref_id ILIKE ?)', `%${filters.search}%`);
  params.push(filters.limit);
  const { rows } = await db.query<ActivityRow>(
    `SELECT ${ACTIVITY_COLUMNS} FROM activity ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY at DESC, id DESC LIMIT $${params.length}`,
    params,
  );
  return rows.map(ToActivityResponse);
}

export const activityService = { List };
