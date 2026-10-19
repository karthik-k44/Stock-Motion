import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Biz } from '@/frontend/services/request';
import type { ActivityResponseType, ListActivityParams } from '../types';

const ListActivity = (params: ListActivityParams) => Biz.Get<ActivityResponseType[]>('/activity', { params });

const activityKeys = {
  all: ['activity'] as const,
  listPrefix: ['activity', 'list'] as const,
  list: (params: ListActivityParams) => ['activity', 'list', params] as const,
};

const useActivity = (params: ListActivityParams) =>
  useQuery({ queryKey: activityKeys.list(params), queryFn: () => ListActivity(params), placeholderData: keepPreviousData });

export const activityService = { keys: activityKeys, ListActivity, useActivity };
