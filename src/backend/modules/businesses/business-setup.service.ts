import type { Queryable } from '@/backend/db/client';
import { activityRepository } from '@/backend/modules/activity/activity.repository';
import { categoriesRepository } from '@/backend/modules/categories/categories.repository';
import { customersRepository } from '@/backend/modules/customers/customers.repository';
import { deliveriesRepository } from '@/backend/modules/deliveries/deliveries.repository';
import { itemsRepository } from '@/backend/modules/items/items.repository';
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

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

const at = (dayOffset: number, hour: number, minute = 0): Date => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

/**
 * Give a new (or reset) business its template's storage locations and categories, and
 * optionally the template's sample data. Everything sample is attributed to `ownerId`.
 */
export const SetupBusiness = async (
  tx: Queryable,
  business: { id: string; type: string; name: string },
  ownerId: string,
  withSample: boolean,): Promise<void> => {
  const template = templatesService.Get(business.type);
  for (const l of templatesService.Locations(template)) await locationsRepository.Insert(tx, business.id, l);
  for (const [position, c] of template.categories.entries()) await categoriesRepository.Insert(tx, business.id, { ...c, position });
  if (withSample) await loadSample(tx, business, ownerId, templatesService.Definition(business.type).sample);
  await activityRepository.Insert(tx, {
    businessId: business.id,
    kind: ActivityKindTypeEnum.SYSTEM,
    accountId: ownerId,
    message: `Set up ${business.name} as a ${template.name.toLowerCase()}${withSample ? ' with sample data' : ''}`,
  });
};

const loadSample = async (tx: Queryable, business: { id: string; type: string }, ownerId: string, sample: SampleDataType) => {
  const template = templatesService.Get(business.type);

  const supplierIds = new Map<string, string>();
  for (const s of sample.suppliers) supplierIds.set(s.name, await suppliersRepository.Insert(tx, business.id, s));

  const customerIds = new Map<string, string>();
  for (const c of sample.customers) {
    const id = await customersRepository.Insert(tx, business.id, { ...c, notes: c.notes ?? '', createdAt: minutesAgo(60 * 24 * 40) });
    customerIds.set(c.name, id);
  }

  const items = new Map<string, { id: string; price: number; cost: number }>();
  for (const i of sample.items) {
    const id = await itemsRepository.Insert(tx, business.id, {
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
    });
    items.set(i.sku, { id, price: i.price, cost: i.cost });
  }
  const itemOf = (sku: string) => {
    const item = items.get(sku);
    if (!item) throw new Error(`Sample data references unknown SKU ${sku}`);
    return item;
  };
  for (const i of sample.items) {
    if (!i.components?.length) continue;
    await itemsRepository.ReplaceComponents(
      tx,
      itemOf(i.sku).id,
      i.components.map(([sku, qty]) => ({ componentId: itemOf(sku).id, qty })),
    );
  }

  for (const o of sample.orders) {
    const stage = templatesService.Stage(template, o.status);
    const closedAt = stage.closed ? minutesAgo(o.closedMinsAgo ?? 0) : null;
    const orderId = await ordersRepository.Insert(tx, {
      businessId: business.id,
      number: o.number,
      customerId: customerIds.get(o.customer) ?? null,
      customerName: o.customer,
      status: o.status,
      reserves: stage.reserves,
      closed: stage.closed,
      dueAt: o.dueDays === undefined ? null : at(o.dueDays, o.dueHour ?? 12),
      assigneeId: ownerId,
      createdAt: minutesAgo(o.createdMinsAgo),
      closedAt,
    });
    for (const [position, [sku, qty, done]] of o.lines.entries()) {
      await ordersRepository.InsertLine(tx, { orderId, itemId: itemOf(sku).id, position, qty, done, unitPrice: itemOf(sku).price });
    }
    if (closedAt) {
      await activityRepository.Insert(tx, {
        businessId: business.id, at: closedAt, kind: ActivityKindTypeEnum.STATUS, accountId: ownerId,
        message: `${o.number} for ${o.customer} → ${stage.label}`,
        refType: ActivityRefTypeEnum.ORDER, refId: o.number, meta: { status: o.status },
      });
    }
  }

  for (const d of sample.deliveries) {
    const expectedAt = at(d.dueDays, d.dueHour, d.dueMin);
    const received = d.status === DeliveryStatusTypeEnum.RECEIVED;
    const deliveryId = await deliveriesRepository.Insert(tx, {
      businessId: business.id,
      number: d.number,
      supplierId: supplierIds.get(d.supplier) ?? null,
      supplierName: d.supplier,
      vehicle: d.vehicle,
      reference: d.reference,
      expectedAt,
      status: d.status,
      receivedAt: received ? expectedAt : null,
    });
    for (const [position, [sku, expected]] of d.lines.entries()) {
      await deliveriesRepository.InsertLine(tx, {
        deliveryId, itemId: itemOf(sku).id, position, expected, received: received ? expected : null, unitCost: itemOf(sku).cost,
      });
    }
    if (received) {
      await activityRepository.Insert(tx, {
        businessId: business.id, at: expectedAt, kind: ActivityKindTypeEnum.DELIVERY, accountId: ownerId,
        message: `Received ${d.number} from ${d.supplier} · ${d.lines.reduce((s, [, n]) => s + n, 0)} units`,
        refType: ActivityRefTypeEnum.DELIVERY, refId: d.number,
      });
    }
  }

  // Worked backwards from today's counts, so the ledger ends exactly on what is on the shelf.
  const stocked = sample.items.filter((i) => (i.kind ?? ItemKindTypeEnum.STOCK) === ItemKindTypeEnum.STOCK);
  await itemsRepository.InsertSampleHistory(
    tx,
    stocked.flatMap((i) => {
      const onHand = i.onHand ?? 0;
      let balance = onHand;
      return [...SAMPLE_FORTNIGHT].reverse().flatMap((percent, day) => {
        const delta = Math.round((onHand * percent) / 100);
        if (!delta) return [];
        const row = {
          businessId: business.id, itemId: itemOf(i.sku).id, at: at(-(day + 1), 11), accountId: ownerId, delta, balance,
          type: delta > 0 ? MovementTypeEnum.RECEIPT : MovementTypeEnum.CONSUME,
          note: delta > 0 ? 'Sample stock in' : 'Sample stock out',
        };
        balance -= delta;
        return [row];
      });
    }),
  );
};
