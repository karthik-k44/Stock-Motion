import type { BusinessTypeEnum, TemplateResponseType } from './template';

/** Every business has an owner and managers; staff roles come from the template. */
export const BaseRoleTypeEnum = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
} as const;
export type BaseRoleTypeEnum = (typeof BaseRoleTypeEnum)[keyof typeof BaseRoleTypeEnum];

export const MANAGEMENT_ROLES: string[] = [BaseRoleTypeEnum.OWNER, BaseRoleTypeEnum.MANAGER];
export const IsManagementRole = (role: string): boolean => MANAGEMENT_ROLES.includes(role);

export type BusinessResponseType = {
  id: string;
  name: string;
  type: BusinessTypeEnum;
  currency: string;
  /** The caller's role in this business */
  role: string;
  createdAt: string;
};

export type BusinessDetailResponseType = BusinessResponseType & {
  template: TemplateResponseType;
};

export type MemberResponseType = {
  accountId: string;
  name: string;
  email: string;
  role: string;
  color: string;
  initials: string;
  joinedAt: string;
};

export type InviteResponseType = {
  id: string;
  role: string;
  expiresAt: string;
  createdAt: string;
};

export type CreatedInviteResponseType = InviteResponseType & {
  /** Raw token, only returned once when the invite is created. */
  token: string;
};

export type InvitePreviewResponseType = {
  businessName: string;
  businessType: BusinessTypeEnum;
  role: string;
  roleLabel: string;
  expiresAt: string;
};

/** Who is acting, in which business. Resolved once per request by RequireBusinessRole. */
export type ScopeType = {
  businessId: string;
  template: TemplateResponseType;
  actor: { id: string; name: string; role: string };
};
