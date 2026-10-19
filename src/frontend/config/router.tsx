import { createBrowserRouter, Navigate, Outlet, ScrollRestoration, useNavigation } from 'react-router';
import { MotionToggle, AppLayout } from '@/frontend/components/layout';
import { ConfirmHost } from '@/frontend/components/modal';
import { Toaster } from '@/frontend/components/toast';
import { dashboardService } from '@/frontend/features/dashboard/services';
import { ItemDrawer } from '@/frontend/features/inventory/components/ItemDrawer';
import { NotFound, RouteError } from '@/frontend/features/not-found/NotFound';
import { ConnectionStatus } from '@/frontend/features/system/components/ConnectionStatus';
import { ResetDemoButton } from '@/frontend/features/system/components/ResetDemoButton';
import { UserSwitcher } from '@/frontend/features/users/components/UserSwitcher';
import { CrewDirector } from '@/frontend/features/warehouse/components/CrewDirector';
import { TruckSequenceRunner } from '@/frontend/features/warehouse/components/TruckSequenceRunner';
import { useRealtime } from '@/frontend/hooks/use-realtime';
import { NAVIGATION } from './navigation';
import { paths } from './paths';

/** App shell + everything that must live across screens (item drawer, dock sequence, crew, dialogs). */
function Root() {
  const { connected } = useRealtime();
  const navigation = useNavigation();
  const { data } = dashboardService.useDashboard();
  const badges = {
    inventory: data ? data.kpis.lowStock + data.kpis.outOfStock : undefined,
    orders: data?.kpis.openOrders,
    deliveries: data?.kpis.incomingDeliveries,
  };
  return (
    <>
      <AppLayout
        nav={NAVIGATION}
        badges={badges}
        busy={navigation.state === 'loading'}
        topbarEnd={
          <>
            <MotionToggle />
            <UserSwitcher />
            <ResetDemoButton />
          </>
        }
        sidebarFooter={<ConnectionStatus connected={connected} />}
      >
        <Outlet />
      </AppLayout>
      <ItemDrawer />
      <TruckSequenceRunner />
      <CrewDirector />
      <ConfirmHost />
      <Toaster />
      <ScrollRestoration />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to={paths.warehouse} replace /> },
      { path: 'warehouse', lazy: async () => ({ Component: (await import('@/frontend/features/warehouse/Warehouse')).Warehouse }) },
      { path: 'dashboard', lazy: async () => ({ Component: (await import('@/frontend/features/dashboard/Dashboard')).Dashboard }) },
      { path: 'inventory', lazy: async () => ({ Component: (await import('@/frontend/features/inventory/Inventory')).Inventory }) },
      { path: 'orders/:orderId?', lazy: async () => ({ Component: (await import('@/frontend/features/orders/Orders')).Orders }) },
      { path: 'deliveries/:deliveryId?', lazy: async () => ({ Component: (await import('@/frontend/features/deliveries/Deliveries')).Deliveries }) },
      { path: 'locations', lazy: async () => ({ Component: (await import('@/frontend/features/locations/Locations')).Locations }) },
      { path: 'activity', lazy: async () => ({ Component: (await import('@/frontend/features/activity/Activity')).Activity }) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
