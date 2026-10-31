import { EntitySchema } from 'typeorm';
import type { ItemComponentRow, ItemRecord, ItemViewRow } from '../schema';
import { CreatedAt, Id, Int, Key, Numeric, Text, TextOrNull, TimeOrNull } from './columns';

/** What is stocked or sold. `on_hand` is the only stored quantity; everything else is derived in `item_views`. */
export const ItemEntity = new EntitySchema<ItemRecord>({
  name: 'Item',
  tableName: 'items',
  columns: {
    id: Id,
    business_id: Text,
    sku: Text,
    name: Text,
    category: Text,
    unit: Text,
    kind: { ...Text, default: 'STOCK' },
    on_hand: { ...Int, default: 0 },
    reorder_level: { ...Int, default: 0 },
    cost: { ...Numeric(4), default: 0 },
    price: { ...Numeric(2), default: 0 },
    location: TextOrNull,
    supplier_id: TextOrNull,
    archived_at: TimeOrNull,
    created_at: CreatedAt,
  },
});

/** The recipe of a made item: which stock items it uses, and how many of each. */
export const ItemComponentEntity = new EntitySchema<ItemComponentRow>({
  name: 'ItemComponent',
  tableName: 'item_components',
  columns: { parent_id: Key, component_id: Key, qty: Int },
});

/**
 * Read-only: the `item_views` SQL view (migrations/sql) derives reserved, available, incoming and status from
 * orders and deliveries. It is the one place stock maths lives; writes always go to `items`.
 */
export const ItemViewEntity = new EntitySchema<ItemViewRow>({
  name: 'ItemView',
  tableName: 'item_views',
  type: 'view',
  synchronize: false,
  columns: {
    id: Key,
    business_id: Text,
    sku: Text,
    name: Text,
    category: Text,
    unit: Text,
    kind: Text,
    on_hand: Int,
    reorder_level: Int,
    cost: Numeric(4),
    price: Numeric(2),
    location: TextOrNull,
    supplier_id: TextOrNull,
    reserved: Int,
    available: Int,
    incoming: Int,
    status: Text,
  },
});
