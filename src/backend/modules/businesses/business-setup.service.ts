import type { Queryable } from '@/backend/db/client';
import { activityRepository, type InsertActivityType } from '@/backend/modules/activity/activity.repository';
import { categoriesRepository } from '@/backend/modules/categories/categories.repository';
import { customersRepository } from '@/backend/modules/customers/customers.repository';
import { deliveriesRepository } from '@/backend/modules/deliveries/deliveries.repository';
import { itemsRepository, type HistoryMovementType } from '@/backend/modules/items/items.repository';
import { locationsRepository } from '@/backend/modules/locations/locations.repository';
import { ordersRepository } from '@/backend/modules/orders/orders.repository';
import { suppliersRepository } from '@/backend/modules/suppliers/suppliers.repository';
import type { SampleDataType } from '@/backend/modules/templates/definitions/definition-type';
import { templatesService } from '@/backend/modules/templates/templates.service';
import { ActivityKindTypeEnum, ActivityRefTypeEnum } from '@/backend/types/activity';
import { DeliveryStatusTypeEnum } from '@/backend/types/delivery';
import { ItemKindTypeEnum, MovementTypeEnum } from '@/backend/types/item';

/** A made-up fortnight behind the sample stock, oldest day first: how much came in or went out, as a percentage of today's count. */
const SAMPLE_FORTNIGHT = [8, -5, -7, 11, -4, -8, 6, 9, -6, -3, 7, -5, 4];

type BusinessRefType = { id: string; type: string; name: string };
type SampleDeliveryType = SampleDataType['deliveries'][number];

const minutesAgo = (now: Date, m: number) => new Date(now.getTime() - m * 60_000);

const at = (now: Date, dayOffset: number, hour: number, minute = 0): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

/** Look up an id the database just assigned, by the row's natural key (a name, SKU or number). */
const idsBy = <T extends { id: string }>(rows: T[], keyOf: (row: T) => string) => {
  const ids = new Map(rows.map((r) => [keyOf(r), r.id]));
  return (key: string): string => {
    const id = ids.get(key);
    if (!id) throw new Error(`Sample data references unknown ${key}`);
    return id;
  };
};

/** Give a new (or reset) business its template's storage locations and categories. */
export const SetupBusiness = async (tx: Queryable, business: BusinessRefType, ownerId: string): Promise<void> => {
  const template = templatesService.Get(business.type);
  await locationsRepository.InsertMany(tx, business.id, templatesService.Locations(template));
  await categoriesRepository.InsertMany(tx, business.id, template.categories.map((c, position) => ({ code: c.code, name: c.name, position })));
  await activityRepository.Insert(tx, {
    businessId: business.id,
    kind: ActivityKindTypeEnum.SYSTEM,
    accountId: ownerId,
    message: `Set up ${business.name} as a ${template.name.toLowerCase()}`,
  });
};

/**
 * Fill a set-up business with its template's sample data — only the shared demo account has it. Everything is
 * attributed to `ownerId`, and times are relative to now so it always looks current. One statement per table:
 * on a hosted database every statement is a network round trip.
 */
export const LoadSampleData = async (tx: Queryable, business: BusinessRefType, ownerId: string): Promise<void> => {
  const template = templatesService.Get(business.type);
  const sample = templatesService.Definition(business.type).sample;
  const businessId = business.id;
  const now = new Date();

  const supplierId = idsBy(await suppliersRepository.InsertMany(tx, businessId, sample.suppliers), (r) => r.name);
  const customerId = idsBy(
    await customersRepository.InsertMany(
      tx,
      businessId,
      sample.customers.map((c) => ({ ...c, notes: c.notes ?? '', createdAt: minutesAgo(now, 60 * 24 * 40) })),
    ),
    (r) => r.name,
  );
  const sampleCustomers = new Set(sample.customers.map((c) => c.name));

  const itemRows = sample.items.map((i) => ({
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
    supplierId: i.supplier ? supplierId(i.supplier) : null,
  }));
  const itemId = idsBy(await itemsRepository.InsertMany(tx, businessId, itemRows), (r) => r.sku);
  const itemBySku = new Map(sample.items.map((i) => [i.sku, i]));
  const priceOf = (sku: string) => itemBySku.get(sku)?.price ?? 0;
  const costOf = (sku: string) => itemBySku.get(sku)?.cost ?? 0;

  await itemsRepository.InsertComponents(
    tx,
    sample.items.flatMap((i) => (i.components ?? []).map(([sku, qty]) => ({ parentId: itemId(i.sku), componentId: itemId(sku), qty }))),
  );

  const activity: InsertActivityType[] = [];
  const orderId = idsBy(
    await ordersRepository.InsertMany(
      tx,
      sample.orders.map((o) => {
        const stage = templatesService.Stage(template, o.status);
        return {
          businessId,
          number: o.number,
          customerId: sampleCustomers.has(o.customer) ? customerId(o.customer) : null,
          customerName: o.customer,
          status: o.status,
          reserves: stage.reserves,
          closed: stage.closed,
          dueAt: o.dueDays === undefined ? null : at(now, o.dueDays, o.dueHour ?? 12),
          assigneeId: ownerId,
          createdAt: minutesAgo(now, o.createdMinsAgo),
          closedAt: stage.closed ? minutesAgo(now, o.closedMinsAgo ?? 0) : null,
        };
      }),
    ),
    (r) => r.number,
  );
  await ordersRepository.InsertLines(
    tx,
    sample.orders.flatMap((o) =>
      o.lines.map(([sku, qty, done], position) => ({ orderId: orderId(o.number), itemId: itemId(sku), position, qty, done, unitPrice: priceOf(sku) })),
    ),
  );
  for (const o of sample.orders) {
    const stage = templatesService.Stage(template, o.status);
    if (!stage.closed) continue;
    activity.push({
      businessId, at: minutesAgo(now, o.closedMinsAgo ?? 0), kind: ActivityKindTypeEnum.STATUS, accountId: ownerId,
      message: `${o.number} for ${o.customer} → ${stage.label}`,
      refType: ActivityRefTypeEnum.ORDER, refId: o.number, meta: { status: o.status },
    });
  }

  const expectedAt = (d: SampleDeliveryType) => at(now, d.dueDays, d.dueHour, d.dueMin);
  const isReceived = (d: SampleDeliveryType) => d.status === DeliveryStatusTypeEnum.RECEIVED;
  const deliveryId = idsBy(
    await deliveriesRepository.InsertMany(
      tx,
      sample.deliveries.map((d) => ({
        businessId,
        number: d.number,
        supplierId: supplierId(d.supplier),
        supplierName: d.supplier,
        vehicle: d.vehicle,
        reference: d.reference,
        expectedAt: expectedAt(d),
        status: d.status,
        receivedAt: isReceived(d) ? expectedAt(d) : null,
      })),
    ),
    (r) => r.number,
  );
  await deliveriesRepository.InsertLines(
    tx,
    sample.deliveries.flatMap((d) =>
      d.lines.map(([sku, expected], position) => ({
        deliveryId: deliveryId(d.number), itemId: itemId(sku), position, expected, received: isReceived(d) ? expected : null, unitCost: costOf(sku),
      })),
    ),
  );
  for (const d of sample.deliveries.filter(isReceived)) {
    activity.push({
      businessId, at: expectedAt(d), kind: ActivityKindTypeEnum.DELIVERY, accountId: ownerId,
      message: `Received ${d.number} from ${d.supplier} · ${d.lines.reduce((s, [, n]) => s + n, 0)} units`,
      refType: ActivityRefTypeEnum.DELIVERY, refId: d.number,
    });
  }

  // Worked backwards from today's counts, so the ledger ends exactly on what is on the shelf.
  const history = itemRows
    .filter((i) => i.kind === ItemKindTypeEnum.STOCK)
    .flatMap((i) => {
      let balance = i.onHand;
      return [...SAMPLE_FORTNIGHT].reverse().flatMap((percent, day): HistoryMovementType[] => {
        const delta = Math.round((i.onHand * percent) / 100);
        if (!delta) return [];
        const row: HistoryMovementType = {
          businessId, itemId: itemId(i.sku), at: at(now, -(day + 1), 11), accountId: ownerId, delta, balance,
          type: delta > 0 ? MovementTypeEnum.RECEIPT : MovementTypeEnum.CONSUME,
          note: delta > 0 ? 'Sample stock in' : 'Sample stock out',
        };
        balance -= delta;
        return [row];
      });
    });
  await itemsRepository.InsertSampleHistory(tx, history);

  activity.push({ businessId, kind: ActivityKindTypeEnum.SYSTEM, accountId: ownerId, message: `Loaded the ${template.name.toLowerCase()} sample data` });
  await activityRepository.InsertMany(tx, activity);
};
