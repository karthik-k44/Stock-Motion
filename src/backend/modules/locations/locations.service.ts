import { db } from '@/backend/db/client';
import type { ItemViewRow } from '@/backend/db/schema';
import { ToItemResponse } from '@/backend/modules/items/items.mapper';
import type { LocationResponseType } from '@/backend/types/dashboard';

type LocationRow = { code: string; aisle: string; level: number; bin: number } & Partial<ItemViewRow>;

async function List(): Promise<LocationResponseType[]> {
  const { rows } = await db.query<LocationRow>(
    `SELECT l.code, l.aisle, l.level, l.bin,
            v.sku, v.name, v.category, v.unit, v.on_hand, v.reorder_level, v.location,
            v.reserved, v.available, v.incoming, v.status
     FROM locations l LEFT JOIN item_views v ON v.location = l.code
     ORDER BY l.aisle, l.level, l.bin`,
  );
  return rows.map((r) => ({
    code: r.code,
    aisle: r.aisle,
    level: r.level,
    bin: r.bin,
    item: r.sku ? ToItemResponse(r as ItemViewRow) : null,
  }));
}

export const locationsService = { List };
