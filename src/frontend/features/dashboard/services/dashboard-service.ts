import { useQuery } from '@tanstack/react-query';
import { Get } from '@/frontend/services/request';
import type { DashboardResponseType } from '../types';

const GetDashboard = (): Promise<DashboardResponseType> => Get<DashboardResponseType>('/dashboard');

const dashboardKeys = {
  all: ['dashboard'] as const,
  detail: () => ['dashboard', 'detail'] as const,
};

const useDashboard = () => useQuery({ queryKey: dashboardKeys.detail(), queryFn: GetDashboard });

export const dashboardService = { keys: dashboardKeys, GetDashboard, useDashboard };
