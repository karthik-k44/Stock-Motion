import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { RecordActivity } from '@/backend/common/services/audit';
import { ToIso } from '@/backend/common/utils/dates';
import { db, type Queryable } from '@/backend/db/client';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum, ActivityRefTypeEnum } from '@/backend/types/activity';
import type { ScopeType } from '@/backend/types/business';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import type { SupplierResponseType } from '@/backend/types/supplier';
import { suppliersRepository, type SupplierListRow } from './suppliers.repository';
import type { SupplierInput } from './suppliers.validators';

const RESOURCES = [ResourceTypeEnum.SUPPLIERS, ResourceTypeEnum.ACTIVITY];

const toSupplier = (r: SupplierListRow): SupplierResponseType => ({
  id: r.id,
  name: r.name,
  contact: r.contact,
  email: r.email,
  phone: r.phone,
  leadDays: r.lead_days,
  itemCount: r.item_count,
  openDeliveries: r.open_deliveries,
  createdAt: ToIso(r.created_at),
});

const List = async (scope: ScopeType, search?: string): Promise<SupplierResponseType[]> => {
  return (await suppliersRepository.List(db, scope.businessId, search)).map(toSupplier);
};

const Get = async (scope: ScopeType, id: string, q: Queryable = db): Promise<SupplierResponseType> => {
  const row = await suppliersRepository.Find(q, scope.businessId, id);
  if (!row) throw NotFound('Supplier', id);
  return toSupplier(row);
};

/** Validates a supplier id from a request body belongs to this business. */
const AssertExists = async (scope: ScopeType, id: string | null | undefined, q: Queryable = db): Promise<void> => {
  if (id && !(await suppliersRepository.Find(q, scope.businessId, id))) throw BadRequest('Choose one of your suppliers');
};

const Create = async (scope: ScopeType, input: SupplierInput): Promise<SupplierResponseType> => {
  const { supplier, activity } = await db.transaction(async (tx) => {
    if (await suppliersRepository.FindByName(tx, scope.businessId, input.name)) throw Conflict(`${input.name} already exists`);
    const id = await suppliersRepository.Insert(tx, scope.businessId, input);
    const activity = await RecordActivity(tx, scope, {
      kind: ActivityKindTypeEnum.CATALOG, message: `Added ${scope.template.labels.supplier.toLowerCase()} ${input.name}`,
      ref: { type: ActivityRefTypeEnum.SUPPLIER, id },
    });
    return { supplier: await Get(scope, id, tx), activity };
  });
  BroadcastChange(scope.businessId, RESOURCES, [activity]);
  return supplier;
};

const Update = async (scope: ScopeType, id: string, input: SupplierInput): Promise<SupplierResponseType> => {
  const supplier = await db.transaction(async (tx) => {
    await Get(scope, id, tx);
    const clash = await suppliersRepository.FindByName(tx, scope.businessId, input.name);
    if (clash && clash.id !== id) throw Conflict(`${input.name} already exists`);
    await suppliersRepository.Update(tx, id, input);
    return Get(scope, id, tx);
  });
  BroadcastChange(scope.businessId, [ResourceTypeEnum.SUPPLIERS, ResourceTypeEnum.ITEMS, ResourceTypeEnum.DELIVERIES]);
  return supplier;
};

const Delete = async (scope: ScopeType, id: string): Promise<void> => {
  const current = await Get(scope, id);
  if (current.openDeliveries) throw Conflict(`${current.name} has ${current.openDeliveries} open deliveries — receive them first`);
  // Items keep their stock; their supplier link is cleared by the foreign key.
  await suppliersRepository.Delete(db, id);
  BroadcastChange(scope.businessId, [ResourceTypeEnum.SUPPLIERS, ResourceTypeEnum.ITEMS]);
};

export const suppliersService = { List, Get, AssertExists, Create, Update, Delete };
