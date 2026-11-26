import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { RefreshAccessToken } from '@/frontend/services/api';
import type { ApiError } from '@/frontend/services/api-error';
import { Get, Post } from '@/frontend/services/request';
import { sessionState } from '@/frontend/services/session-state';
import { realtime } from '@/frontend/services/socket';
import { tokenStore } from '@/frontend/services/token-store';
import type { AccountResponseType, AuthSessionResponseType, InvitePreviewResponseType, LoginInput, RegisterInput } from '../types';

const NO_REFRESH = { skipAuthRefresh: true };

const authKeys = {
  session: () => ['session'] as const,
  invite: (token: string) => ['invite', token] as const,
};

/** Restore the session from the refresh cookie on page load; null when signed out. */
const Restore = async (): Promise<AccountResponseType | null> => {
  try {
    const { account } = await RefreshAccessToken();
    sessionState.SetSignedIn(true);
    return account;
  } catch {
    sessionState.SetSignedIn(false);
    return null;
  }
};

/** Signed in as someone new: drop everything cached for the previous person. */
const StartSession = (qc: QueryClient, session: AuthSessionResponseType) => {
  tokenStore.Advance();
  tokenStore.Set(session.accessToken);
  sessionState.SetSignedIn(true);
  qc.clear();
  qc.setQueryData(authKeys.session(), session.account);
  realtime.Disconnect();
  realtime.Connect();
};

const EndSession = (qc: QueryClient) => {
  tokenStore.Advance();
  tokenStore.Set(null);
  sessionState.SetBusinessId(null);
  sessionState.SetSignedIn(false);
  realtime.Disconnect();
  qc.clear();
  qc.setQueryData(authKeys.session(), null);
};

const useGetSession = () =>
  useQuery({ queryKey: authKeys.session(), queryFn: Restore, staleTime: Infinity, gcTime: Infinity, retry: false });

const useGetInvitePreview = (token: string) =>
  useQuery({
    queryKey: authKeys.invite(token),
    queryFn: (): Promise<InvitePreviewResponseType> => Get(`/invites/${token}`, NO_REFRESH),
    retry: false,
  });

const useSessionMutation = <V>(fn: (vars: V) => Promise<AuthSessionResponseType>, after?: (session: AuthSessionResponseType) => void) => {
  const qc = useQueryClient();
  return useMutation<AuthSessionResponseType, ApiError, V>({
    mutationFn: fn,
    onSuccess: (session) => {
      StartSession(qc, session);
      after?.(session);
    },
  });
};

const useLogin = () =>
  useSessionMutation((input: LoginInput): Promise<AuthSessionResponseType> => Post('/auth/login', input, NO_REFRESH));

const useRegister = () =>
  useSessionMutation((input: RegisterInput): Promise<AuthSessionResponseType> => Post('/auth/register', input, NO_REFRESH));

const useRegisterFromInvite = () =>
  useSessionMutation(({ token, input }: { token: string; input: RegisterInput }): Promise<AuthSessionResponseType> =>
    Post(`/invites/${token}/register`, input, NO_REFRESH),
  );

const useAcceptInvite = () =>
  useMutation<{ id: string }, ApiError, string>({ mutationFn: (token) => Post(`/invites/${token}/accept`) });

const useLogout = () => {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () => Post('/auth/logout', undefined, NO_REFRESH),
    // Even if the server is unreachable, this browser forgets the session.
    onSettled: () => EndSession(qc),
  });
};

export const authService = {
  authKeys,
  Restore,
  StartSession,
  EndSession,
  useGetSession,
  useGetInvitePreview,
  useLogin,
  useRegister,
  useRegisterFromInvite,
  useAcceptInvite,
  useLogout,
};
