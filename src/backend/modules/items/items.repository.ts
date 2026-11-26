import { In, IsNull } from 'typeorm';
import type { Queryable } from '@/backend/db/client';
import {
  AccountEntity,
  DeliveryEntity,
  DeliveryLineEntity,
  ItemComponentEntity,
  ItemEntity,
  ItemViewEntity,
  MovementEntity,
  NameOf,
  OrderEntity,
  OrderLineEntity,
} from '@/backend/db/entities';
import type { ItemViewRow, MovementRow } from '@/backend/db/schema';

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

/** A new item. `id` is set by callers that link to it in the same batch (sample data); otherwise the database picks it. */
export type ItemInsertType = ItemWriteType & { id?: string; sku: string; kind: string; onHand: number; location: string | null };

/** A past ledger row (sample data only). */
export type HistoryMovementType = {
  businessId: string;
  itemId: string;
  at: Date;
  type: string;
  delta: number;
  balance: number;
  accountId: string;
  note: string;
};

const items = (q: Queryable) => q.getRepository(ItemEntity);
/** Reads go through the `item_views` view: reserved / available / incoming / status are derived there. */
const views = (q: Queryable) => q.getRepository(ItemViewEntity);
const LOCK_COLUMNS = ['i.id', 'i.sku', 'i.name', 'i.kind', 'i.on_hand', 'i.location'];

const FindView = async (q: Queryable, businessId: string, sku: string): Promise<ItemViewRow | undefined> => {
  return (await views(q).findOneBy({ business_id: businessId, sku })) ?? undefined;
};

const ListViews = (q: Queryable, businessId: string, filters: ItemFiltersType = {}): Promise<ItemViewRow[]> => {
  const query = views(q).createQueryBuilder('v').where('v.business_id = :businessId', { businessId });
  if (filters.search) query.andWhere('(v.name ILIKE :search OR v.sku ILIKE :search)', { search: `%${filters.search}%` });
  if (filters.category) query.andWhere('v.category = :category', { category: filters.category });
  if (filters.kind) query.andWhere('v.kind = :kind', { kind: filters.kind });
  if (filters.zone) {
    query.andWhere('v.location IN (SELECT code FROM locations WHERE business_id = :businessId AND zone = :zone)', { zone: filters.zone });
  }
  if (filters.status === 'RESERVED') query.andWhere('v.reserved > 0');
  else if (filters.status === 'INCOMING') query.andWhere('v.incoming > 0');
  else if (filters.status) query.andWhere(`v.status = :status AND v.kind <> 'SERVICE'`, { status: filters.status });
  return query.orderBy('v.kind', 'DESC').addOrderBy('v.location', 'ASC', 'NULLS LAST').addOrderBy('v.sku').getMany();
};

const ListViewsByIds = async (q: Queryable, ids: string[]): Promise<ItemViewRow[]> => {
  return ids.length ? views(q).findBy({ id: In(ids) }) : [];
};

const ListViewsBySkus = async (q: Queryable, businessId: string, skus: string[]): Promise<ItemViewRow[]> => {
  return skus.length ? views(q).findBy({ business_id: businessId, sku: In(skus) }) : [];
};

const LockItem = async (q: Queryable, businessId: string, sku: string): Promise<ItemLockRow | undefined> => {
  const row = await items(q)
    .createQueryBuilder('i')
    .select(LOCK_COLUMNS)
    .where('i.business_id = :businessId AND i.sku = :sku AND i.archived_at IS NULL', { businessId, sku })
    .setLock('pessimistic_write')
    .getOne();
  return row ?? undefined;
};

/** Lock stock rows in id order so concurrent orders can't deadlock each other. */
const LockItemsByIds = async (q: Queryable, ids: string[]): Promise<ItemLockRow[]> => {
  if (!ids.length) return [];
  return items(q).createQueryBuilder('i').select(LOCK_COLUMNS).where('i.id IN (:...ids)', { ids }).orderBy('i.id').setLock('pessimistic_write').getMany();
};

const SkuTaken = (q: Queryable, businessId: string, sku: string): Promise<boolean> => {
  return items(q).existsBy({ business_id: businessId, sku });
};

const toItemRecord = (businessId: string, input: ItemInsertType) => ({
  id: input.id,
  business_id: businessId,
  sku: input.sku,
  name: input.name,
  category: input.category,
  unit: input.unit,
  kind: input.kind,
  on_hand: input.onHand,
  reorder_level: input.reorderLevel,
  cost: input.cost,
  price: input.price,
  location: input.location,
  supplier_id: input.supplierId,
});

/** Many items in one statement; each carries its `id` so recipes, lines and history can link to it in the same batch. */
const InsertMany = async (q: Queryable, businessId: string, rows: (ItemInsertType & { id: string })[]): Promise<void> => {
  if (rows.length) await items(q).insert(rows.map((r) => toItemRecord(businessId, r)));
};

/** Recipe rows for several made items at once (they must have none yet). */
const InsertComponents = async (q: Queryable, rows: { parentId: string; componentId: string; qty: number }[]): Promise<void> => {
  if (rows.length) await q.getRepository(ItemComponentEntity).insert(rows.map((r) => ({ parent_id: r.parentId, component_id: r.componentId, qty: r.qty })));
};

const Insert = async (q: Queryable, businessId: string, input: ItemInsertType): Promise<string> => {
  const { identifiers } = await items(q).insert(toItemRecord(businessId, input));
  return identifiers[0].id;
};

const Update = async (q: Queryable, id: string, input: ItemWriteType): Promise<void> => {
  await items(q).update(
    { id },
    {
      name: input.name,
      category: input.category,
      unit: input.unit,
      reorder_level: input.reorderLevel,
      cost: input.cost,
      price: input.price,
      supplier_id: input.supplierId,
    },
  );
};

const Archive = async (q: Queryable, id: string): Promise<void> => {
  // Archived items keep their history but free their location and SKU-visible slot.
  await items(q).update({ id }, { archived_at: () => 'now()', location: null });
};

const SetOnHand = async (q: Queryable, id: string, onHand: number): Promise<void> => {
  await items(q).update({ id }, { on_hand: onHand });
};

/** Returns the new on-hand quantity. A result below zero fails the `on_hand >= 0` check and rolls the change back. */
const AddOnHand = async (q: Queryable, id: string, delta: number): Promise<number> => {
  const { raw } = await items(q)
    .createQueryBuilder()
    .update()
    .set({ on_hand: () => 'on_hand + :delta' })
    .setParameter('delta', delta)
    .where('id = :id', { id })
    .returning(['on_hand'])
    .execute();
  return raw[0].on_hand;
};

const SetLocation = async (q: Queryable, id: string, location: string | null): Promise<void> => {
  await items(q).update({ id }, { location });
};

const FindOccupant = async (q: Queryable, businessId: string, location: string): Promise<{ sku: string } | undefined> => {
  const row = await items(q).findOne({ select: { sku: true }, where: { business_id: businessId, location, archived_at: IsNull() } });
  return row ?? undefined;
};

const ListComponents = async (q: Queryable, parentIds: string[]): Promise<ComponentViewRow[]> => {
  if (!parentIds.length) return [];
  return q
    .createQueryBuilder(ItemComponentEntity, 'c')
    .select(['c.parent_id AS parent_id', 'c.component_id AS component_id', 'c.qty AS qty'])
    .addSelect(['v.sku AS sku', 'v.name AS name', 'v.unit AS unit', 'v.on_hand AS on_hand', 'v.available AS available'])
    .innerJoin(NameOf(ItemViewEntity), 'v', 'v.id = c.component_id')
    .where('c.parent_id IN (:...parentIds)', { parentIds })
    .orderBy('v.sku')
    .getRawMany<ComponentViewRow>();
};

const ReplaceComponents = async (q: Queryable, parentId: string, components: { componentId: string; qty: number }[]): Promise<void> => {
  const recipe = q.getRepository(ItemComponentEntity);
  await recipe.delete({ parent_id: parentId });
  if (components.length) await recipe.insert(components.map((c) => ({ parent_id: parentId, component_id: c.componentId, qty: c.qty })));
};

const ListUsedIn = (q: Queryable, componentId: string): Promise<{ sku: string; name: string; qty: number }[]> => {
  return q
    .createQueryBuilder(ItemComponentEntity, 'c')
    .select(['p.sku AS sku', 'p.name AS name', 'c.qty AS qty'])
    .innerJoin(NameOf(ItemEntity), 'p', 'p.id = c.parent_id')
    .where('c.component_id = :componentId AND p.archived_at IS NULL', { componentId })
    .orderBy('p.sku')
    .getRawMany();
};

const InsertMovement = async (
  q: Queryable,
  input: { businessId: string; itemId: string; type: string; delta: number; balance: number; ref?: string | null; accountId: string; note: string },): Promise<void> => {
  await q.getRepository(MovementEntity).insert({
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
const InsertSampleHistory = async (
  q: Queryable,
  rows: HistoryMovementType[],): Promise<void> => {
  if (!rows.length) return;
  await q.getRepository(MovementEntity).insert(
    rows.map((r) => ({ business_id: r.businessId, item_id: r.itemId, at: r.at, type: r.type, delta: r.delta, balance: r.balance, ref: null, account_id: r.accountId, note: r.note })),
  );
};

const ListMovements = (q: Queryable, itemId: string, limit: number): Promise<MovementRow[]> => {
  return q
    .createQueryBuilder(MovementEntity, 'm')
    .select(['m.id AS id', 'm.at AS at', 'i.sku AS sku', 'm.type AS type', 'm.delta AS delta', 'm.balance AS balance'])
    .addSelect(['m.ref AS ref', 'm.account_id AS account_id', 'a.name AS actor_name', 'm.note AS note'])
    .innerJoin(NameOf(ItemEntity), 'i', 'i.id = m.item_id')
    .leftJoin(NameOf(AccountEntity), 'a', 'a.id = m.account_id')
    .where('m.item_id = :itemId', { itemId })
    .orderBy('m.at', 'DESC')
    .addOrderBy('m.id', 'DESC')
    .limit(limit)
    .getRawMany<MovementRow>();
};

/** What still depends on an item: open order lines, open delivery lines, made items built from it. */
const CountOpenUses = async (q: Queryable, itemId: string): Promise<{ orders: number; deliveries: number; parents: number }> => {
  const [orders, deliveries, parents] = await Promise.all([
    q
      .createQueryBuilder(OrderLineEntity, 'ol')
      .innerJoin(NameOf(OrderEntity), 'o', 'o.id = ol.order_id')
      .where('ol.item_id = :itemId AND NOT o.closed', { itemId })
      .getCount(),
    q
      .createQueryBuilder(DeliveryLineEntity, 'dl')
      .innerJoin(NameOf(DeliveryEntity), 'd', 'd.id = dl.delivery_id')
      .where(`dl.item_id = :itemId AND d.status <> 'RECEIVED'`, { itemId })
      .getCount(),
    q
      .createQueryBuilder(ItemComponentEntity, 'c')
      .innerJoin(NameOf(ItemEntity), 'p', 'p.id = c.parent_id')
      .where('c.component_id = :itemId AND p.archived_at IS NULL', { itemId })
      .getCount(),
  ]);
  return { orders, deliveries, parents };
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
