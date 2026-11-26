import { and, asc, eq, max } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { locations, type LocationRow } from '@/backend/db/schema';

const List = (q: Queryable, businessId: string): Promise<LocationRow[]> => {
  return q.select().from(locations).where(eq(locations.business_id, businessId)).orderBy(asc(locations.position), asc(locations.code));
};

const Find = async (q: Queryable, businessId: string, code: string): Promise<LocationRow | undefined> => {
  const [row] = await q.select().from(locations).where(and(eq(locations.business_id, businessId), eq(locations.code, code)));
  return row;
};

/** Without a position the location goes last. */
const Insert = async (q: Queryable, businessId: string, input: { code: string; zone: string; name: string; position?: number }): Promise<void> => {
  let position = input.position;
  if (position === undefined) {
    const [last] = await q.select({ position: max(locations.position) }).from(locations).where(eq(locations.business_id, businessId));
    position = (last?.position ?? -1) + 1;
  }
  await q.insert(locations).values({ business_id: businessId, code: input.code, zone: input.zone, name: input.name, position });
};

/** A whole set of locations, positions given, in one statement (a template's storage when a business is set up). */
const InsertMany = async (q: Queryable, businessId: string, rows: { code: string; zone: string; name: string; position: number }[]): Promise<void> => {
  if (!rows.length) return;
  await q.insert(locations).values(rows.map((r) => ({ business_id: businessId, code: r.code, zone: r.zone, name: r.name, position: r.position })));
};

export const locationsRepository = { List, Find, Insert, InsertMany };
