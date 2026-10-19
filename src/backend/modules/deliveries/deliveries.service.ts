import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { RecordActivity, RecordMovement } from '@/backend/common/services/audit';
import { Plural } from '@/backend/common/utils/format';
import { db, type Queryable } from '@/backend/db/client';
import type { DeliveryRow } from '@/backend/db/schema';
import { itemsRepository } from '@/backend/modules/items/items.repository';
import { suppliersRepository } from '@/backend/modules/suppliers/suppliers.repository';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum, ActivityRefTypeEnum, type ActivityResponseType } from '@/backend/types/activity';
import type { ScopeType } from '@/backend/types/business';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import { DeliveryStatusTypeEnum, type DeliveryResponseType } from '@/backend/types/delivery';
import { ItemKindTypeEnum, MovementTypeEnum, StockStatusTypeEnum } from '@/backend/types/item';
import { ToDeliveryResponse } from './deliveries.mapper';
import { deliveriesRepository, type DeliveryFiltersType } from './deliveries.repository';
import type { CreateDeliveryInput, ReceiveDeliveryInput, ReorderInput, UpdateDeliveryStatusInput } from './deliveries.validators';

const RESOURCES = [
  ResourceTypeEnum.DELIVERIES, ResourceTypeEnum.ITEMS, ResourceTypeEnum.LOCATIONS, ResourceTypeEnum.DASHBOARD,
  ResourceTypeEnum.ACTIVITY, ResourceTypeEnum.SUPPLIERS,
];

const STATUS_ORDER: DeliveryStatusTypeEnum[] = [
  DeliveryStatusTypeEnum.SCHEDULED, DeliveryStatusTypeEnum.IN_TRANSIT, DeliveryStatusTypeEnum.ARRIVED, DeliveryStatusTypeEnum.RECEIVED,
];
const STATUS_LABEL: Record<DeliveryStatusTypeEnum, string> = {
  SCHEDULED: 'scheduled', IN_TRANSIT: 'in transit', ARRIVED: 'arrived', RECEIVED: 'received',
};

async function load(q: Queryable, rows: DeliveryRow[]): Promise<DeliveryResponseType[]> {
  const lines = await deliveriesRepository.ListLines(q, rows.map((r) => r.id));
  return rows.map((r) => ToDeliveryResponse(r, lines));
}

async function find(q: Queryable, scope: ScopeType, number: string, lock = false) {
  const row = lock
    ? await deliveriesRepository.LockByNumber(q, scope.businessId, number)
    : await deliveriesRepository.FindByNumber(q, scope.businessId, number);
  if (!row) throw NotFound(scope.template.labels.delivery, number);
  return { row, delivery: (await load(q, [row]))[0] };
}

async function List(scope: ScopeType, filters: DeliveryFiltersType): Promise<DeliveryResponseType[]> {
  return load(db, await deliveriesRepository.List(db, scope.businessId, filters));
}

async function Get(scope: ScopeType, number: string): Promise<DeliveryResponseType> {
  return (await find(db, scope, number)).delivery;
}

/** Create one delivery inside a transaction; returns its number and the activity entry. */
async function insert(tx: Queryable, scope: ScopeType, input: CreateDeliveryInput) {
  let supplierName = input.supplierName;
  if (input.supplierId) {
    const supplier = await suppliersRepository.Find(tx, scope.businessId, input.supplierId);
    if (!supplier) throw BadRequest(`Choose one of your ${scope.template.labels.suppliers.toLowerCase()}`);
    supplierName = supplier.name;
  }
  const items = await itemsRepository.ListViewsBySkus(tx, scope.businessId, input.lines.map((l) => l.sku));
  const resolved = input.lines.map((line) => {
    const item = items.find((i) => i.sku === line.sku);
    if (!item) throw BadRequest(`Unknown ${scope.template.labels.item.toLowerCase()} ${line.sku}`);
    if (item.kind !== ItemKindTypeEnum.STOCK) throw BadRequest(`${item.name} is not stocked, so it can't be delivered`);
    return { item, line };
  });
  const number = await deliveriesRepository.Next(tx, scope.businessId, scope.template.deliveryPrefix);
  const deliveryId = await deliveriesRepository.Insert(tx, {
    businessId: scope.businessId, number, supplierId: input.supplierId, supplierName, vehicle: input.vehicle,
    reference: input.reference, expectedAt: input.expectedAt, status: input.status,
  });
  for (const [position, { item, line }] of resolved.entries()) {
    await deliveriesRepository.InsertLine(tx, {
      deliveryId, itemId: item.id, position, expected: line.expected, unitCost: line.unitCost ?? Number(item.cost),
    });
  }
  const units = input.lines.reduce((s, l) => s + l.expected, 0);
  const activity = await RecordActivity(tx, scope, {
    kind: ActivityKindTypeEnum.DELIVERY,
    message: `Booked ${number} from ${supplierName} · ${Plural(units, 'unit')} ${STATUS_LABEL[input.status]}`,
    ref: { type: ActivityRefTypeEnum.DELIVERY, id: number }, meta: { skus: input.lines.map((l) => l.sku) },
  });
  return { number, activity };
}

async function Create(scope: ScopeType, input: CreateDeliveryInput): Promise<DeliveryResponseType> {
  const result = await db.transaction(async (tx) => {
    const { number, activity } = await insert(tx, scope, input);
    return { delivery: (await find(tx, scope, number)).delivery, activity };
  });
  BroadcastChange(scope.businessId, RESOURCES, [result.activity]);
  return result.delivery;
}

/**
 * Book one delivery per supplier for every low / out-of-stock item that isn't already covered by
 * incoming stock, ordering enough to reach twice the reorder level.
 */
async function Reorder(scope: ScopeType, input: ReorderInput): Promise<DeliveryResponseType[]> {
  const result = await db.transaction(async (tx) => {
    const items = (await itemsRepository.ListViews(tx, scope.businessId, { kind: ItemKindTypeEnum.STOCK }))
      .filter((i) => i.status !== StockStatusTypeEnum.IN_STOCK && i.supplier_id)
      .filter((i) => !input.supplierId || i.supplier_id === input.supplierId)
      .map((i) => ({ item: i, qty: Math.max(i.reorder_level * 2 - i.available - i.incoming, 0) }))
      .filter((x) => x.qty > 0);
    if (!items.length) throw Conflict('Nothing needs reordering — every low item already has enough incoming');
    const bySupplier = new Map<string, typeof items>();
    for (const x of items) bySupplier.set(x.item.supplier_id!, [...(bySupplier.get(x.item.supplier_id!) ?? []), x]);

    const created: { number: string; activity: ActivityResponseType }[] = [];
    for (const [supplierId, list] of bySupplier) {
      const supplier = await suppliersRepository.Find(tx, scope.businessId, supplierId);
      const expectedAt = new Date(Date.now() + (supplier?.lead_days ?? 2) * 24 * 60 * 60_000).toISOString();
      created.push(
        await insert(tx, scope, {
          supplierId, supplierName: '', expectedAt, vehicle: '', reference: 'Auto reorder',
          status: DeliveryStatusTypeEnum.SCHEDULED,
          lines: list.map((x) => ({ sku: x.item.sku, expected: x.qty, unitCost: Number(x.item.cost) })),
        }),
      );
    }
    const deliveries = await Promise.all(created.map(async (c) => (await find(tx, scope, c.number)).delivery));
    return { deliveries, activity: created.map((c) => c.activity) };
  });
  BroadcastChange(scope.businessId, RESOURCES, result.activity);
  return result.deliveries;
}

async function UpdateStatus(scope: ScopeType, number: string, input: UpdateDeliveryStatusInput): Promise<DeliveryResponseType> {
  const result = await db.transaction(async (tx) => {
    const { row, delivery } = await find(tx, scope, number, true);
    const from = STATUS_ORDER.indexOf(delivery.status);
    const to = STATUS_ORDER.indexOf(input.to);
    if (delivery.status === DeliveryStatusTypeEnum.RECEIVED) throw Conflict(`${number} has already been received`);
    if (to <= from) return { delivery, activity: [] };
    await deliveriesRepository.SetStatus(tx, row.id, input.to);
    const message =
      input.to === DeliveryStatusTypeEnum.ARRIVED
        ? `${number} from ${delivery.supplierName} arrived${delivery.vehicle ? ` (${delivery.vehicle})` : ''}`
        : `${number} from ${delivery.supplierName} is on its way`;
    const activity = await RecordActivity(tx, scope, {
      kind: ActivityKindTypeEnum.DELIVERY, message,
      ref: { type: ActivityRefTypeEnum.DELIVERY, id: number }, meta: { status: input.to, skus: delivery.lines.map((l) => l.sku) },
    });
    return { delivery: (await find(tx, scope, number)).delivery, activity: [activity] };
  });
  BroadcastChange(scope.businessId, RESOURCES, result.activity);
  return result.delivery;
}

async function Receive(scope: ScopeType, number: string, input: ReceiveDeliveryInput): Promise<DeliveryResponseType> {
  const result = await db.transaction(async (tx) => {
    const { row, delivery } = await find(tx, scope, number, true);
    if (delivery.status === DeliveryStatusTypeEnum.RECEIVED) throw Conflict(`${number} has already been received`);
    const counted = new Map(input.lines.map((l) => [l.sku, l.received]));
    const unknown = [...counted.keys()].filter((sku) => !delivery.lines.some((l) => l.sku === sku));
    if (unknown.length) throw BadRequest(`${unknown.join(', ')} ${unknown.length === 1 ? 'is' : 'are'} not on ${number}`);

    const lineRows = await deliveriesRepository.ListLines(tx, [row.id]);
    await itemsRepository.LockItemsByIds(tx, lineRows.map((l) => l.item_id));
    let total = 0;
    let discrepancies = 0;
    for (const line of lineRows) {
      const qty = counted.get(line.sku) ?? line.expected;
      if (qty !== line.expected) discrepancies++;
      total += qty;
      await deliveriesRepository.SetLineReceived(tx, row.id, line.item_id, qty);
      if (qty === 0) continue;
      const balance = await itemsRepository.AddOnHand(tx, line.item_id, qty);
      await RecordMovement(tx, scope, {
        itemId: line.item_id, type: MovementTypeEnum.RECEIPT, delta: qty, balance, ref: number,
        note: `Received from ${delivery.supplierName}${qty !== line.expected ? ` (expected ${line.expected})` : ''}`,
      });
    }
    await deliveriesRepository.SetStatus(tx, row.id, DeliveryStatusTypeEnum.RECEIVED);
    const activity = await RecordActivity(tx, scope, {
      kind: ActivityKindTypeEnum.DELIVERY,
      message: `Received ${number} from ${delivery.supplierName} · ${Plural(total, 'unit')}${discrepancies ? ` (${discrepancies} line${discrepancies > 1 ? 's' : ''} short/over)` : ''}`,
      ref: { type: ActivityRefTypeEnum.DELIVERY, id: number },
      meta: { status: DeliveryStatusTypeEnum.RECEIVED, skus: delivery.lines.map((l) => l.sku), locations: delivery.lines.map((l) => l.location ?? '') },
    });
    return { delivery: (await find(tx, scope, number)).delivery, activity };
  });
  BroadcastChange(scope.businessId, RESOURCES, [result.activity]);
  return result.delivery;
}

export const deliveriesService = { List, Get, Create, Reorder, UpdateStatus, Receive };
