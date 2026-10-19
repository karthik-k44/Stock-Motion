import type { Queryable } from '@/backend/db/client';
import type { LocationRow } from '@/backend/db/schema';

async function List(q: Queryable, businessId: string): Promise<LocationRow[]> {
  const { rows } = await q.query<LocationRow>('SELECT * FROM locations WHERE business_id = $1 ORDER BY position, code', [businessId]);
  return rows;
}

async function Find(q: Queryable, businessId: string, code: string): Promise<LocationRow | undefined> {
  const { rows } = await q.query<LocationRow>('SELECT * FROM locations WHERE business_id = $1 AND code = $2', [businessId, code]);
  return rows[0];
}

async function Insert(q: Queryable, businessId: string, input: { code: string; zone: string; name: string; position?: number }): Promise<void> {
  await q.query(
    `INSERT INTO locations (business_id, code, zone, name, position)
     VALUES ($1, $2, $3, $4, COALESCE($5, (SELECT COALESCE(MAX(position), -1) + 1 FROM locations WHERE business_id = $1)))`,
    [businessId, input.code, input.zone, input.name, input.position ?? null],
  );
}

export const locationsRepository = { List, Find, Insert };
