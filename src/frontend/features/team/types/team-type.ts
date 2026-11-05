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

export type CreatedInviteResponseType = InviteResponseType & { token: string };
