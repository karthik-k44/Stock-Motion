import { and, asc, desc, eq, gt, ilike, inArray, isNull, ne, not, or, sql } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import {
  accounts,
  deliveries,
  deliveryLines,
  itemComponents,
  items,
  itemViews,
  locations,
  movements,
  NewestIdFirst,
  orderLines,
  orders,
  type ItemViewRow,
  type MovementRow,
} from '@/backend/db/schema';
import { DeliveryStatusTypeEnum } from '@/backend/types/delivery';
import { ItemKindTypeEnum, type MovementTypeEnum } from '@/backend/types/item';

export type ItemLockRow = { id: string; sku: string; name: string; kind: ItemKindTypeEnum; on_hand: number; location: string | null };

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
  kind?: ItemKindTypeEnum;
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

export type ItemInsertType = ItemWriteType & { sku: string; kind: ItemKindTypeEnum; onHand: number; location: string | null };

/** A past ledger row (sample data only). */
export type HistoryMovementType = {
  businessId: string;
  itemId: string;
  at: Date;
  type: MovementTypeEnum;
  delta: number;
  balance: number;
  accountId: string;
  note: string;
};

const LOCK_COLUMNS = { id: items.id, sku: items.sku, name: items.name, kind: items.kind, on_hand: items.on_hand, location: items.location };

/** Reads go through the `item_views` view: reserved / available / incoming / status are derived there. */
const FindView = async (q: Queryable, businessId: string, sku: string): Promise<ItemViewRow | undefined> => {
  const [row] = await q.select().from(itemViews).where(and(eq(itemViews.business_id, businessId), eq(itemViews.sku, sku)));
  return row;
};

const statusFilter = (status: string | undefined) => {
  if (status === 'RESERVED') return gt(itemViews.reserved, 0);
  if (status === 'INCOMING') return gt(itemViews.incoming, 0);
  if (status) return and(eq(itemViews.status, status), ne(itemViews.kind, ItemKindTypeEnum.SERVICE));
  return undefined;
};

const ListViews = (q: Queryable, businessId: string, filters: ItemFiltersType = {}): Promise<ItemViewRow[]> => {
  const like = filters.search ? `%${filters.search}%` : undefined;
  const zoneCodes = filters.zone
    ? q.select({ code: locations.code }).from(locations).where(and(eq(locations.business_id, businessId), eq(locations.zone, filters.zone)))
    : undefined;
  return q
    .select()
    .from(itemViews)
    .where(
      and(
        eq(itemViews.business_id, businessId),
        like ? or(ilike(itemViews.name, like), ilike(itemViews.sku, like)) : undefined,
        filters.category ? eq(itemViews.category, filters.category) : undefined,
        filters.kind ? eq(itemViews.kind, filters.kind) : undefined,
        zoneCodes ? inArray(itemViews.location, zoneCodes) : undefined,
        statusFilter(filters.status),
      ),
    )
    .orderBy(desc(itemViews.kind), sql`${itemViews.location} asc nulls last`, asc(itemViews.sku));
};

const ListViewsByIds = async (q: Queryable, ids: string[]): Promise<ItemViewRow[]> => {
  return ids.length ? q.select().from(itemViews).where(inArray(itemViews.id, ids)) : [];
};

const ListViewsBySkus = async (q: Queryable, businessId: string, skus: string[]): Promise<ItemViewRow[]> => {
  return skus.length ? q.select().from(itemViews).where(and(eq(itemViews.business_id, businessId), inArray(itemViews.sku, skus))) : [];
};

const LockItem = async (q: Queryable, businessId: string, sku: string): Promise<ItemLockRow | undefined> => {
  const [row] = await q
    .select(LOCK_COLUMNS)
    .from(items)
    .where(and(eq(items.business_id, businessId), eq(items.sku, sku), isNull(items.archived_at)))
    .for('update');
  return row;
};

/** Lock stock rows in id order so concurrent orders can't deadlock each other. */
const LockItemsByIds = async (q: Queryable, ids: string[]): Promise<ItemLockRow[]> => {
  if (!ids.length) return [];
  return q.select(LOCK_COLUMNS).from(items).where(inArray(items.id, ids)).orderBy(asc(items.id)).for('update');
};

const SkuTaken = async (q: Queryable, businessId: string, sku: string): Promise<boolean> => {
  const [row] = await q
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.business_id, businessId), eq(items.sku, sku)))
    .limit(1);
  return Boolean(row);
};

const toItemRecord = (businessId: string, input: ItemInsertType) => ({
  business_id: businessId,
  sku: input.sku,
  name: input.name,
  category: input.category,
  unit: input.unit,
  kind: input.kind,
  on_hand: input.onHand,
  reorder_level: input.reorderLevel,
  cost: String(input.cost),
  price: String(input.price),
  location: input.location,
  supplier_id: input.supplierId,
});

const Insert = async (q: Queryable, businessId: string, input: ItemInsertType): Promise<string> => {
  const [row] = await q.insert(items).values(toItemRecord(businessId, input)).returning({ id: items.id });
  return row.id;
};

/** Many items in one statement. Returns each new id with its SKU (unique within a business). */
const InsertMany = async (q: Queryable, businessId: string, rows: ItemInsertType[]): Promise<{ id: string; sku: string }[]> => {
  if (!rows.length) return [];
  return q.insert(items).values(rows.map((r) => toItemRecord(businessId, r))).returning({ id: items.id, sku: items.sku });
};

/** Recipe rows for several made items at once (they must have none yet). */
const InsertComponents = async (q: Queryable, rows: { parentId: string; componentId: string; qty: number }[]): Promise<void> => {
  if (rows.length) await q.insert(itemComponents).values(rows.map((r) => ({ parent_id: r.parentId, component_id: r.componentId, qty: r.qty })));
};

const Update = async (q: Queryable, id: string, input: ItemWriteType): Promise<void> => {
  await q
    .update(items)
    .set({
      name: input.name,
      category: input.category,
      unit: input.unit,
      reorder_level: input.reorderLevel,
      cost: String(input.cost),
      price: String(input.price),
      supplier_id: input.supplierId,
    })
    .where(eq(items.id, id));
};

/** Archived items keep their history but free their location and SKU-visible slot. */
const Archive = async (q: Queryable, id: string): Promise<void> => {
  await q.update(items).set({ archived_at: new Date(), location: null }).where(eq(items.id, id));
};

const SetOnHand = async (q: Queryable, id: string, onHand: number): Promise<void> => {
  await q.update(items).set({ on_hand: onHand }).where(eq(items.id, id));
};

/** Returns the new on-hand quantity. A result below zero fails the `on_hand >= 0` check and rolls the change back. */
const AddOnHand = async (q: Queryable, id: string, delta: number): Promise<number> => {
  const [row] = await q
    .update(items)
    .set({ on_hand: sql`${items.on_hand} + ${delta}` })
    .where(eq(items.id, id))
    .returning({ on_hand: items.on_hand });
  return row.on_hand;
};

const SetLocation = async (q: Queryable, id: string, location: string | null): Promise<void> => {
  await q.update(items).set({ location }).where(eq(items.id, id));
};

const FindOccupant = async (q: Queryable, businessId: string, location: string): Promise<{ sku: string } | undefined> => {
  const [row] = await q
    .select({ sku: items.sku })
    .from(items)
    .where(and(eq(items.business_id, businessId), eq(items.location, location), isNull(items.archived_at)))
    .limit(1);
  return row;
};

const ListComponents = async (q: Queryable, parentIds: string[]): Promise<ComponentViewRow[]> => {
  if (!parentIds.length) return [];
  return q
    .select({
      parent_id: itemComponents.parent_id,
      component_id: itemComponents.component_id,
      qty: itemComponents.qty,
      sku: itemViews.sku,
      name: itemViews.name,
      unit: itemViews.unit,
      on_hand: itemViews.on_hand,
      available: itemViews.available,
    })
    .from(itemComponents)
    .innerJoin(itemViews, eq(itemViews.id, itemComponents.component_id))
    .where(inArray(itemComponents.parent_id, parentIds))
    .orderBy(asc(itemViews.sku));
};

const ReplaceComponents = async (q: Queryable, parentId: string, components: { componentId: string; qty: number }[]): Promise<void> => {
  await q.delete(itemComponents).where(eq(itemComponents.parent_id, parentId));
  await InsertComponents(q, components.map((c) => ({ parentId, componentId: c.componentId, qty: c.qty })));
};

const ListUsedIn = (q: Queryable, componentId: string): Promise<{ sku: string; name: string; qty: number }[]> => {
  return q
    .select({ sku: items.sku, name: items.name, qty: itemComponents.qty })
    .from(itemComponents)
    .innerJoin(items, eq(items.id, itemComponents.parent_id))
    .where(and(eq(itemComponents.component_id, componentId), isNull(items.archived_at)))
    .orderBy(asc(items.sku));
};

const InsertMovement = async (
  q: Queryable,
  input: { businessId: string; itemId: string; type: MovementTypeEnum; delta: number; balance: number; ref?: string | null; accountId: string; note: string },): Promise<void> => {
  await q.insert(movements).values({
    business_id: input.businessId,
    item_id: input.itemId,
    type: input.type,
    delta: input.delta,
    balance: input.balance,
    ref: input.ref ?? null,
    account_id: input.accountId,
    note: input.note,
  });
};

/** Past ledger rows in one insert, for sample data only. Real movements take the time they happen. */
const InsertSampleHistory = async (q: Queryable, rows: HistoryMovementType[]): Promise<void> => {
  if (!rows.length) return;
  await q.insert(movements).values(
    rows.map((r) => ({
      business_id: r.businessId, item_id: r.itemId, at: r.at, type: r.type, delta: r.delta, balance: r.balance, ref: null, account_id: r.accountId, note: r.note,
    })),
  );
};

const ListMovements = (q: Queryable, itemId: string, limit: number): Promise<MovementRow[]> => {
  return q
    .select({
      id: movements.id,
      at: movements.at,
      sku: items.sku,
      type: movements.type,
      delta: movements.delta,
      balance: movements.balance,
      ref: movements.ref,
      account_id: movements.account_id,
      actor_name: accounts.name,
      note: movements.note,
    })
    .from(movements)
    .innerJoin(items, eq(items.id, movements.item_id))
    .leftJoin(accounts, eq(accounts.id, movements.account_id))
    .where(eq(movements.item_id, itemId))
    .orderBy(desc(movements.at), ...NewestIdFirst(movements.id))
    .limit(limit);
};

/** What still depends on an item: open order lines, open delivery lines, made items built from it. */
const CountOpenUses = async (q: Queryable, itemId: string): Promise<{ orders: number; deliveries: number; parents: number }> => {
  const [openOrders, openDeliveries, parents] = await Promise.all([
    q
      .select({ id: orderLines.order_id })
      .from(orderLines)
      .innerJoin(orders, eq(orders.id, orderLines.order_id))
      .where(and(eq(orderLines.item_id, itemId), not(orders.closed))),
    q
      .select({ id: deliveryLines.delivery_id })
      .from(deliveryLines)
      .innerJoin(deliveries, eq(deliveries.id, deliveryLines.delivery_id))
      .where(and(eq(deliveryLines.item_id, itemId), ne(deliveries.status, DeliveryStatusTypeEnum.RECEIVED))),
    q
      .select({ id: itemComponents.parent_id })
      .from(itemComponents)
      .innerJoin(items, eq(items.id, itemComponents.parent_id))
      .where(and(eq(itemComponents.component_id, itemId), isNull(items.archived_at))),
  ]);
  return { orders: openOrders.length, deliveries: openDeliveries.length, parents: parents.length };
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
  InsertMany,
  InsertComponents,
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
  InsertSampleHistory,
  ListMovements,
  CountOpenUses,
};
