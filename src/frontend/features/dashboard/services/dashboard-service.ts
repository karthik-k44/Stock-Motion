import { useQuery } from '@tanstack/react-query';
import { Biz } from '@/frontend/services/request';
import type { DashboardResponseType } from '../types';

const GetDashboard = () => Biz.Get<DashboardResponseType>('/dashboard');

const dashboardKeys = {
  all: ['dashboard'] as const,
  detail: () => ['dashboard', 'detail'] as const,
};

/** Realtime events refresh it as work happens; the 60 s poll is a fallback if the socket drops. */
const useDashboard = () => useQuery({ queryKey: dashboardKeys.detail(), queryFn: GetDashboard, refetchInterval: 60_000 });

export const dashboardService = { keys: dashboardKeys, GetDashboard, useDashboard };
