import type { Queryable } from '@/backend/db/client';
import { CategoryEntity } from '@/backend/db/entities';
import type { CategoryRow } from '@/backend/db/schema';

const categories = (q: Queryable) => q.getRepository(CategoryEntity);

const List = (q: Queryable, businessId: string): Promise<(CategoryRow & { item_count: number })[]> => {
  return categories(q)
    .createQueryBuilder('c')
    .select('c.*')
    .addSelect(
      '(SELECT COUNT(*)::int FROM items i WHERE i.business_id = c.business_id AND i.category = c.code AND i.archived_at IS NULL)',
      'item_count',
    )
    .where('c.business_id = :businessId', { businessId })
    .orderBy('c.position')
    .addOrderBy('c.name')
    .getRawMany();
};

const Find = async (q: Queryable, businessId: string, code: string): Promise<CategoryRow | undefined> => {
  return (await categories(q).findOneBy({ business_id: businessId, code })) ?? undefined;
};

/** Without a position the category goes last. */
const Insert = async (q: Queryable, businessId: string, input: { code: string; name: string; position?: number }): Promise<void> => {
  await categories(q)
    .createQueryBuilder()
    .insert()
    .values({
      business_id: businessId,
      code: input.code,
      name: input.name,
      position: input.position ?? (() => '(SELECT COALESCE(MAX(position), -1) + 1 FROM categories WHERE business_id = :businessId)'),
    })
    .setParameter('businessId', businessId)
    .execute();
};

const Delete = async (q: Queryable, businessId: string, code: string): Promise<void> => {
  await categories(q).delete({ business_id: businessId, code });
};

export const categoriesRepository = { List, Find, Insert, Delete };
