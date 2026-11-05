import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { CreatedInviteResponseType, InviteResponseType } from '../types';

const invitesKeys = {
  all: ['invites'] as const,
  list: () => [...invitesKeys.all, 'list'] as const,
};

const useGetInvites = (enabled: boolean) =>
  useQuery({
    queryKey: invitesKeys.list(),
    queryFn: (): Promise<InviteResponseType[]> => Biz.Get('/invites'),
    enabled,
  });

const useCreateInvite = () =>
  useOptimisticMutation({
    mutationFn: (role: string): Promise<CreatedInviteResponseType> => Biz.Post('/invites', { role }),
    invalidate: [invitesKeys.all],
    errorTitle: 'Invite not created',
  });

const useRevokeInvite = () =>
  useOptimisticMutation({
    mutationFn: (id: string): Promise<void> => Biz.Delete(`/invites/${id}`),
    optimistic: (id) => [
      { queryKey: invitesKeys.all, update: (old) => (Array.isArray(old) ? old.filter((i: InviteResponseType) => i.id !== id) : old) },
    ],
    invalidate: [invitesKeys.all],
    errorTitle: 'Invite not revoked',
    successToast: () => ({ title: 'Invite link revoked' }),
  });

/** The link a new teammate opens. */
const InviteLink = (token: string) => `${window.location.origin}/invite/${token}`;

export const invitesService = {
  invitesKeys,
  InviteLink,
  useGetInvites,
  useCreateInvite,
  useRevokeInvite,
};
