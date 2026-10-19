import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { RecordActivity, RecordMovement } from '@/backend/common/services/audit';
import { ToIso, ToIsoOrNull } from '@/backend/common/utils/dates';
import { Plural } from '@/backend/common/utils/format';
import { db, type Queryable } from '@/backend/db/client';
import type { OrderLineRow, OrderRow } from '@/backend/db/schema';
import { businessesRepository } from '@/backend/modules/businesses/businesses.repository';
import { customersRepository } from '@/backend/modules/customers/customers.repository';
import { itemsRepository } from '@/backend/modules/items/items.repository';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum, ActivityRefTypeEnum, type ActivityResponseType } from '@/backend/types/activity';
import type { ScopeType } from '@/backend/types/business';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import { ItemKindTypeEnum, MovementTypeEnum } from '@/backend/types/item';
import type { OrderResponseType } from '@/backend/types/order';
import type { OrderStageType } from '@/backend/types/template';
import { ordersRepository, type OrderFiltersType } from './orders.repository';
import type {
  AdvanceOrderInput,
  ConsumeInput,
  CreateOrderInput,
  OrderLinesInput,
  SetLinesInput,
  UpdateOrderInput,
} from './orders.validators';

export const CANCELLED_STATUS = 'CANCELLED';

const ALL_RESOURCES = [
  ResourceTypeEnum.ORDERS, ResourceTypeEnum.ITEMS, ResourceTypeEnum.LOCATIONS, ResourceTypeEnum.DASHBOARD,
  ResourceTypeEnum.ACTIVITY, ResourceTypeEnum.CUSTOMERS,
];

type LoadedOrderType = { row: OrderRow; lines: OrderLineRow[] };

function toOrder({ row, lines }: LoadedOrderType): OrderResponseType {
  const own = lines.map((l) => ({
    sku: l.sku, name: l.name, kind: l.kind, unit: l.unit, location: l.location, qty: l.qty, done: l.done, unitPrice: Number(l.unit_price),
  }));
  return {
    number: row.number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    status: row.status,
    reserves: row.reserves,
    closed: row.closed,
    cancelled: row.cancelled,
    dueAt: ToIsoOrNull(row.due_at),
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    notes: row.notes,
    createdAt: ToIso(row.created_at),
    closedAt: ToIsoOrNull(row.closed_at),
    lines: own,
    totalUnits: own.reduce((s, l) => s + l.qty, 0),
    doneUnits: own.reduce((s, l) => s + l.done, 0),
    total: Math.round(own.reduce((s, l) => s + l.qty * l.unitPrice, 0) * 100) / 100,
  };
}

async function withLines(q: Queryable, rows: OrderRow[]): Promise<LoadedOrderType[]> {
  const lines = await ordersRepository.ListLines(q, rows.map((r) => r.id));
  return rows.map((row) => ({ row, lines: lines.filter((l) => l.order_id === row.id) }));
}

async function find(q: Queryable, scope: ScopeType, number: string, lock = false): Promise<LoadedOrderType> {
  const row = lock
    ? await ordersRepository.LockByNumber(q, scope.businessId, number)
    : await ordersRepository.FindByNumber(q, scope.businessId, number);
  if (!row) throw NotFound(scope.template.labels.order, number);
  return (await withLines(q, [row]))[0];
}

function stageOf(scope: ScopeType, status: string): OrderStageType | undefined {
  return scope.template.orderFlow.find((s) => s.status === status);
}

const statusLabel = (scope: ScopeType, status: string) =>
  status === CANCELLED_STATUS ? 'Cancelled' : (stageOf(scope, status)?.label ?? status);

function assertOpen(scope: ScopeType, order: LoadedOrderType) {
  if (order.row.closed) {
    throw Conflict(`${order.row.number} is ${statusLabel(scope, order.row.status).toLowerCase()} and can no longer change`);
  }
}

/** Run a change in a transaction, then broadcast it and return the fresh order. */
async function mutate(
  scope: ScopeType,
  number: () => string,
  fn: (tx: Queryable) => Promise<ActivityResponseType[]>,
): Promise<OrderResponseType> {
  const { order, activity } = await db.transaction(async (tx) => {
    const activity = await fn(tx);
    return { order: toOrder(await find(tx, scope, number())), activity };
  });
  BroadcastChange(scope.businessId, ALL_RESOURCES, activity);
  return order;
}

/**
 * Stock each line needs: stock lines need themselves, made lines need their components,
 * service lines need nothing. `qtyOf` picks how much of each line counts (open, or a slice).
 */
async function stockNeeds(
  tx: Queryable,
  lines: OrderLineRow[],
  qtyOf: (l: OrderLineRow) => number,
): Promise<Map<string, { name: string; needed: number }>> {
  const needs = new Map<string, { name: string; needed: number }>();
  const add = (id: string, name: string, n: number) => {
    if (n <= 0) return;
    const current = needs.get(id);
    needs.set(id, { name, needed: (current?.needed ?? 0) + n });
  };
  const made = lines.filter((l) => l.kind === ItemKindTypeEnum.MADE);
  const components = await itemsRepository.ListComponents(tx, made.map((l) => l.item_id));
  for (const l of lines) {
    if (l.kind === ItemKindTypeEnum.STOCK) add(l.item_id, l.name, qtyOf(l));
    if (l.kind === ItemKindTypeEnum.MADE) {
      for (const c of components.filter((c) => c.parent_id === l.item_id)) add(c.component_id, c.name, qtyOf(l) * c.qty);
    }
  }
  return needs;
}

/** Entering a reserving stage: every open quantity must be covered by available stock. */
async function assertAvailable(tx: Queryable, order: LoadedOrderType) {
  const needs = await stockNeeds(tx, order.lines, (l) => l.qty - l.done);
  await itemsRepository.LockItemsByIds(tx, [...needs.keys()]);
  const views = await itemsRepository.ListViewsByIds(tx, [...needs.keys()]);
  const shortages = views
    .map((v) => ({ sku: v.sku, name: v.name, unit: v.unit, needed: needs.get(v.id)!.needed, available: v.available }))
    .filter((s) => s.needed > s.available);
  if (shortages.length) {
    const list = shortages.map((s) => `${s.name} (need ${s.needed} ${s.unit}, ${s.available} available)`).join(', ');
    throw Conflict(`Not enough stock for ${order.row.number}: ${list}`, { shortages });
  }
}

/** Take quantities of lines out of stock, record the ledger and mark the lines done. */
async function consume(tx: Queryable, scope: ScopeType, order: LoadedOrderType, takes: { line: OrderLineRow; qty: number }[]) {
  const byItem = new Map(takes.map((t) => [t.line.item_id, t.qty]));
  const needs = await stockNeeds(tx, takes.map((t) => t.line), (l) => byItem.get(l.item_id) ?? 0);
  const locked = await itemsRepository.LockItemsByIds(tx, [...needs.keys()]);
  for (const item of locked) {
    const { needed } = needs.get(item.id)!;
    if (item.on_hand < needed) throw Conflict(`Only ${item.on_hand} × ${item.name} on hand — ${order.row.number} needs ${needed}`);
  }
  for (const item of locked) {
    const { needed } = needs.get(item.id)!;
    const balance = await itemsRepository.AddOnHand(tx, item.id, -needed);
    await RecordMovement(tx, scope, {
      itemId: item.id, type: MovementTypeEnum.CONSUME, delta: -needed, balance, ref: order.row.number,
      note: `${scope.template.labels.consumed} for ${order.row.customer_name}`,
    });
  }
  for (const t of takes) await ordersRepository.SetLineDone(tx, order.row.id, t.line.item_id, t.line.done + t.qty);
  return locked.map((i) => i.sku);
}

async function List(scope: ScopeType, filters: OrderFiltersType): Promise<OrderResponseType[]> {
  const rows = await ordersRepository.List(db, scope.businessId, filters);
  return (await withLines(db, rows)).map(toOrder);
}

async function Get(scope: ScopeType, number: string): Promise<OrderResponseType> {
  return toOrder(await find(db, scope, number));
}

async function resolveCustomer(tx: Queryable, scope: ScopeType, customerId: string | null, fallbackName: string) {
  if (!customerId) return { customerId: null, customerName: fallbackName };
  const customer = await customersRepository.Find(tx, scope.businessId, customerId);
  if (!customer) throw BadRequest(`Choose one of your ${scope.template.labels.customers.toLowerCase()}`);
  return { customerId, customerName: customer.name };
}

async function assertAssignee(tx: Queryable, scope: ScopeType, assigneeId: string | null) {
  if (assigneeId && !(await businessesRepository.FindMembership(tx, scope.businessId, assigneeId))) {
    throw BadRequest('Assign it to someone on your team');
  }
}

async function insertLines(tx: Queryable, scope: ScopeType, orderId: string, lines: OrderLinesInput) {
  const items = await itemsRepository.ListViewsBySkus(tx, scope.businessId, lines.map((l) => l.sku));
  for (const [position, line] of lines.entries()) {
    const item = items.find((i) => i.sku === line.sku);
    if (!item) throw BadRequest(`Unknown ${scope.template.labels.item.toLowerCase()} ${line.sku}`);
    await ordersRepository.InsertLine(tx, {
      orderId, itemId: item.id, position, qty: line.qty, unitPrice: line.unitPrice ?? Number(item.price),
    });
  }
}

function Create(scope: ScopeType, input: CreateOrderInput): Promise<OrderResponseType> {
  let number = '';
  return mutate(scope, () => number, async (tx) => {
    const customer = await resolveCustomer(tx, scope, input.customerId, input.customerName);
    await assertAssignee(tx, scope, input.assigneeId);
    const first = scope.template.orderFlow[0];
    number = await ordersRepository.Next(tx, scope.businessId, scope.template.orderPrefix);
    const orderId = await ordersRepository.Insert(tx, {
      businessId: scope.businessId, number, ...customer, status: first.status, reserves: first.reserves, closed: false,
      dueAt: input.dueAt, assigneeId: input.assigneeId, notes: input.notes,
    });
    await insertLines(tx, scope, orderId, input.lines);
    const units = input.lines.reduce((s, l) => s + l.qty, 0);
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.STATUS,
        message: `New ${scope.template.labels.order.toLowerCase()} ${number} for ${customer.customerName} · ${Plural(units, 'unit')}`,
        ref: { type: ActivityRefTypeEnum.ORDER, id: number },
        meta: { status: first.status, skus: input.lines.map((l) => l.sku), assignee: input.assigneeId },
      }),
    ];
  });
}

function Update(scope: ScopeType, number: string, input: UpdateOrderInput): Promise<OrderResponseType> {
  return mutate(scope, () => number, async (tx) => {
    const order = await find(tx, scope, number, true);
    assertOpen(scope, order);
    const customerId = input.customerId === undefined ? order.row.customer_id : input.customerId;
    const customer = await resolveCustomer(tx, scope, customerId, input.customerName ?? order.row.customer_name);
    const assigneeId = input.assigneeId === undefined ? order.row.assignee_id : input.assigneeId;
    await assertAssignee(tx, scope, assigneeId);
    await ordersRepository.Update(tx, order.row.id, {
      ...customer,
      dueAt: input.dueAt === undefined ? order.row.due_at : input.dueAt,
      assigneeId,
      notes: input.notes ?? order.row.notes,
    });
    if (assigneeId === order.row.assignee_id) return [];
    const member = assigneeId ? await businessesRepository.LockMember(tx, scope.businessId, assigneeId) : undefined;
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.STATUS,
        message: member ? `Assigned ${number} to ${member.name}` : `Unassigned ${number}`,
        ref: { type: ActivityRefTypeEnum.ORDER, id: number }, meta: { assignee: assigneeId },
      }),
    ];
  });
}

/** Lines can be changed while nothing has been reserved or used yet. */
function SetLines(scope: ScopeType, number: string, input: SetLinesInput): Promise<OrderResponseType> {
  return mutate(scope, () => number, async (tx) => {
    const order = await find(tx, scope, number, true);
    assertOpen(scope, order);
    if (order.row.reserves || order.lines.some((l) => l.done > 0)) {
      throw Conflict(`${number} is already ${statusLabel(scope, order.row.status).toLowerCase()} — its lines are locked`);
    }
    await ordersRepository.DeleteLines(tx, order.row.id);
    await insertLines(tx, scope, order.row.id, input.lines);
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.STATUS, message: `Changed the lines on ${number}`,
        ref: { type: ActivityRefTypeEnum.ORDER, id: number }, meta: { skus: input.lines.map((l) => l.sku) },
      }),
    ];
  });
}

/** Move an order to the next stage of its template's flow, applying that stage's stock rules. */
function Advance(scope: ScopeType, number: string, input: AdvanceOrderInput): Promise<OrderResponseType> {
  return mutate(scope, () => number, async (tx) => {
    const order = await find(tx, scope, number, true);
    assertOpen(scope, order);
    const flow = scope.template.orderFlow;
    const next = flow[flow.findIndex((s) => s.status === order.row.status) + 1];
    if (!next || next.status !== input.to) {
      throw Conflict(`${number} is ${statusLabel(scope, order.row.status)} — it can't move to ${statusLabel(scope, input.to)}`);
    }
    const open = order.lines.filter((l) => l.kind !== ItemKindTypeEnum.SERVICE && l.done < l.qty);
    if (next.requiresAllDone && open.length) {
      throw Conflict(`${scope.template.labels.consume} every line before ${next.action?.toLowerCase() ?? next.label} — ${open.length} still open`);
    }
    let skus = order.lines.map((l) => l.sku);
    if (next.reserves && !order.row.reserves) await assertAvailable(tx, order);
    if (next.consumeOnEnter) {
      const takes = order.lines.filter((l) => l.done < l.qty).map((line) => ({ line, qty: line.qty - line.done }));
      skus = await consume(tx, scope, order, takes);
    }
    await ordersRepository.SetStage(tx, order.row.id, { status: next.status, reserves: next.reserves, closed: next.closed });
    const startsReserving = next.reserves && !order.row.reserves;
    const units = order.lines.reduce((s, l) => s + l.qty - l.done, 0);
    return [
      await RecordActivity(tx, scope, {
        kind: startsReserving ? ActivityKindTypeEnum.ALLOCATION : ActivityKindTypeEnum.STATUS,
        message: startsReserving
          ? `${number} for ${order.row.customer_name} → ${next.label} · ${Plural(units, 'unit')} reserved`
          : `${number} for ${order.row.customer_name} → ${next.label}`,
        ref: { type: ActivityRefTypeEnum.ORDER, id: number },
        meta: { status: next.status, assignee: order.row.assignee_id, skus, locations: order.lines.map((l) => l.location ?? '') },
      }),
    ];
  });
}

/** Pick / use stock for one line (optionally part of it) or for every open line. */
function Consume(scope: ScopeType, number: string, input: ConsumeInput): Promise<OrderResponseType> {
  return mutate(scope, () => number, async (tx) => {
    const order = await find(tx, scope, number, true);
    assertOpen(scope, order);
    const stage = stageOf(scope, order.row.status);
    if (!stage?.consumeLines) {
      const allowed = scope.template.orderFlow.filter((s) => s.consumeLines).map((s) => s.label.toLowerCase()).join(' or ');
      throw Conflict(`${number} is ${statusLabel(scope, order.row.status).toLowerCase()} — lines can only be ${scope.template.labels.consumed.toLowerCase()} while ${allowed}`);
    }
    const targets = input.sku ? order.lines.filter((l) => l.sku === input.sku) : order.lines.filter((l) => l.done < l.qty);
    if (input.sku && !targets.length) throw NotFound(`Line on ${number} for`, input.sku);
    const takes = targets
      .map((line) => ({ line, qty: Math.min(input.qty ?? line.qty - line.done, line.qty - line.done) }))
      .filter((t) => t.qty > 0);
    if (!takes.length) throw BadRequest(input.sku ? `${input.sku} is already done` : `Every line on ${number} is already done`);
    if (input.qty && input.qty > takes[0].line.qty - takes[0].line.done) {
      throw BadRequest(`Only ${takes[0].line.qty - takes[0].line.done} left on that line`);
    }
    await consume(tx, scope, order, takes);
    const units = takes.reduce((s, t) => s + t.qty, 0);
    const message =
      takes.length === 1
        ? `${scope.template.labels.consumed} ${units} × ${takes[0].line.name} for ${number}`
        : `${scope.template.labels.consumed} ${takes.length} lines for ${number} (${Plural(units, 'unit')})`;
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.CONSUME, message,
        ref: { type: ActivityRefTypeEnum.ORDER, id: number },
        meta: { assignee: order.row.assignee_id, skus: takes.map((t) => t.line.sku), locations: takes.map((t) => t.line.location ?? '') },
      }),
    ];
  });
}

/** Cancel an open order: reservations are released; stock already used stays used. */
function Cancel(scope: ScopeType, number: string): Promise<OrderResponseType> {
  return mutate(scope, () => number, async (tx) => {
    const order = await find(tx, scope, number, true);
    assertOpen(scope, order);
    await ordersRepository.SetStage(tx, order.row.id, { status: CANCELLED_STATUS, reserves: false, closed: true, cancelled: true });
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.STATUS, message: `Cancelled ${number} for ${order.row.customer_name}`,
        ref: { type: ActivityRefTypeEnum.ORDER, id: number }, meta: { status: CANCELLED_STATUS },
      }),
    ];
  });
}

export const ordersService = { List, Get, Create, Update, SetLines, Advance, Consume, Cancel };
