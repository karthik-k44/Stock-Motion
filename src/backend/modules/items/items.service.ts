import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { RecordActivity, RecordMovement } from '@/backend/common/services/audit';
import { ToIso } from '@/backend/common/utils/dates';
import { Signed } from '@/backend/common/utils/format';
import { db, type Queryable } from '@/backend/db/client';
import type { MovementRow } from '@/backend/db/schema';
import { categoriesRepository } from '@/backend/modules/categories/categories.repository';
import { deliveriesRepository } from '@/backend/modules/deliveries/deliveries.repository';
import { locationsRepository } from '@/backend/modules/locations/locations.repository';
import { ordersRepository } from '@/backend/modules/orders/orders.repository';
import { suppliersRepository } from '@/backend/modules/suppliers/suppliers.repository';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum, ActivityRefTypeEnum, type ActivityResponseType } from '@/backend/types/activity';
import type { ScopeType } from '@/backend/types/business';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import {
  AdjustModeTypeEnum,
  AdjustReasonTypeEnum,
  ItemKindTypeEnum,
  MovementTypeEnum,
  type ItemDetailResponseType,
  type ItemResponseType,
  type MovementResponseType,
} from '@/backend/types/item';
import { ToItemResponse } from './items.mapper';
import { itemsRepository, type ItemLockRow } from './items.repository';
import type {
  AdjustStockInput,
  CreateItemInput,
  ListItemsQuery,
  RelocateInput,
  SetComponentsInput,
  UpdateItemInput,
} from './items.validators';

const REASON_LABEL: Record<AdjustReasonTypeEnum, string> = {
  [AdjustReasonTypeEnum.CYCLE_COUNT]: 'Stock count',
  [AdjustReasonTypeEnum.DAMAGED]: 'Damaged',
  [AdjustReasonTypeEnum.WASTE]: 'Waste / spoiled',
  [AdjustReasonTypeEnum.FOUND]: 'Found stock',
  [AdjustReasonTypeEnum.RETURN]: 'Customer return',
  [AdjustReasonTypeEnum.OTHER]: 'Other',
};

const STOCK_RESOURCES: ResourceTypeEnum[] = [ResourceTypeEnum.ITEMS, ResourceTypeEnum.LOCATIONS, ResourceTypeEnum.DASHBOARD, ResourceTypeEnum.ACTIVITY];
const CATALOG_RESOURCES = [...STOCK_RESOURCES, ResourceTypeEnum.CATEGORIES, ResourceTypeEnum.SUPPLIERS];

const view = async (q: Queryable, scope: ScopeType, sku: string): Promise<ItemResponseType> => {
  const row = await itemsRepository.FindView(q, scope.businessId, sku);
  if (!row) throw NotFound(scope.template.labels.item, sku);
  return ToItemResponse(row);
};

const lock = async (q: Queryable, scope: ScopeType, sku: string): Promise<ItemLockRow> => {
  const row = await itemsRepository.LockItem(q, scope.businessId, sku);
  if (!row) throw NotFound(scope.template.labels.item, sku);
  return row;
};

/** Run a change in a transaction, then broadcast it and return the fresh item. */
const mutate = async (
  scope: ScopeType,
  sku: string,
  resources: ResourceTypeEnum[],
  fn: (tx: Queryable) => Promise<ActivityResponseType[]>,): Promise<ItemResponseType> => {
  const { item, activity } = await db.transaction(async (tx) => {
    const activity = await fn(tx);
    return { item: await view(tx, scope, sku), activity };
  });
  BroadcastChange(scope.businessId, resources, activity);
  return item;
};

const List = async (scope: ScopeType, filters: ListItemsQuery): Promise<ItemResponseType[]> => {
  return (await itemsRepository.ListViews(db, scope.businessId, filters)).map(ToItemResponse);
};

const toMovement = (r: MovementRow): MovementResponseType => ({
  id: r.id, at: ToIso(r.at), sku: r.sku, type: r.type as MovementTypeEnum, delta: r.delta,
  balance: r.balance, ref: r.ref, accountId: r.account_id, actorName: r.actor_name, note: r.note,
});

const Get = async (scope: ScopeType, sku: string): Promise<ItemDetailResponseType> => {
  const item = await view(db, scope, sku);
  const [components, usedIn, movements, orders, incoming, supplier] = await Promise.all([
    itemsRepository.ListComponents(db, [item.id]),
    itemsRepository.ListUsedIn(db, item.id),
    itemsRepository.ListMovements(db, item.id, 50),
    ordersRepository.ListOpenForItem(db, item.id),
    deliveriesRepository.ListOpenForItem(db, item.id),
    item.supplierId ? suppliersRepository.Find(db, scope.businessId, item.supplierId) : Promise.resolve(undefined),
  ]);
  return {
    ...item,
    supplierName: supplier?.name ?? null,
    components: components.map((c) => ({ sku: c.sku, name: c.name, unit: c.unit, qty: c.qty, available: c.available })),
    usedIn,
    movements: movements.map(toMovement),
    openOrders: orders.map((r) => ({ number: r.number, customerName: r.customer_name, status: r.status, qty: r.qty, done: r.done })),
    incomingDeliveries: incoming.map((r) => ({
      number: r.number, supplierName: r.supplier_name, expectedAt: ToIso(r.expected_at), expected: r.expected,
    })),
  };
};

/** Category, supplier and location must belong to this business; exclusive bins can hold one item. */
const assertReferences = async (
  tx: Queryable,
  scope: ScopeType,
  input: { category: string; supplierId: string | null; location?: string | null },
  selfId?: string,) => {
  if (!(await categoriesRepository.Find(tx, scope.businessId, input.category))) throw BadRequest(`Unknown category ${input.category}`);
  if (input.supplierId && !(await suppliersRepository.Find(tx, scope.businessId, input.supplierId))) {
    throw BadRequest(`Choose one of your ${scope.template.labels.suppliers.toLowerCase()}`);
  }
  if (input.location) await assertLocationFree(tx, scope, input.location, selfId);
};

const assertLocationFree = async (tx: Queryable, scope: ScopeType, location: string, selfId?: string) => {
  if (!(await locationsRepository.Find(tx, scope.businessId, location))) throw BadRequest(`Unknown location ${location}`);
  if (!scope.template.exclusiveLocations) return;
  const occupant = await itemsRepository.FindOccupant(tx, scope.businessId, location);
  if (occupant && occupant.sku !== selfId) throw Conflict(`${location} is occupied by ${occupant.sku}`);
};

/** Components must be stock items of this business. */
const resolveComponents = async (tx: Queryable, scope: ScopeType, parentSku: string, list: SetComponentsInput['components']) => {
  const rows = await itemsRepository.ListViewsBySkus(tx, scope.businessId, list.map((c) => c.sku));
  return list.map((c) => {
    const row = rows.find((r) => r.sku === c.sku);
    if (!row) throw BadRequest(`Unknown component ${c.sku}`);
    if (row.sku === parentSku) throw BadRequest('An item cannot be made from itself');
    if (row.kind !== ItemKindTypeEnum.STOCK) throw BadRequest(`${row.name} is not a stock item — components must be counted stock`);
    return { componentId: row.id, qty: c.qty };
  });
};

const Create = (scope: ScopeType, input: CreateItemInput): Promise<ItemResponseType> => {
  return mutate(scope, input.sku, CATALOG_RESOURCES, async (tx) => {
    if (await itemsRepository.SkuTaken(tx, scope.businessId, input.sku)) throw Conflict(`SKU ${input.sku} is already used`);
    await assertReferences(tx, scope, input, input.sku);
    const components = await resolveComponents(tx, scope, input.sku, input.components);
    const id = await itemsRepository.Insert(tx, scope.businessId, input);
    if (components.length) await itemsRepository.ReplaceComponents(tx, id, components);
    if (input.onHand > 0) {
      await RecordMovement(tx, scope, {
        itemId: id, type: MovementTypeEnum.ADJUSTMENT, delta: input.onHand, balance: input.onHand, note: 'Opening stock',
      });
    }
    const label = input.kind === ItemKindTypeEnum.MADE ? scope.template.labels.made : scope.template.labels.item;
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.CATALOG, message: `Added ${label.toLowerCase()} ${input.name} (${input.sku})`,
        ref: { type: ActivityRefTypeEnum.ITEM, id: input.sku }, meta: { skus: [input.sku] },
      }),
    ];
  });
};

const Update = (scope: ScopeType, sku: string, input: UpdateItemInput): Promise<ItemResponseType> => {
  return mutate(scope, sku, CATALOG_RESOURCES, async (tx) => {
    const item = await lock(tx, scope, sku);
    await assertReferences(tx, scope, input, sku);
    await itemsRepository.Update(tx, item.id, input);
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.CATALOG, message: `Updated ${input.name}`,
        ref: { type: ActivityRefTypeEnum.ITEM, id: sku }, meta: { skus: [sku] },
      }),
    ];
  });
};

const Archive = async (scope: ScopeType, sku: string): Promise<void> => {
  const activity = await db.transaction(async (tx) => {
    const item = await lock(tx, scope, sku);
    const uses = await itemsRepository.CountOpenUses(tx, item.id);
    const labels = scope.template.labels;
    if (uses.orders) throw Conflict(`${item.name} is on ${uses.orders} open ${labels.orders.toLowerCase()}`);
    if (uses.deliveries) throw Conflict(`${item.name} is on ${uses.deliveries} open ${labels.deliveries.toLowerCase()}`);
    if (uses.parents) throw Conflict(`${item.name} is a component of ${uses.parents} ${labels.madePlural.toLowerCase()}`);
    await itemsRepository.Archive(tx, item.id);
    return RecordActivity(tx, scope, {
      kind: ActivityKindTypeEnum.CATALOG, message: `Archived ${item.name} (${sku})`,
      ref: { type: ActivityRefTypeEnum.ITEM, id: sku }, meta: { skus: [sku] },
    });
  });
  BroadcastChange(scope.businessId, CATALOG_RESOURCES, [activity]);
};

const SetComponents = (scope: ScopeType, sku: string, input: SetComponentsInput): Promise<ItemResponseType> => {
  return mutate(scope, sku, STOCK_RESOURCES, async (tx) => {
    const item = await lock(tx, scope, sku);
    if (item.kind !== ItemKindTypeEnum.MADE) throw BadRequest(`${item.name} is not a ${scope.template.labels.made.toLowerCase()}`);
    await itemsRepository.ReplaceComponents(tx, item.id, await resolveComponents(tx, scope, sku, input.components));
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.CATALOG,
        message: `Updated the recipe for ${item.name} (${input.components.length} component${input.components.length === 1 ? '' : 's'})`,
        ref: { type: ActivityRefTypeEnum.ITEM, id: sku }, meta: { skus: [sku, ...input.components.map((c) => c.sku)] },
      }),
    ];
  });
};

const Adjust = (scope: ScopeType, sku: string, input: AdjustStockInput): Promise<ItemResponseType> => {
  return mutate(scope, sku, STOCK_RESOURCES, async (tx) => {
    const item = await lock(tx, scope, sku);
    if (item.kind !== ItemKindTypeEnum.STOCK) throw BadRequest(`${item.name} has no stock of its own to adjust`);
    const current = await view(tx, scope, sku);
    const onHand = item.on_hand;
    if (input.expectedOnHand !== undefined && input.expectedOnHand !== onHand) {
      throw Conflict(`${item.name} changed to ${onHand} on hand since you started — check the count and try again`);
    }
    const next =
      input.mode === AdjustModeTypeEnum.ADD ? onHand + input.qty : input.mode === AdjustModeTypeEnum.REMOVE ? onHand - input.qty : input.qty;
    if (next === onHand) throw BadRequest('That adjustment would not change the quantity');
    if (next < 0) throw Conflict(`Only ${onHand} ${item.name} on hand — you can't remove ${input.qty}`);
    if (next < current.reserved) {
      throw Conflict(`${current.reserved} are reserved for open ${scope.template.labels.orders.toLowerCase()} — on hand can't go below that`);
    }
    await itemsRepository.SetOnHand(tx, item.id, next);
    const reason = REASON_LABEL[input.reason];
    const delta = next - onHand;
    await RecordMovement(tx, scope, {
      itemId: item.id, type: MovementTypeEnum.ADJUSTMENT, delta, balance: next,
      note: input.note ? `${reason} — ${input.note}` : reason,
    });
    const message =
      input.mode === AdjustModeTypeEnum.SET
        ? `Counted ${item.name}: ${onHand} → ${next} (${reason})`
        : `Adjusted ${item.name} by ${Signed(delta)} (${reason})`;
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.ADJUSTMENT, message,
        ref: { type: ActivityRefTypeEnum.ITEM, id: sku },
        meta: { skus: [sku], locations: item.location ? [item.location] : [] },
      }),
    ];
  });
};

const Relocate = (scope: ScopeType, sku: string, input: RelocateInput): Promise<ItemResponseType> => {
  return mutate(scope, sku, STOCK_RESOURCES, async (tx) => {
    const item = await lock(tx, scope, sku);
    if (item.kind !== ItemKindTypeEnum.STOCK) throw BadRequest(`${item.name} is not stored anywhere`);
    if (item.location === input.location) throw BadRequest(`${sku} is already in ${input.location ?? 'no location'}`);
    if (input.location) await assertLocationFree(tx, scope, input.location, sku);
    await itemsRepository.SetLocation(tx, item.id, input.location);
    const from = item.location ?? 'unassigned';
    const to = input.location ?? 'unassigned';
    await RecordMovement(tx, scope, {
      itemId: item.id, type: MovementTypeEnum.RELOCATION, delta: 0, balance: item.on_hand, note: `Moved ${from} → ${to}`,
    });
    return [
      await RecordActivity(tx, scope, {
        kind: ActivityKindTypeEnum.RELOCATION, message: `Moved ${item.name} from ${from} to ${to}`,
        ref: { type: ActivityRefTypeEnum.ITEM, id: sku }, meta: { skus: [sku], from, to },
      }),
    ];
  });
};

export const itemsService = { List, Get, Create, Update, Archive, SetComponents, Adjust, Relocate };
