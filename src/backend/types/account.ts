export type AccountResponseType = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthSessionResponseType = {
  account: AccountResponseType;
  accessToken: string;
};
