import type { Queryable } from '@/backend/db/client';
import { LocationEntity } from '@/backend/db/entities';
import type { LocationRow } from '@/backend/db/schema';

const locations = (q: Queryable) => q.getRepository(LocationEntity);

const List = (q: Queryable, businessId: string): Promise<LocationRow[]> => {
  return locations(q).find({ where: { business_id: businessId }, order: { position: 'ASC', code: 'ASC' } });
};

const Find = async (q: Queryable, businessId: string, code: string): Promise<LocationRow | undefined> => {
  return (await locations(q).findOneBy({ business_id: businessId, code })) ?? undefined;
};

/** Without a position the location goes last. */
const Insert = async (q: Queryable, businessId: string, input: { code: string; zone: string; name: string; position?: number }): Promise<void> => {
  await locations(q)
    .createQueryBuilder()
    .insert()
    .values({
      business_id: businessId,
      code: input.code,
      zone: input.zone,
      name: input.name,
      position: input.position ?? (() => '(SELECT COALESCE(MAX(position), -1) + 1 FROM locations WHERE business_id = :businessId)'),
    })
    .setParameter('businessId', businessId)
    .execute();
};

export const locationsRepository = { List, Find, Insert };
