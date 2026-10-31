import { BadRequest, Conflict, Forbidden, NotFound } from '@/backend/common/errors';
import { RecordActivity } from '@/backend/common/services/audit';
import { ToIso } from '@/backend/common/utils/dates';
import { db, type Queryable } from '@/backend/db/client';
import { ordersRepository } from '@/backend/modules/orders/orders.repository';
import { templatesService } from '@/backend/modules/templates/templates.service';
import { BroadcastChange, RevokeRealtimeAccess } from '@/backend/realtime/socket';
import type { AccountResponseType } from '@/backend/types/account';
import { ActivityKindTypeEnum } from '@/backend/types/activity';
import {
  BaseRoleTypeEnum,
  type BusinessDetailResponseType,
  type BusinessResponseType,
  type MemberResponseType,
  type ScopeType,
} from '@/backend/types/business';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import type { BusinessTypeEnum } from '@/backend/types/template';
import { SetupBusiness } from './business-setup.service';
import { businessesRepository, type BusinessWithRoleRow } from './businesses.repository';
import type { CreateBusinessInput, ResetDataInput, UpdateBusinessInput, UpdateMemberInput } from './businesses.validators';

/** Avatar / character colours handed out to members in join order. */
const MEMBER_COLORS = ['#2b4c7e', '#e86b2c', '#2f9e6d', '#d9b21c', '#3a7bd5', '#b5487a', '#6b5bd2', '#1f8a8a'];

const toBusiness = (r: BusinessWithRoleRow): BusinessResponseType => ({
  id: r.id,
  name: r.name,
  type: r.type as BusinessTypeEnum,
  currency: r.currency,
  role: r.role,
  createdAt: ToIso(r.created_at),
});

const Initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';

const ListMine = async (accountId: string): Promise<BusinessResponseType[]> => {
  return (await businessesRepository.ListForAccount(db, accountId)).map(toBusiness);
};

/** The caller's membership, or null when they don't belong to the business. */
const FindMembership = async (businessId: string, accountId: string, q: Queryable = db) => {
  return (await businessesRepository.FindMembership(q, businessId, accountId)) ?? null;
};

const detail = async (q: Queryable, businessId: string, accountId: string): Promise<BusinessDetailResponseType> => {
  const row = await businessesRepository.FindForAccount(q, businessId, accountId);
  if (!row) throw NotFound('Business', businessId);
  return { ...toBusiness(row), template: templatesService.Get(row.type) };
};

const AddMember = async (q: Queryable, businessId: string, accountId: string, role: string): Promise<void> => {
  const count = await businessesRepository.CountMembers(q, businessId);
  await businessesRepository.InsertMembership(q, { businessId, accountId, role, color: MEMBER_COLORS[count % MEMBER_COLORS.length] });
};

const Create = (account: AccountResponseType, input: CreateBusinessInput): Promise<BusinessDetailResponseType> => {
  return db.transaction(async (tx) => {
    const business = await businessesRepository.Insert(tx, {
      name: input.name, type: input.type, currency: input.currency, createdBy: account.id,
    });
    await AddMember(tx, business.id, account.id, BaseRoleTypeEnum.OWNER);
    await SetupBusiness(tx, business, account.id, input.sampleData);
    return detail(tx, business.id, account.id);
  });
};

const Get = (scope: ScopeType) => detail(db, scope.businessId, scope.actor.id);

const Update = async (scope: ScopeType, input: UpdateBusinessInput): Promise<BusinessDetailResponseType> => {
  await businessesRepository.Update(db, scope.businessId, input);
  BroadcastChange(scope.businessId, [ResourceTypeEnum.BUSINESS, ResourceTypeEnum.DASHBOARD]);
  return Get(scope);
};

/** Owner only: clear every product, order, delivery … and optionally reload the sample data. */
const Reset = async (scope: ScopeType, input: ResetDataInput): Promise<{ ok: true }> => {
  await db.transaction(async (tx) => {
    const business = await businessesRepository.Lock(tx, scope.businessId);
    if (!business) throw NotFound('Business', scope.businessId);
    await businessesRepository.DeleteOperationalData(tx, scope.businessId);
    await SetupBusiness(tx, business, scope.actor.id, input.sampleData);
  });
  BroadcastChange(scope.businessId, Object.values(ResourceTypeEnum));
  return { ok: true };
};

const ListMembers = async (scope: ScopeType): Promise<MemberResponseType[]> => {
  const rows = await businessesRepository.ListMembers(db, scope.businessId);
  return rows.map((r) => ({
    accountId: r.account_id,
    name: r.name,
    email: r.email,
    role: r.role,
    color: r.color,
    initials: Initials(r.name),
    joinedAt: ToIso(r.created_at),
  }));
};

const lockMember = async (tx: Queryable, scope: ScopeType, accountId: string) => {
  const member = await businessesRepository.LockMember(tx, scope.businessId, accountId);
  if (!member) throw NotFound('Team member', accountId);
  const owners = await businessesRepository.CountMembers(tx, scope.businessId, BaseRoleTypeEnum.OWNER);
  return { member, owners };
};

const UpdateMember = async (scope: ScopeType, accountId: string, input: UpdateMemberInput): Promise<MemberResponseType[]> => {
  if (!scope.template.roles.some((r) => r.code === input.role)) {
    throw BadRequest(`${input.role} is not a role in a ${scope.template.name.toLowerCase()}`);
  }
  const activity = await db.transaction(async (tx) => {
    const { member, owners } = await lockMember(tx, scope, accountId);
    if (member.role === BaseRoleTypeEnum.OWNER && input.role !== BaseRoleTypeEnum.OWNER && owners === 1) {
      throw Conflict('A business needs at least one owner — make someone else an owner first');
    }
    await businessesRepository.UpdateMemberRole(tx, scope.businessId, accountId, input.role);
    return RecordActivity(tx, scope, {
      kind: ActivityKindTypeEnum.TEAM,
      message: `${member.name} is now ${templatesService.RoleLabel(scope.template, input.role)}`,
    });
  });
  BroadcastChange(scope.businessId, [ResourceTypeEnum.MEMBERS, ResourceTypeEnum.ACTIVITY], [activity]);
  return ListMembers(scope);
};

/** Owners can remove anyone; everyone else can only remove themselves (leave). */
const RemoveMember = async (scope: ScopeType, accountId: string): Promise<MemberResponseType[]> => {
  const leaving = accountId === scope.actor.id;
  if (!leaving && scope.actor.role !== BaseRoleTypeEnum.OWNER) throw Forbidden('Only an owner can remove team members');
  const activity = await db.transaction(async (tx) => {
    const { member, owners } = await lockMember(tx, scope, accountId);
    if (member.role === BaseRoleTypeEnum.OWNER && owners === 1) {
      throw Conflict('The last owner cannot leave — make someone else an owner first');
    }
    await businessesRepository.DeleteMember(tx, scope.businessId, accountId);
    await ordersRepository.ClearAssignee(tx, scope.businessId, accountId);
    return RecordActivity(tx, scope, {
      kind: ActivityKindTypeEnum.TEAM,
      message: leaving ? `${member.name} left the team` : `Removed ${member.name} from the team`,
    });
  });
  RevokeRealtimeAccess(scope.businessId, accountId);
  BroadcastChange(scope.businessId, [ResourceTypeEnum.MEMBERS, ResourceTypeEnum.ACTIVITY, ResourceTypeEnum.ORDERS], [activity]);
  return leaving ? [] : ListMembers(scope);
};

export const businessesService = {
  ListMine,
  FindMembership,
  AddMember,
  Create,
  Get,
  Update,
  Reset,
  ListMembers,
  UpdateMember,
  RemoveMember,
  Initials,
};
