import { and, asc, eq, isNull, max } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { categories, items, type CategoryRow } from '@/backend/db/schema';

const List = (q: Queryable, businessId: string): Promise<(CategoryRow & { item_count: number })[]> => {
  return q
    .select({
      business_id: categories.business_id,
      code: categories.code,
      name: categories.name,
      position: categories.position,
      item_count: q.$count(items, and(eq(items.business_id, categories.business_id), eq(items.category, categories.code), isNull(items.archived_at))),
    })
    .from(categories)
    .where(eq(categories.business_id, businessId))
    .orderBy(asc(categories.position), asc(categories.name));
};

const Find = async (q: Queryable, businessId: string, code: string): Promise<CategoryRow | undefined> => {
  const [row] = await q.select().from(categories).where(and(eq(categories.business_id, businessId), eq(categories.code, code)));
  return row;
};

/** Without a position the category goes last. */
const Insert = async (q: Queryable, businessId: string, input: { code: string; name: string; position?: number }): Promise<void> => {
  let position = input.position;
  if (position === undefined) {
    const [last] = await q.select({ position: max(categories.position) }).from(categories).where(eq(categories.business_id, businessId));
    position = (last?.position ?? -1) + 1;
  }
  await q.insert(categories).values({ business_id: businessId, code: input.code, name: input.name, position });
};

/** A whole set of categories, positions given, in one statement (a template's categories when a business is set up). */
const InsertMany = async (q: Queryable, businessId: string, rows: { code: string; name: string; position: number }[]): Promise<void> => {
  if (!rows.length) return;
  await q.insert(categories).values(rows.map((r) => ({ business_id: businessId, code: r.code, name: r.name, position: r.position })));
};

const Delete = async (q: Queryable, businessId: string, code: string): Promise<void> => {
  await q.delete(categories).where(and(eq(categories.business_id, businessId), eq(categories.code, code)));
};

export const categoriesRepository = { List, Find, Insert, InsertMany, Delete };
