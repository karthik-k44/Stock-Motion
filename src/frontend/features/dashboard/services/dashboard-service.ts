import { useQuery } from '@tanstack/react-query';
import { Biz } from '@/frontend/services/request';
import type { DashboardResponseType } from '../types';

const dashboardKeys = {
  all: ['dashboard'] as const,
  detail: () => [...dashboardKeys.all, 'detail'] as const,
};

/** Realtime events refresh it as work happens; the 60 s poll is a fallback if the socket drops. */
const useGetDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.detail(),
    queryFn: (): Promise<DashboardResponseType> => Biz.Get('/dashboard'),
    refetchInterval: 60_000,
  });

export const dashboardService = { dashboardKeys, useGetDashboard };
