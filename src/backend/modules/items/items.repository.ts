import type { Queryable } from '@/backend/db/client';
import type { ItemViewRow, MovementRow } from '@/backend/db/schema';

/** Columns of the `item_views` view (reserved / available / incoming / status are derived there). */
const VIEW_COLUMNS =
  'id, business_id, sku, name, category, unit, kind, on_hand, reorder_level, cost, price, location, supplier_id, reserved, available, incoming, status';

export type ItemLockRow = { id: string; sku: string; name: string; kind: string; on_hand: number; location: string | null };

export type ComponentViewRow = {
  parent_id: string;
  component_id: string;
  sku: string;
  name: string;
  unit: string;
  qty: number;
  on_hand: number;
  available: number;
};

export type ItemFiltersType = {
  search?: string;
  category?: string;
  zone?: string;
  kind?: string;
  /** IN_STOCK / LOW / OUT, or RESERVED / INCOMING */
  status?: string;
};

export type ItemWriteType = {
  name: string;
  category: string;
  unit: string;
  reorderLevel: number;
  cost: number;
  price: number;
  supplierId: string | null;
};

const FindView = async (q: Queryable, businessId: string, sku: string): Promise<ItemViewRow | undefined> => {
  const { rows } = await q.query<ItemViewRow>(`SELECT ${VIEW_COLUMNS} FROM item_views WHERE business_id = $1 AND sku = $2`, [
    businessId,
    sku,
  ]);
  return rows[0];
};

const ListViews = async (q: Queryable, businessId: string, filters: ItemFiltersType = {}): Promise<ItemViewRow[]> => {
  const where = ['business_id = $1'];
  const params: unknown[] = [businessId];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };
  if (filters.search) add('(name ILIKE ? OR sku ILIKE ?)', `%${filters.search}%`);
  if (filters.category) add('category = ?', filters.category);
  if (filters.kind) add('kind = ?', filters.kind);
  if (filters.zone) add('location IN (SELECT code FROM locations WHERE business_id = $1 AND zone = ?)', filters.zone);
  if (filters.status === 'RESERVED') where.push('reserved > 0');
  else if (filters.status === 'INCOMING') where.push('incoming > 0');
  else if (filters.status) add(`status = ? AND kind <> 'SERVICE'`, filters.status);
  const { rows } = await q.query<ItemViewRow>(
    `SELECT ${VIEW_COLUMNS} FROM item_views WHERE ${where.join(' AND ')} ORDER BY kind DESC, location NULLS LAST, sku`,
    params,
  );
  return rows;
};

const ListViewsByIds = async (q: Queryable, ids: string[]): Promise<ItemViewRow[]> => {
  if (!ids.length) return [];
  const { rows } = await q.query<ItemViewRow>(`SELECT ${VIEW_COLUMNS} FROM item_views WHERE id = ANY($1)`, [ids]);
  return rows;
};

const ListViewsBySkus = async (q: Queryable, businessId: string, skus: string[]): Promise<ItemViewRow[]> => {
  if (!skus.length) return [];
  const { rows } = await q.query<ItemViewRow>(`SELECT ${VIEW_COLUMNS} FROM item_views WHERE business_id = $1 AND sku = ANY($2)`, [
    businessId,
    skus,
  ]);
  return rows;
};

const LockItem = async (q: Queryable, businessId: string, sku: string): Promise<ItemLockRow | undefined> => {
  const { rows } = await q.query<ItemLockRow>(
    `SELECT id, sku, name, kind, on_hand, location FROM items
     WHERE business_id = $1 AND sku = $2 AND archived_at IS NULL FOR UPDATE`,
    [businessId, sku],
  );
  return rows[0];
};

/** Lock stock rows in id order so concurrent orders can't deadlock each other. */
const LockItemsByIds = async (q: Queryable, ids: string[]): Promise<ItemLockRow[]> => {
  if (!ids.length) return [];
  const { rows } = await q.query<ItemLockRow>(
    'SELECT id, sku, name, kind, on_hand, location FROM items WHERE id = ANY($1) ORDER BY id FOR UPDATE',
    [ids],
  );
  return rows;
};

const SkuTaken = async (q: Queryable, businessId: string, sku: string): Promise<boolean> => {
  const { rows } = await q.query('SELECT 1 FROM items WHERE business_id = $1 AND sku = $2', [businessId, sku]);
  return rows.length > 0;
};

const Insert = async (
  q: Queryable,
  businessId: string,
  input: ItemWriteType & { sku: string; kind: string; onHand: number; location: string | null },): Promise<string> => {
  const { rows } = await q.query<{ id: string }>(
    `INSERT INTO items (business_id, sku, name, category, unit, kind, on_hand, reorder_level, cost, price, location, supplier_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [
      businessId, input.sku, input.name, input.category, input.unit, input.kind, input.onHand, input.reorderLevel,
      input.cost, input.price, input.location, input.supplierId,
    ],
  );
  return rows[0].id;
};

const Update = async (q: Queryable, id: string, input: ItemWriteType): Promise<void> => {
  await q.query(
    `UPDATE items SET name = $2, category = $3, unit = $4, reorder_level = $5, cost = $6, price = $7, supplier_id = $8
     WHERE id = $1`,
    [id, input.name, input.category, input.unit, input.reorderLevel, input.cost, input.price, input.supplierId],
  );
};

const Archive = async (q: Queryable, id: string): Promise<void> => {
  // Archived items keep their history but free their location and SKU-visible slot.
  await q.query('UPDATE items SET archived_at = now(), location = NULL WHERE id = $1', [id]);
};

const SetOnHand = async (q: Queryable, id: string, onHand: number): Promise<void> => {
  await q.query('UPDATE items SET on_hand = $2 WHERE id = $1', [id, onHand]);
};

/** Returns the new on-hand quantity. */
const AddOnHand = async (q: Queryable, id: string, delta: number): Promise<number> => {
  const { rows } = await q.query<{ on_hand: number }>('UPDATE items SET on_hand = on_hand + $2 WHERE id = $1 RETURNING on_hand', [id, delta]);
  return rows[0].on_hand;
};

const SetLocation = async (q: Queryable, id: string, location: string | null): Promise<void> => {
  await q.query('UPDATE items SET location = $2 WHERE id = $1', [id, location]);
};

const FindOccupant = async (q: Queryable, businessId: string, location: string): Promise<{ sku: string } | undefined> => {
  const { rows } = await q.query<{ sku: string }>(
    'SELECT sku FROM items WHERE business_id = $1 AND location = $2 AND archived_at IS NULL',
    [businessId, location],
  );
  return rows[0];
};

const ListComponents = async (q: Queryable, parentIds: string[]): Promise<ComponentViewRow[]> => {
  if (!parentIds.length) return [];
  const { rows } = await q.query<ComponentViewRow>(
    `SELECT c.parent_id, c.component_id, v.sku, v.name, v.unit, c.qty, v.on_hand, v.available
     FROM item_components c JOIN item_views v ON v.id = c.component_id
     WHERE c.parent_id = ANY($1) ORDER BY v.sku`,
    [parentIds],
  );
  return rows;
};

const ReplaceComponents = async (q: Queryable, parentId: string, components: { componentId: string; qty: number }[]): Promise<void> => {
  await q.query('DELETE FROM item_components WHERE parent_id = $1', [parentId]);
  for (const c of components) {
    await q.query('INSERT INTO item_components (parent_id, component_id, qty) VALUES ($1, $2, $3)', [parentId, c.componentId, c.qty]);
  }
};

const ListUsedIn = async (q: Queryable, componentId: string): Promise<{ sku: string; name: string; qty: number }[]> => {
  const { rows } = await q.query<{ sku: string; name: string; qty: number }>(
    `SELECT p.sku, p.name, c.qty FROM item_components c JOIN items p ON p.id = c.parent_id
     WHERE c.component_id = $1 AND p.archived_at IS NULL ORDER BY p.sku`,
    [componentId],
  );
  return rows;
};

const InsertMovement = async (
  q: Queryable,
  input: { businessId: string; itemId: string; type: string; delta: number; balance: number; ref?: string | null; accountId: string; note: string },): Promise<void> => {
  await q.query(
    `INSERT INTO movements (business_id, item_id, type, delta, balance, ref, account_id, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [input.businessId, input.itemId, input.type, input.delta, input.balance, input.ref ?? null, input.accountId, input.note],
  );
};

const ListMovements = async (q: Queryable, itemId: string, limit: number): Promise<MovementRow[]> => {
  const { rows } = await q.query<MovementRow>(
    `SELECT m.id, m.at, i.sku, m.type, m.delta, m.balance, m.ref, m.account_id, a.name AS actor_name, m.note
     FROM movements m JOIN items i ON i.id = m.item_id LEFT JOIN accounts a ON a.id = m.account_id
     WHERE m.item_id = $1 ORDER BY m.at DESC, m.id DESC LIMIT $2`,
    [itemId, limit],
  );
  return rows;
};

/** What still depends on an item: open order lines, open delivery lines, made items built from it. */
const CountOpenUses = async (q: Queryable, itemId: string): Promise<{ orders: number; deliveries: number; parents: number }> => {
  const { rows } = await q.query<{ orders: number; deliveries: number; parents: number }>(
    `SELECT
       (SELECT COUNT(*)::int FROM order_lines ol JOIN orders o ON o.id = ol.order_id WHERE ol.item_id = $1 AND NOT o.closed) AS orders,
       (SELECT COUNT(*)::int FROM delivery_lines dl JOIN deliveries d ON d.id = dl.delivery_id WHERE dl.item_id = $1 AND d.status <> 'RECEIVED') AS deliveries,
       (SELECT COUNT(*)::int FROM item_components c JOIN items p ON p.id = c.parent_id WHERE c.component_id = $1 AND p.archived_at IS NULL) AS parents`,
    [itemId],
  );
  return rows[0];
};

export const itemsRepository = {
  FindView,
  ListViews,
  ListViewsByIds,
  ListViewsBySkus,
  LockItem,
  LockItemsByIds,
  SkuTaken,
  Insert,
  Update,
  Archive,
  SetOnHand,
  AddOnHand,
  SetLocation,
  FindOccupant,
  ListComponents,
  ReplaceComponents,
  ListUsedIn,
  InsertMovement,
  ListMovements,
  CountOpenUses,
};
