import type { Queryable } from '@/backend/db/client';
import { AccountEntity, ItemEntity, NameOf, OrderEntity, OrderLineEntity } from '@/backend/db/entities';
import { NextNumber } from '@/backend/db/next-number';
import type { DbDate, OrderLineRow, OrderRow } from '@/backend/db/schema';

export type OrderFiltersType = {
  status?: string;
  /** true: open only · false: closed only */
  open?: boolean;
  search?: string;
  customerId?: string;
  limit?: number;
};

const orders = (q: Queryable) => q.getRepository(OrderEntity);
const lines = (q: Queryable) => q.getRepository(OrderLineEntity);

/** Orders of a business with their assignee's name. */
const select = (q: Queryable, businessId: string) =>
  q
    .createQueryBuilder(OrderEntity, 'o')
    .select('o.*')
    .addSelect('a.name', 'assignee_name')
    .leftJoin(NameOf(AccountEntity), 'a', 'a.id = o.assignee_id')
    .where('o.business_id = :businessId', { businessId });

const List = (q: Queryable, businessId: string, filters: OrderFiltersType = {}): Promise<OrderRow[]> => {
  const query = select(q, businessId);
  if (filters.status) query.andWhere('o.status = :status', { status: filters.status });
  if (filters.open !== undefined) query.andWhere('o.closed = :closed', { closed: !filters.open });
  if (filters.customerId) query.andWhere('o.customer_id = :customerId', { customerId: filters.customerId });
  if (filters.search) query.andWhere('(o.number ILIKE :search OR o.customer_name ILIKE :search)', { search: `%${filters.search}%` });
  return query
    .orderBy('o.closed')
    .addOrderBy('CASE WHEN o.closed THEN o.closed_at END', 'DESC')
    .addOrderBy('o.due_at', 'ASC', 'NULLS LAST')
    .addOrderBy('o.created_at')
    .limit(filters.limit ?? 500)
    .getRawMany<OrderRow>();
};

const FindByNumber = (q: Queryable, businessId: string, number: string): Promise<OrderRow | undefined> => {
  return select(q, businessId).andWhere('o.number = :number', { number }).getRawOne<OrderRow>();
};

/** The order row is locked for the rest of the transaction, so its stage changes one request at a time. */
const LockByNumber = (q: Queryable, businessId: string, number: string): Promise<OrderRow | undefined> => {
  return select(q, businessId).andWhere('o.number = :number', { number }).setLock('pessimistic_write', undefined, ['o']).getRawOne<OrderRow>();
};

const ListLines = async (q: Queryable, orderIds: string[]): Promise<OrderLineRow[]> => {
  if (!orderIds.length) return [];
  return q
    .createQueryBuilder(OrderLineEntity, 'ol')
    .select(['ol.order_id AS order_id', 'ol.item_id AS item_id', 'ol.qty AS qty', 'ol.done AS done', 'ol.unit_price AS unit_price'])
    .addSelect(['i.sku AS sku', 'i.name AS name', 'i.kind AS kind', 'i.unit AS unit', 'i.location AS location'])
    .innerJoin(NameOf(ItemEntity), 'i', 'i.id = ol.item_id')
    .where('ol.order_id IN (:...orderIds)', { orderIds })
    .orderBy('ol.position')
    .getRawMany<OrderLineRow>();
};

const Next = (q: Queryable, businessId: string, prefix: string) => NextNumber(q, 'orders', businessId, prefix, 1001);

const Insert = async (
  q: Queryable,
  input: {
    businessId: string;
    number: string;
    customerId: string | null;
    customerName: string;
    status: string;
    reserves: boolean;
    closed: boolean;
    dueAt: DbDate | null;
    assigneeId: string | null;
    notes?: string;
    createdAt?: DbDate;
    closedAt?: DbDate | null;
  },): Promise<string> => {
  const { identifiers } = await orders(q).insert({
    business_id: input.businessId,
    number: input.number,
    customer_id: input.customerId,
    customer_name: input.customerName,
    status: input.status,
    reserves: input.reserves,
    closed: input.closed,
    due_at: input.dueAt,
    assignee_id: input.assigneeId,
    notes: input.notes ?? '',
    created_at: input.createdAt,
    closed_at: input.closedAt ?? null,
  });
  return identifiers[0].id;
};

const InsertLine = async (
  q: Queryable,
  input: { orderId: string; itemId: string; position: number; qty: number; done?: number; unitPrice: number },): Promise<void> => {
  await lines(q).insert({
    order_id: input.orderId,
    item_id: input.itemId,
    position: input.position,
    qty: input.qty,
    done: input.done ?? 0,
    unit_price: input.unitPrice,
  });
};

const DeleteLines = async (q: Queryable, orderId: string): Promise<void> => {
  await lines(q).delete({ order_id: orderId });
};

const SetStage = async (
  q: Queryable,
  id: string,
  stage: { status: string; reserves: boolean; closed: boolean; cancelled?: boolean },): Promise<void> => {
  await orders(q).update(
    { id },
    {
      status: stage.status,
      reserves: stage.reserves,
      closed: stage.closed,
      cancelled: stage.cancelled ?? false,
      closed_at: stage.closed ? () => 'now()' : null,
    },
  );
};

const Update = async (
  q: Queryable,
  id: string,
  input: { customerId: string | null; customerName: string; dueAt: DbDate | null; assigneeId: string | null; notes: string },): Promise<void> => {
  await orders(q).update(
    { id },
    { customer_id: input.customerId, customer_name: input.customerName, due_at: input.dueAt, assignee_id: input.assigneeId, notes: input.notes },
  );
};

const SetLineDone = async (q: Queryable, orderId: string, itemId: string, done: number): Promise<void> => {
  await lines(q).update({ order_id: orderId, item_id: itemId }, { done });
};

const ClearAssignee = async (q: Queryable, businessId: string, accountId: string): Promise<void> => {
  await orders(q).update({ business_id: businessId, assignee_id: accountId }, { assignee_id: null });
};

/** Open orders that include an item, for the item detail panel. */
const ListOpenForItem = (
  q: Queryable,
  itemId: string,): Promise<{ number: string; customer_name: string; status: string; qty: number; done: number }[]> => {
  return q
    .createQueryBuilder(OrderLineEntity, 'ol')
    .select(['o.number AS number', 'o.customer_name AS customer_name', 'o.status AS status', 'ol.qty AS qty', 'ol.done AS done'])
    .innerJoin(NameOf(OrderEntity), 'o', 'o.id = ol.order_id')
    .where('ol.item_id = :itemId AND NOT o.closed', { itemId })
    .orderBy('o.due_at', 'ASC', 'NULLS LAST')
    .addOrderBy('o.created_at')
    .getRawMany();
};

export const ordersRepository = {
  List,
  FindByNumber,
  LockByNumber,
  ListLines,
  Next,
  Insert,
  InsertLine,
  DeleteLines,
  SetStage,
  Update,
  SetLineDone,
  ClearAssignee,
  ListOpenForItem,
};
