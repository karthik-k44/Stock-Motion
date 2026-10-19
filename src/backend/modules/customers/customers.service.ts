import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { RecordActivity } from '@/backend/common/services/audit';
import { ToIso, ToIsoOrNull } from '@/backend/common/utils/dates';
import { db, type Queryable } from '@/backend/db/client';
import { ordersService } from '@/backend/modules/orders/orders.service';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum, ActivityRefTypeEnum } from '@/backend/types/activity';
import type { ScopeType } from '@/backend/types/business';
import type { CustomerDetailResponseType, CustomerResponseType } from '@/backend/types/customer';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import { customersRepository, type CustomerListRow } from './customers.repository';
import type { CustomerInput } from './customers.validators';

const toCustomer = (r: CustomerListRow): CustomerResponseType => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  address: r.address,
  notes: r.notes,
  orderCount: r.order_count,
  openOrders: r.open_orders,
  totalSpent: Number(r.total_spent),
  lastOrderAt: ToIsoOrNull(r.last_order_at),
  createdAt: ToIso(r.created_at),
});

async function List(scope: ScopeType, search?: string): Promise<CustomerResponseType[]> {
  return (await customersRepository.List(db, scope.businessId, search)).map(toCustomer);
}

async function find(scope: ScopeType, id: string, q: Queryable = db): Promise<CustomerResponseType> {
  const row = await customersRepository.Find(q, scope.businessId, id);
  if (!row) throw NotFound(scope.template.labels.customer, id);
  return toCustomer(row);
}

async function Get(scope: ScopeType, id: string): Promise<CustomerDetailResponseType> {
  const customer = await find(scope, id);
  return { ...customer, orders: await ordersService.List(scope, { customerId: id }) };
}

/** The customer's name for an order, validating the id belongs to this business. */
async function NameFor(scope: ScopeType, id: string, q: Queryable = db): Promise<string> {
  const row = await customersRepository.Find(q, scope.businessId, id);
  if (!row) throw BadRequest(`Choose one of your ${scope.template.labels.customers.toLowerCase()}`);
  return row.name;
}

async function Create(scope: ScopeType, input: CustomerInput): Promise<CustomerResponseType> {
  const { customer, activity } = await db.transaction(async (tx) => {
    const id = await customersRepository.Insert(tx, scope.businessId, input);
    const activity = await RecordActivity(tx, scope, {
      kind: ActivityKindTypeEnum.CATALOG, message: `Added ${scope.template.labels.customer.toLowerCase()} ${input.name}`,
      ref: { type: ActivityRefTypeEnum.CUSTOMER, id },
    });
    return { customer: await find(scope, id, tx), activity };
  });
  BroadcastChange(scope.businessId, [ResourceTypeEnum.CUSTOMERS, ResourceTypeEnum.ACTIVITY, ResourceTypeEnum.DASHBOARD], [activity]);
  return customer;
}

async function Update(scope: ScopeType, id: string, input: CustomerInput): Promise<CustomerResponseType> {
  await find(scope, id);
  await customersRepository.Update(db, id, input);
  BroadcastChange(scope.businessId, [ResourceTypeEnum.CUSTOMERS]);
  return find(scope, id);
}

async function Delete(scope: ScopeType, id: string): Promise<void> {
  const current = await find(scope, id);
  if (current.openOrders) {
    throw Conflict(`${current.name} has ${current.openOrders} open ${scope.template.labels.orders.toLowerCase()} — close them first`);
  }
  await customersRepository.Delete(db, id);
  BroadcastChange(scope.businessId, [ResourceTypeEnum.CUSTOMERS, ResourceTypeEnum.DASHBOARD]);
}

export const customersService = { List, Get, NameFor, Create, Update, Delete };
