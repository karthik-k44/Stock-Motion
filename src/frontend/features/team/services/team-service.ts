import { useQuery } from '@tanstack/react-query';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { MemberResponseType } from '../types';

const ListMembers = () => Biz.Get<MemberResponseType[]>('/members');
const UpdateMemberRole = (accountId: string, role: string) => Biz.Patch<MemberResponseType[]>(`/members/${accountId}`, { role });
const RemoveMember = (accountId: string) => Biz.Delete<MemberResponseType[]>(`/members/${accountId}`);

const teamKeys = {
  /** Starts with the realtime resource name `members`. */
  all: ['members'] as const,
  list: () => ['members', 'list'] as const,
};

const useMembers = () => useQuery({ queryKey: teamKeys.list(), queryFn: ListMembers, staleTime: 60_000 });

const useUpdateRoleMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ accountId, role }: { accountId: string; role: string }) => UpdateMemberRole(accountId, role),
    optimistic: ({ accountId, role }) => [
      { queryKey: teamKeys.all, update: PatchWhere<MemberResponseType>((m) => m.accountId === accountId, (m) => ({ ...m, role })) },
    ],
    invalidate: [teamKeys.all, ['activity'], ['business']],
    errorTitle: 'Role not changed',
  });

const useRemoveMemberMutation = () =>
  useOptimisticMutation({
    mutationFn: RemoveMember,
    optimistic: (accountId: string) => [
      { queryKey: teamKeys.all, update: (old) => (Array.isArray(old) ? old.filter((m: MemberResponseType) => m.accountId !== accountId) : old) },
    ],
    invalidate: [teamKeys.all, ['activity'], ['orders']],
    errorTitle: 'Not removed',
  });

/** Name for an account id, from the member list. */
const MemberName = (members: MemberResponseType[] | undefined, accountId: string | null) =>
  (accountId && members?.find((m) => m.accountId === accountId)?.name) || null;

export const teamService = {
  keys: teamKeys,
  ListMembers,
  UpdateMemberRole,
  RemoveMember,
  MemberName,
  useMembers,
  useUpdateRoleMutation,
  useRemoveMemberMutation,
};
