import type { Queryable } from '@/backend/db/client';
import {
  AccountEntity,
  ActivityEntity,
  BusinessEntity,
  CategoryEntity,
  CustomerEntity,
  DeliveryEntity,
  DeliveryLineEntity,
  ItemComponentEntity,
  ItemEntity,
  LocationEntity,
  MembershipEntity,
  MovementEntity,
  NameOf,
  OrderEntity,
  OrderLineEntity,
  SupplierEntity,
} from '@/backend/db/entities';
import type { BusinessRow, MembershipRow } from '@/backend/db/schema';

export type BusinessWithRoleRow = BusinessRow & { role: string };
export type MemberRow = MembershipRow & { name: string; email: string };

const businesses = (q: Queryable) => q.getRepository(BusinessEntity);
const memberships = (q: Queryable) => q.getRepository(MembershipEntity);

/** A business with the caller's role in it. */
const withRole = (q: Queryable, accountId: string) =>
  q
    .createQueryBuilder(BusinessEntity, 'b')
    .select('b.*')
    .addSelect('m.role', 'role')
    .innerJoin(NameOf(MembershipEntity), 'm', 'm.business_id = b.id')
    .where('m.account_id = :accountId', { accountId });

/** Members with their account's name and email. */
const members = (q: Queryable, businessId: string) =>
  q
    .createQueryBuilder(MembershipEntity, 'm')
    .select('m.*')
    .addSelect('a.name', 'name')
    .addSelect('a.email', 'email')
    .innerJoin(NameOf(AccountEntity), 'a', 'a.id = m.account_id')
    .where('m.business_id = :businessId', { businessId });

const ListForAccount = (q: Queryable, accountId: string): Promise<BusinessWithRoleRow[]> => {
  return withRole(q, accountId).orderBy('m.created_at').getRawMany<BusinessWithRoleRow>();
};

const FindForAccount = (q: Queryable, businessId: string, accountId: string): Promise<BusinessWithRoleRow | undefined> => {
  return withRole(q, accountId).andWhere('b.id = :businessId', { businessId }).getRawOne<BusinessWithRoleRow>();
};

const Find = async (q: Queryable, businessId: string): Promise<BusinessRow | undefined> => {
  return (await businesses(q).findOneBy({ id: businessId })) ?? undefined;
};

const Lock = async (q: Queryable, businessId: string): Promise<BusinessRow | undefined> => {
  const row = await businesses(q).createQueryBuilder('b').where('b.id = :businessId', { businessId }).setLock('pessimistic_write').getOne();
  return row ?? undefined;
};

const Insert = async (q: Queryable, input: { name: string; type: string; currency: string; createdBy: string }): Promise<BusinessRow> => {
  const { raw } = await businesses(q)
    .createQueryBuilder()
    .insert()
    .values({ name: input.name, type: input.type, currency: input.currency, created_by: input.createdBy })
    .returning('*')
    .execute();
  return raw[0];
};

const Update = async (q: Queryable, businessId: string, input: { name?: string; currency?: string }): Promise<void> => {
  const changes = {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.currency !== undefined && { currency: input.currency }),
  };
  if (Object.keys(changes).length) await businesses(q).update({ id: businessId }, changes);
};

/** The member's role plus the business type, or undefined when not a member. */
const FindMembership = (q: Queryable, businessId: string, accountId: string): Promise<{ type: string; role: string } | undefined> => {
  return q
    .createQueryBuilder(MembershipEntity, 'm')
    .select('b.type', 'type')
    .addSelect('m.role', 'role')
    .innerJoin(NameOf(BusinessEntity), 'b', 'b.id = m.business_id')
    .where('m.business_id = :businessId AND m.account_id = :accountId', { businessId, accountId })
    .getRawOne<{ type: string; role: string }>();
};

const CountMembers = (q: Queryable, businessId: string, role?: string): Promise<number> => {
  return memberships(q).countBy({ business_id: businessId, ...(role !== undefined && { role }) });
};

const InsertMembership = async (q: Queryable, input: { businessId: string; accountId: string; role: string; color: string }): Promise<void> => {
  await memberships(q).insert({ business_id: input.businessId, account_id: input.accountId, role: input.role, color: input.color });
};

const ListMembers = (q: Queryable, businessId: string): Promise<MemberRow[]> => {
  return members(q, businessId).orderBy('m.created_at').getRawMany<MemberRow>();
};

const LockMember = (q: Queryable, businessId: string, accountId: string): Promise<MemberRow | undefined> => {
  return members(q, businessId)
    .andWhere('m.account_id = :accountId', { accountId })
    .setLock('pessimistic_write', undefined, ['m'])
    .getRawOne<MemberRow>();
};

const UpdateMemberRole = async (q: Queryable, businessId: string, accountId: string, role: string): Promise<void> => {
  await memberships(q).update({ business_id: businessId, account_id: accountId }, { role });
};

const DeleteMember = async (q: Queryable, businessId: string, accountId: string): Promise<void> => {
  await memberships(q).delete({ business_id: businessId, account_id: accountId });
};

/** Everything a business owns except its team and invites, children before parents. */
const OPERATIONAL = [
  ActivityEntity,
  MovementEntity,
  DeliveryEntity,
  OrderEntity,
  ItemEntity,
  CustomerEntity,
  SupplierEntity,
  CategoryEntity,
  LocationEntity,
];

/** Remove every operational row of a business (keeps the business, its team and invites). */
const DeleteOperationalData = async (q: Queryable, businessId: string): Promise<void> => {
  const ofBusiness = (table: string, key: string) => `${key} IN (SELECT id FROM ${table} WHERE business_id = :businessId)`;
  await q.createQueryBuilder().delete().from(ItemComponentEntity).where(ofBusiness('items', 'parent_id'), { businessId }).execute();
  await q.createQueryBuilder().delete().from(OrderLineEntity).where(ofBusiness('orders', 'order_id'), { businessId }).execute();
  await q.createQueryBuilder().delete().from(DeliveryLineEntity).where(ofBusiness('deliveries', 'delivery_id'), { businessId }).execute();
  for (const entity of OPERATIONAL) await q.getRepository(entity).delete({ business_id: businessId });
};

export const businessesRepository = {
  ListForAccount,
  FindForAccount,
  Find,
  Lock,
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
};
