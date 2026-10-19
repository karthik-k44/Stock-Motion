import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { CreatedInviteResponseType, InviteResponseType } from '../types';

const ListInvites = () => Biz.Get<InviteResponseType[]>('/invites');
const CreateInvite = (role: string) => Biz.Post<CreatedInviteResponseType>('/invites', { role });
const RevokeInvite = (id: string) => Biz.Delete<void>(`/invites/${id}`);

const invitesKeys = {
  all: ['invites'] as const,
  list: () => ['invites', 'list'] as const,
};

const useInvites = (enabled: boolean) => useQuery({ queryKey: invitesKeys.list(), queryFn: ListInvites, enabled });

const useCreateInviteMutation = () =>
  useOptimisticMutation({ mutationFn: CreateInvite, invalidate: [invitesKeys.all], errorTitle: 'Invite not created' });

const useRevokeInviteMutation = () =>
  useOptimisticMutation({
    mutationFn: RevokeInvite,
    optimistic: (id: string) => [
      { queryKey: invitesKeys.all, update: (old) => (Array.isArray(old) ? old.filter((i: InviteResponseType) => i.id !== id) : old) },
    ],
    invalidate: [invitesKeys.all],
    errorTitle: 'Invite not revoked',
    successToast: () => ({ title: 'Invite link revoked' }),
  });

/** The link a new teammate opens. */
const InviteLink = (token: string) => `${window.location.origin}/invite/${token}`;

export const invitesService = {
  keys: invitesKeys,
  ListInvites,
  CreateInvite,
  RevokeInvite,
  InviteLink,
  useInvites,
  useCreateInviteMutation,
  useRevokeInviteMutation,
};
