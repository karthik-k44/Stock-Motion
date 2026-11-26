import { and, asc, eq, getTableColumns, inArray } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import {
  accounts,
  activity,
  businesses,
  categories,
  customers,
  deliveries,
  deliveryLines,
  itemComponents,
  items,
  locations,
  memberships,
  movements,
  orderLines,
  orders,
  suppliers,
  type BusinessRow,
  type MembershipRow,
} from '@/backend/db/schema';

export type BusinessWithRoleRow = BusinessRow & { role: string };
export type MemberRow = MembershipRow & { name: string; email: string };

/** Businesses with the caller's role in them. */
const withRole = (q: Queryable, accountId: string) =>
  q
    .select({ ...getTableColumns(businesses), role: memberships.role })
    .from(businesses)
    .innerJoin(memberships, and(eq(memberships.business_id, businesses.id), eq(memberships.account_id, accountId)));

/** Members with their account's name and email. */
const members = (q: Queryable) =>
  q
    .select({ ...getTableColumns(memberships), name: accounts.name, email: accounts.email })
    .from(memberships)
    .innerJoin(accounts, eq(accounts.id, memberships.account_id));

const ListForAccount = (q: Queryable, accountId: string): Promise<BusinessWithRoleRow[]> => {
  return withRole(q, accountId).orderBy(asc(memberships.created_at));
};

const FindForAccount = async (q: Queryable, businessId: string, accountId: string): Promise<BusinessWithRoleRow | undefined> => {
  const [row] = await withRole(q, accountId).where(eq(businesses.id, businessId));
  return row;
};

const Find = async (q: Queryable, businessId: string): Promise<BusinessRow | undefined> => {
  const [row] = await q.select().from(businesses).where(eq(businesses.id, businessId));
  return row;
};

const Lock = async (q: Queryable, businessId: string): Promise<BusinessRow | undefined> => {
  const [row] = await q.select().from(businesses).where(eq(businesses.id, businessId)).for('update');
  return row;
};

/** Businesses an account created, oldest first. */
const ListCreatedBy = (q: Queryable, accountId: string): Promise<BusinessRow[]> => {
  return q.select().from(businesses).where(eq(businesses.created_by, accountId)).orderBy(asc(businesses.created_at));
};

const Insert = async (q: Queryable, input: { name: string; type: string; currency: string; createdBy: string }): Promise<BusinessRow> => {
  const [row] = await q
    .insert(businesses)
    .values({ name: input.name, type: input.type, currency: input.currency, created_by: input.createdBy })
    .returning();
  return row;
};

const Update = async (q: Queryable, businessId: string, input: { name?: string; currency?: string }): Promise<void> => {
  const changes = {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.currency !== undefined && { currency: input.currency }),
  };
  if (Object.keys(changes).length) await q.update(businesses).set(changes).where(eq(businesses.id, businessId));
};

/** The member's role plus the business type, or undefined when not a member. */
const FindMembership = async (q: Queryable, businessId: string, accountId: string): Promise<{ type: string; role: string } | undefined> => {
  const [row] = await q
    .select({ type: businesses.type, role: memberships.role })
    .from(memberships)
    .innerJoin(businesses, eq(businesses.id, memberships.business_id))
    .where(and(eq(memberships.business_id, businessId), eq(memberships.account_id, accountId)));
  return row;
};

const CountMembers = (q: Queryable, businessId: string, role?: string): Promise<number> => {
  return q.$count(memberships, and(eq(memberships.business_id, businessId), role === undefined ? undefined : eq(memberships.role, role)));
};

const InsertMembership = async (q: Queryable, input: { businessId: string; accountId: string; role: string; color: string }): Promise<void> => {
  await q.insert(memberships).values({ business_id: input.businessId, account_id: input.accountId, role: input.role, color: input.color });
};

const ListMembers = (q: Queryable, businessId: string): Promise<MemberRow[]> => {
  return members(q).where(eq(memberships.business_id, businessId)).orderBy(asc(memberships.created_at));
};

const LockMember = async (q: Queryable, businessId: string, accountId: string): Promise<MemberRow | undefined> => {
  const [row] = await members(q)
    .where(and(eq(memberships.business_id, businessId), eq(memberships.account_id, accountId)))
    .for('update', { of: memberships });
  return row;
};

const UpdateMemberRole = async (q: Queryable, businessId: string, accountId: string, role: string): Promise<void> => {
  await q
    .update(memberships)
    .set({ role })
    .where(and(eq(memberships.business_id, businessId), eq(memberships.account_id, accountId)));
};

const DeleteMember = async (q: Queryable, businessId: string, accountId: string): Promise<void> => {
  await q.delete(memberships).where(and(eq(memberships.business_id, businessId), eq(memberships.account_id, accountId)));
};

/**
 * Remove every operational row of a business, children before parents (order and delivery lines point at items
 * without cascading, so a business can't simply be deleted with its rows in it). Keeps the business, team and invites.
 */
const DeleteOperationalData = async (q: Queryable, businessId: string): Promise<void> => {
  const itemIds = q.select({ id: items.id }).from(items).where(eq(items.business_id, businessId));
  const orderIds = q.select({ id: orders.id }).from(orders).where(eq(orders.business_id, businessId));
  const deliveryIds = q.select({ id: deliveries.id }).from(deliveries).where(eq(deliveries.business_id, businessId));
  await q.delete(itemComponents).where(inArray(itemComponents.parent_id, itemIds));
  await q.delete(orderLines).where(inArray(orderLines.order_id, orderIds));
  await q.delete(deliveryLines).where(inArray(deliveryLines.delivery_id, deliveryIds));
  for (const table of [activity, movements, deliveries, orders, items, customers, suppliers, categories, locations]) {
    await q.delete(table).where(eq(table.business_id, businessId));
  }
};

/** Delete a business with everything in it (its team and invites go by cascade). */
const Delete = async (q: Queryable, businessId: string): Promise<void> => {
  await DeleteOperationalData(q, businessId);
  await q.delete(businesses).where(eq(businesses.id, businessId));
};

export const businessesRepository = {
  ListForAccount,
  FindForAccount,
  Find,
  Lock,
  ListCreatedBy,
  Insert,
  Update,
  FindMembership,
  CountMembers,
  InsertMembership,
  ListMembers,
  LockMember,
  UpdateMemberRole,
  DeleteMember,
  DeleteOperationalData,
  Delete,
};
