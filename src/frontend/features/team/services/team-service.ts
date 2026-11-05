import { useQuery } from '@tanstack/react-query';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { MemberResponseType } from '../types';

const teamKeys = {
  /** Starts with the realtime resource name `members`. */
  all: ['members'] as const,
  list: () => [...teamKeys.all, 'list'] as const,
};

const useGetMembers = () =>
  useQuery({
    queryKey: teamKeys.list(),
    queryFn: (): Promise<MemberResponseType[]> => Biz.Get('/members'),
    staleTime: 60_000,
  });

const useUpdateMemberRole = () =>
  useOptimisticMutation({
    mutationFn: ({ accountId, role }: { accountId: string; role: string }): Promise<MemberResponseType[]> =>
      Biz.Patch(`/members/${accountId}`, { role }),
    optimistic: ({ accountId, role }) => [
      { queryKey: teamKeys.all, update: PatchWhere<MemberResponseType>((m) => m.accountId === accountId, (m) => ({ ...m, role })) },
    ],
    invalidate: [teamKeys.all, ['activity'], ['business']],
    errorTitle: 'Role not changed',
  });

const useRemoveMember = () =>
  useOptimisticMutation({
    mutationFn: (accountId: string): Promise<MemberResponseType[]> => Biz.Delete(`/members/${accountId}`),
    optimistic: (accountId) => [
      { queryKey: teamKeys.all, update: (old) => (Array.isArray(old) ? old.filter((m: MemberResponseType) => m.accountId !== accountId) : old) },
    ],
    invalidate: [teamKeys.all, ['activity'], ['orders']],
    errorTitle: 'Not removed',
  });

/** Name for an account id, from the member list. */
const MemberName = (members: MemberResponseType[] | undefined, accountId: string | null) =>
  (accountId && members?.find((m) => m.accountId === accountId)?.name) || null;

export const teamService = {
  teamKeys,
  MemberName,
  useGetMembers,
  useUpdateMemberRole,
  useRemoveMember,
};
