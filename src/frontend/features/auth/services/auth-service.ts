import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { RefreshAccessToken } from '@/frontend/services/api';
import type { ApiError } from '@/frontend/services/api-error';
import { Get, Post } from '@/frontend/services/request';
import { sessionState } from '@/frontend/services/session-state';
import { realtime } from '@/frontend/services/socket';
import { tokenStore } from '@/frontend/services/token-store';
import type {
  AccountResponseType,
  AuthSessionResponseType,
  InvitePreviewResponseType,
  LoginInput,
  RegisterInput,
} from '../types';

const NO_REFRESH = { skipAuthRefresh: true };

const Register = (input: RegisterInput) => Post<AuthSessionResponseType>('/auth/register', input, NO_REFRESH);
const Login = (input: LoginInput) => Post<AuthSessionResponseType>('/auth/login', input, NO_REFRESH);
const Logout = () => Post<void>('/auth/logout', undefined, NO_REFRESH);
const PreviewInvite = (token: string) => Get<InvitePreviewResponseType>(`/invites/${token}`, NO_REFRESH);
const AcceptInvite = (token: string) => Post<{ id: string }>(`/invites/${token}/accept`);
const RegisterFromInvite = (token: string, input: RegisterInput) =>
  Post<AuthSessionResponseType>(`/invites/${token}/register`, input, NO_REFRESH);

/** Restore the session from the refresh cookie on page load; null when signed out. */
async function Restore(): Promise<AccountResponseType | null> {
  try {
    return (await RefreshAccessToken()).account;
  } catch {
    return null;
  }
}

const authKeys = {
  session: ['session'] as const,
  invite: (token: string) => ['invite', token] as const,
};

/** Signed in as someone new: drop everything cached for the previous person. */
function StartSession(qc: QueryClient, session: AuthSessionResponseType) {
  tokenStore.Advance();
  tokenStore.Set(session.accessToken);
  qc.clear();
  qc.setQueryData(authKeys.session, session.account);
  realtime.Disconnect();
  realtime.Connect();
}

function EndSession(qc: QueryClient) {
  tokenStore.Advance();
  tokenStore.Set(null);
  sessionState.SetBusinessId(null);
  realtime.Disconnect();
  qc.clear();
  qc.setQueryData(authKeys.session, null);
}

const useSession = () =>
  useQuery({ queryKey: authKeys.session, queryFn: Restore, staleTime: Infinity, gcTime: Infinity, retry: false });

const useInvitePreview = (token: string) =>
  useQuery({ queryKey: authKeys.invite(token), queryFn: () => PreviewInvite(token), retry: false });

function useSessionMutation<V>(fn: (vars: V) => Promise<AuthSessionResponseType>, after?: (session: AuthSessionResponseType) => void) {
  const qc = useQueryClient();
  return useMutation<AuthSessionResponseType, ApiError, V>({
    mutationFn: fn,
    onSuccess: (session) => {
      StartSession(qc, session);
      after?.(session);
    },
  });
}

const useLoginMutation = () => useSessionMutation((input: LoginInput) => Login(input));
const useRegisterMutation = () => useSessionMutation((input: RegisterInput) => Register(input));
const useRegisterFromInviteMutation = () =>
  useSessionMutation(({ token, input }: { token: string; input: RegisterInput }) => RegisterFromInvite(token, input));

const useAcceptInviteMutation = () => useMutation<{ id: string }, ApiError, string>({ mutationFn: AcceptInvite });

const useLogoutMutation = () => {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: Logout,
    // Even if the server is unreachable, this browser forgets the session.
    onSettled: () => EndSession(qc),
  });
};

export const authService = {
  keys: authKeys,
  Register,
  Login,
  Logout,
  Restore,
  PreviewInvite,
  AcceptInvite,
  RegisterFromInvite,
  StartSession,
  EndSession,
  useSession,
  useInvitePreview,
  useLoginMutation,
  useRegisterMutation,
  useRegisterFromInviteMutation,
  useAcceptInviteMutation,
  useLogoutMutation,
};
