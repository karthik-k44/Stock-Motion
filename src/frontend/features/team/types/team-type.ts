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

/** Every team type under one name. */
export type TTeamType = {
  Member: MemberResponseType;
  Invite: InviteResponseType;
  CreatedInvite: CreatedInviteResponseType;
};
