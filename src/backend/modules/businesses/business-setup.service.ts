import { randomUUID } from 'node:crypto';
import type { Queryable } from '@/backend/db/client';
import { activityRepository, type InsertActivityType } from '@/backend/modules/activity/activity.repository';
import { categoriesRepository } from '@/backend/modules/categories/categories.repository';
import { customersRepository, type CustomerInsertType } from '@/backend/modules/customers/customers.repository';
import {
  deliveriesRepository,
  type DeliveryInsertType,
  type DeliveryLineInsertType,
} from '@/backend/modules/deliveries/deliveries.repository';
import { itemsRepository, type HistoryMovementType, type ItemInsertType } from '@/backend/modules/items/items.repository';
import { locationsRepository } from '@/backend/modules/locations/locations.repository';
import { ordersRepository, type OrderInsertType, type OrderLineInsertType } from '@/backend/modules/orders/orders.repository';
import { suppliersRepository, type SupplierWriteType } from '@/backend/modules/suppliers/suppliers.repository';
import type { SampleDataType } from '@/backend/modules/templates/definitions/definition-type';
import { templatesService } from '@/backend/modules/templates/templates.service';
import { ActivityKindTypeEnum, ActivityRefTypeEnum } from '@/backend/types/activity';
import { DeliveryStatusTypeEnum } from '@/backend/types/delivery';
import { ItemKindTypeEnum, MovementTypeEnum } from '@/backend/types/item';
import type { TemplateResponseType } from '@/backend/types/template';

/** A made-up fortnight behind the sample stock, oldest day first: how much came in or went out, as a percentage of today's count. */
const SAMPLE_FORTNIGHT = [8, -5, -7, 11, -4, -8, 6, 9, -6, -3, 7, -5, 4];

type BusinessRefType = { id: string; type: string; name: string };

/** Every row of a template's sample data for one business, with ids chosen up front so rows can link to each other. */
type SampleRowsType = {
  suppliers: (SupplierWriteType & { id: string })[];
  customers: (CustomerInsertType & { id: string })[];
  items: (ItemInsertType & { id: string })[];
  components: { parentId: string; componentId: string; qty: number }[];
  orders: (OrderInsertType & { id: string })[];
  orderLines: OrderLineInsertType[];
  deliveries: (DeliveryInsertType & { id: string })[];
  deliveryLines: DeliveryLineInsertType[];
  history: HistoryMovementType[];
  activity: InsertActivityType[];
};

const minutesAgo = (now: Date, m: number) => new Date(now.getTime() - m * 60_000);

const at = (now: Date, dayOffset: number, hour: number, minute = 0): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

/**
 * A template's sample data as rows for one business, built in memory so it can be written one statement per table:
 * on a hosted database every statement is a network round trip.
 */
const buildSample = (
  business: BusinessRefType,
  template: TemplateResponseType,
  ownerId: string,
  sample: SampleDataType,
  now: Date,): SampleRowsType => {
  const businessId = business.id;

  const suppliers = sample.suppliers.map((s) => ({ ...s, id: randomUUID() }));
  const supplierIds = new Map(suppliers.map((s) => [s.name, s.id]));

  const customers = sample.customers.map((c) => ({
    ...c, id: randomUUID(), notes: c.notes ?? '', createdAt: minutesAgo(now, 60 * 24 * 40),
  }));
  const customerIds = new Map(customers.map((c) => [c.name, c.id]));

  const items = sample.items.map((i) => ({
    id: randomUUID(),
    sku: i.sku,
    name: i.name,
    category: i.category,
    unit: i.unit,
    kind: i.kind ?? ItemKindTypeEnum.STOCK,
    onHand: i.onHand ?? 0,
    reorderLevel: i.reorderLevel,
    cost: i.cost,
    price: i.price,
    location: i.location ?? null,
    supplierId: i.supplier ? (supplierIds.get(i.supplier) ?? null) : null,
  }));
  const itemsBySku = new Map(items.map((i) => [i.sku, i]));
  const itemOf = (sku: string) => {
    const item = itemsBySku.get(sku);
    if (!item) throw new Error(`Sample data references unknown SKU ${sku}`);
    return item;
  };

  const components = sample.items.flatMap((i) =>
    (i.components ?? []).map(([sku, qty]) => ({ parentId: itemOf(i.sku).id, componentId: itemOf(sku).id, qty })),
  );

  const activity: InsertActivityType[] = [];
  const orders: SampleRowsType['orders'] = [];
  const orderLines: OrderLineInsertType[] = [];
  for (const o of sample.orders) {
    const stage = templatesService.Stage(template, o.status);
    const closedAt = stage.closed ? minutesAgo(now, o.closedMinsAgo ?? 0) : null;
    const id = randomUUID();
    orders.push({
      id,
      businessId,
      number: o.number,
      customerId: customerIds.get(o.customer) ?? null,
      customerName: o.customer,
      status: o.status,
      reserves: stage.reserves,
      closed: stage.closed,
      dueAt: o.dueDays === undefined ? null : at(now, o.dueDays, o.dueHour ?? 12),
      assigneeId: ownerId,
      createdAt: minutesAgo(now, o.createdMinsAgo),
      closedAt,
    });
    o.lines.forEach(([sku, qty, done], position) => {
      orderLines.push({ orderId: id, itemId: itemOf(sku).id, position, qty, done, unitPrice: itemOf(sku).price });
    });
    if (closedAt) {
      activity.push({
        businessId, at: closedAt, kind: ActivityKindTypeEnum.STATUS, accountId: ownerId,
        message: `${o.number} for ${o.customer} → ${stage.label}`,
        refType: ActivityRefTypeEnum.ORDER, refId: o.number, meta: { status: o.status },
      });
    }
  }

  const deliveries: SampleRowsType['deliveries'] = [];
  const deliveryLines: DeliveryLineInsertType[] = [];
  for (const d of sample.deliveries) {
    const expectedAt = at(now, d.dueDays, d.dueHour, d.dueMin);
    const received = d.status === DeliveryStatusTypeEnum.RECEIVED;
    const id = randomUUID();
    deliveries.push({
      id,
      businessId,
      number: d.number,
      supplierId: supplierIds.get(d.supplier) ?? null,
      supplierName: d.supplier,
      vehicle: d.vehicle,
      reference: d.reference,
      expectedAt,
      status: d.status,
      receivedAt: received ? expectedAt : null,
    });
    d.lines.forEach(([sku, expected], position) => {
      deliveryLines.push({
        deliveryId: id, itemId: itemOf(sku).id, position, expected, received: received ? expected : null, unitCost: itemOf(sku).cost,
      });
    });
    if (received) {
      activity.push({
        businessId, at: expectedAt, kind: ActivityKindTypeEnum.DELIVERY, accountId: ownerId,
        message: `Received ${d.number} from ${d.supplier} · ${d.lines.reduce((s, [, n]) => s + n, 0)} units`,
        refType: ActivityRefTypeEnum.DELIVERY, refId: d.number,
      });
    }
  }

  // Worked backwards from today's counts, so the ledger ends exactly on what is on the shelf.
  const history = items
    .filter((i) => i.kind === ItemKindTypeEnum.STOCK)
    .flatMap((i) => {
      let balance = i.onHand;
      return [...SAMPLE_FORTNIGHT].reverse().flatMap((percent, day) => {
        const delta = Math.round((i.onHand * percent) / 100);
        if (!delta) return [];
        const row: HistoryMovementType = {
          businessId, itemId: i.id, at: at(now, -(day + 1), 11), accountId: ownerId, delta, balance,
          type: delta > 0 ? MovementTypeEnum.RECEIPT : MovementTypeEnum.CONSUME,
          note: delta > 0 ? 'Sample stock in' : 'Sample stock out',
        };
        balance -= delta;
        return [row];
      });
    });

  return { suppliers, customers, items, components, orders, orderLines, deliveries, deliveryLines, history, activity };
};

/** Write the sample rows parents first, one statement per table. */
const writeSample = async (tx: Queryable, businessId: string, rows: SampleRowsType) => {
  await suppliersRepository.InsertMany(tx, businessId, rows.suppliers);
  await customersRepository.InsertMany(tx, businessId, rows.customers);
  await itemsRepository.InsertMany(tx, businessId, rows.items);
  await itemsRepository.InsertComponents(tx, rows.components);
  await ordersRepository.InsertMany(tx, rows.orders);
  await ordersRepository.InsertLines(tx, rows.orderLines);
  await deliveriesRepository.InsertMany(tx, rows.deliveries);
  await deliveriesRepository.InsertLines(tx, rows.deliveryLines);
  await itemsRepository.InsertSampleHistory(tx, rows.history);
};

/**
 * Give a new (or reset) business its template's storage locations and categories, and optionally the template's
 * sample data — the same set for every business of that type. Everything sample is attributed to `ownerId`.
 */
export const SetupBusiness = async (tx: Queryable, business: BusinessRefType, ownerId: string, withSample: boolean): Promise<void> => {
  const template = templatesService.Get(business.type);
  await locationsRepository.InsertMany(tx, business.id, templatesService.Locations(template));
  await categoriesRepository.InsertMany(tx, business.id, template.categories.map((c, position) => ({ code: c.code, name: c.name, position })));

  const activity: InsertActivityType[] = [];
  if (withSample) {
    const rows = buildSample(business, template, ownerId, templatesService.Definition(business.type).sample, new Date());
    await writeSample(tx, business.id, rows);
    activity.push(...rows.activity);
  }
  activity.push({
    businessId: business.id,
    kind: ActivityKindTypeEnum.SYSTEM,
    accountId: ownerId,
    message: `Set up ${business.name} as a ${template.name.toLowerCase()}${withSample ? ' with sample data' : ''}`,
  });
  await activityRepository.InsertMany(tx, activity);
};
