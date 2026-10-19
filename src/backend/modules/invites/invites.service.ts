import { BadRequest, Conflict, Forbidden, NotFound } from '@/backend/common/errors';
import { RecordActivity } from '@/backend/common/services/audit';
import { GenerateOpaqueToken, HashOpaqueToken } from '@/backend/common/utils/crypto';
import { ToIso } from '@/backend/common/utils/dates';
import { db, type Queryable } from '@/backend/db/client';
import type { BusinessRow, InviteRow } from '@/backend/db/schema';
import { authService, type IssuedSessionType } from '@/backend/modules/auth/auth.service';
import type { RegisterInput } from '@/backend/modules/auth/auth.validators';
import { businessesRepository } from '@/backend/modules/businesses/businesses.repository';
import { businessesService } from '@/backend/modules/businesses/businesses.service';
import { templatesService } from '@/backend/modules/templates/templates.service';
import { BroadcastChange } from '@/backend/realtime/socket';
import type { AccountResponseType } from '@/backend/types/account';
import { ActivityKindTypeEnum } from '@/backend/types/activity';
import {
  BaseRoleTypeEnum,
  type BusinessResponseType,
  type CreatedInviteResponseType,
  type InvitePreviewResponseType,
  type InviteResponseType,
  type ScopeType,
} from '@/backend/types/business';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import type { BusinessTypeEnum } from '@/backend/types/template';
import { invitesRepository } from './invites.repository';
import type { CreateInviteInput } from './invites.validators';

const JOIN_RESOURCES = [ResourceTypeEnum.MEMBERS, ResourceTypeEnum.ACTIVITY, ResourceTypeEnum.DASHBOARD];

const toInvite = (r: InviteRow): InviteResponseType => ({
  id: r.id, role: r.role, expiresAt: ToIso(r.expires_at), createdAt: ToIso(r.created_at),
});

async function Create(scope: ScopeType, input: CreateInviteInput): Promise<CreatedInviteResponseType> {
  if (!scope.template.roles.some((r) => r.code === input.role)) throw BadRequest(`${input.role} is not a role here`);
  if (input.role === BaseRoleTypeEnum.OWNER && scope.actor.role !== BaseRoleTypeEnum.OWNER) {
    throw Forbidden('Only an owner can invite another owner');
  }
  const token = GenerateOpaqueToken();
  const row = await invitesRepository.Insert(db, {
    tokenHash: HashOpaqueToken(token), businessId: scope.businessId, role: input.role, createdBy: scope.actor.id, days: input.days,
  });
  return { ...toInvite(row), token };
}

async function List(scope: ScopeType): Promise<InviteResponseType[]> {
  return (await invitesRepository.ListPending(db, scope.businessId)).map(toInvite);
}

async function Revoke(scope: ScopeType, inviteId: string): Promise<void> {
  if (!(await invitesRepository.Revoke(db, scope.businessId, inviteId))) throw NotFound('Invite', inviteId);
}

/** A still-usable invite and its business, or a clear reason why the link no longer works. */
async function usable(q: Queryable, token: string, lock = false): Promise<{ invite: InviteRow; business: BusinessRow }> {
  const invite = await invitesRepository.FindByTokenHash(q, HashOpaqueToken(token), lock);
  if (!invite || invite.revoked_at) throw NotFound('Invite', 'link');
  if (invite.accepted_at) throw Conflict('This invite link has already been used');
  if (new Date(invite.expires_at) <= new Date()) throw Conflict('This invite link has expired — ask for a new one');
  const business = await businessesRepository.Find(q, invite.business_id);
  if (!business) throw NotFound('Invite', 'link');
  return { invite, business };
}

async function Preview(token: string): Promise<InvitePreviewResponseType> {
  const { invite, business } = await usable(db, token);
  const template = templatesService.Get(business.type);
  return {
    businessName: business.name,
    businessType: business.type as BusinessTypeEnum,
    role: invite.role,
    roleLabel: templatesService.RoleLabel(template, invite.role),
    expiresAt: ToIso(invite.expires_at),
  };
}

async function join(tx: Queryable, token: string, account: AccountResponseType) {
  const { invite, business } = await usable(tx, token, true);
  if (await businessesService.FindMembership(business.id, account.id, tx)) {
    throw Conflict(`You are already on the ${business.name} team`);
  }
  await businessesService.AddMember(tx, business.id, account.id, invite.role);
  await invitesRepository.MarkAccepted(tx, invite.id, account.id);
  const template = templatesService.Get(business.type);
  const scope: ScopeType = { businessId: business.id, template, actor: { id: account.id, name: account.name, role: invite.role } };
  const activity = await RecordActivity(tx, scope, {
    kind: ActivityKindTypeEnum.TEAM,
    message: `${account.name} joined as ${templatesService.RoleLabel(template, invite.role)}`,
  });
  return { businessId: business.id, activity };
}

/** An existing account joins the business. */
async function Accept(account: AccountResponseType, token: string): Promise<BusinessResponseType> {
  const { businessId, activity } = await db.transaction((tx) => join(tx, token, account));
  BroadcastChange(businessId, JOIN_RESOURCES, [activity]);
  const mine = await businessesService.ListMine(account.id);
  return mine.find((b) => b.id === businessId)!;
}

/** A new person signs up straight from the invite link. */
async function Register(token: string, input: RegisterInput): Promise<IssuedSessionType & { businessId: string }> {
  const result = await db.transaction(async (tx) => {
    await usable(tx, token, true);
    const account = await authService.CreateAccount(tx, input);
    const joined = await join(tx, token, account);
    return { ...joined, session: await authService.Issue(tx, account) };
  });
  BroadcastChange(result.businessId, JOIN_RESOURCES, [result.activity]);
  return { ...result.session, businessId: result.businessId };
}

export const invitesService = { Create, List, Revoke, Preview, Accept, Register };
