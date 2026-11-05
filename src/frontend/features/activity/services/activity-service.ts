import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Biz } from '@/frontend/services/request';
import type { ActivityResponseType, ListActivityParams } from '../types';

const activityKeys = {
  all: ['activity'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filter: ListActivityParams) => [...activityKeys.lists(), filter] as const,
};

const useGetActivity = (filter: ListActivityParams) =>
  useQuery({
    queryKey: activityKeys.list(filter),
    queryFn: (): Promise<ActivityResponseType[]> => Biz.Get('/activity', { params: filter }),
    placeholderData: keepPreviousData,
  });

export const activityService = { activityKeys, useGetActivity };
