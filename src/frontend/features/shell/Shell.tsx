import { Outlet, ScrollRestoration, useNavigation } from 'react-router';
import { AppLayout, MotionToggle } from '@/frontend/components/layout';
import { ConfirmHost } from '@/frontend/components/modal';
import { Toaster } from '@/frontend/components/toast';
import { BuildNavigation } from '@/frontend/config/navigation';
import { BusinessSwitcher } from '@/frontend/features/businesses/components/BusinessSwitcher';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole } from '@/frontend/features/businesses/types';
import { dashboardService } from '@/frontend/features/dashboard/services';
import { ItemDrawer } from '@/frontend/features/inventory/components/ItemDrawer';
import { ConnectionStatus } from '@/frontend/features/system/components/ConnectionStatus';
import { useRealtime } from '@/frontend/hooks/use-realtime';
import { AccountMenu } from './components/AccountMenu';
import { BusinessGate } from './components/BusinessGate';
import { SessionGate } from './components/SessionGate';

/** The signed-in app: navigation in the business's vocabulary, plus everything that lives across screens. */
function Frame() {
  const { connected } = useRealtime();
  const navigation = useNavigation();
  const business = businessesService.useBusiness();
  const { data } = dashboardService.useDashboard();
  const badges = {
    inventory: data ? data.kpis.lowStock + data.kpis.outOfStock : undefined,
    orders: data?.kpis.openOrders,
    deliveries: data?.kpis.incomingDeliveries,
  };
  return (
    <>
      <AppLayout
        nav={BuildNavigation(business.template.labels, IsManagementRole(business.role))}
        badges={badges}
        busy={navigation.state === 'loading'}
        brand={<BusinessSwitcher />}
        topbarEnd={
          <>
            <MotionToggle />
            <AccountMenu />
          </>
        }
        sidebarFooter={<ConnectionStatus connected={connected} />}
      >
        <Outlet />
      </AppLayout>
      <ItemDrawer />
      <ConfirmHost />
      <Toaster />
      <ScrollRestoration />
    </>
  );
}

export function Shell() {
  return (
    <SessionGate>
      <BusinessGate>
        <Frame />
      </BusinessGate>
    </SessionGate>
  );
}
