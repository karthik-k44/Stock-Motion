import type { Queryable } from '@/backend/db/client';
import type { CategoryRow } from '@/backend/db/schema';

const List = async (q: Queryable, businessId: string): Promise<(CategoryRow & { item_count: number })[]> => {
  const { rows } = await q.query<CategoryRow & { item_count: number }>(
    `SELECT c.*, (SELECT COUNT(*)::int FROM items i WHERE i.business_id = c.business_id AND i.category = c.code AND i.archived_at IS NULL) AS item_count
     FROM categories c WHERE c.business_id = $1 ORDER BY c.position, c.name`,
    [businessId],
  );
  return rows;
};

const Find = async (q: Queryable, businessId: string, code: string): Promise<CategoryRow | undefined> => {
  const { rows } = await q.query<CategoryRow>('SELECT * FROM categories WHERE business_id = $1 AND code = $2', [businessId, code]);
  return rows[0];
};

const Insert = async (q: Queryable, businessId: string, input: { code: string; name: string; position?: number }): Promise<void> => {
  await q.query(
    `INSERT INTO categories (business_id, code, name, position)
     VALUES ($1, $2, $3, COALESCE($4, (SELECT COALESCE(MAX(position), -1) + 1 FROM categories WHERE business_id = $1)))`,
    [businessId, input.code, input.name, input.position ?? null],
  );
};

const Delete = async (q: Queryable, businessId: string, code: string): Promise<void> => {
  await q.query('DELETE FROM categories WHERE business_id = $1 AND code = $2', [businessId, code]);
};

export const categoriesRepository = { List, Find, Insert, Delete };
