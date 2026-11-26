import { Navigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { PageHeader } from '@/frontend/components/layout';
import { ConfirmManager } from '@/frontend/components/modal';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { BaseRoleTypeEnum, IsManagementRole } from '@/frontend/features/businesses/types';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { BusinessDetailsCard } from './components/BusinessDetailsCard';
import { CategoriesCard } from './components/CategoriesCard';
import { InventoriesCard } from './components/InventoriesCard';
import { LocationsCard } from './components/LocationsCard';

export const Settings = () => {
  useDocumentTitle('Settings');
  const business = businessesService.useBusiness();
  const reset = businessesService.useResetData();
  if (!IsManagementRole(business.role)) return <Navigate to={paths.dashboard} replace />;

  const ask = async () => {
    const ok = await ConfirmManager.Ask({
      title: 'Clear all data?',
      message: `Every item, ${business.template.labels.order.toLowerCase()}, delivery, customer and supplier in ${business.name} is deleted. The team and settings stay. This can't be undone.`,
      confirmLabel: 'Clear everything',
      tone: 'danger',
    });
    if (ok) reset.mutate();
  };

  return (
    <div className="page">
      <PageHeader title="Settings" description={`How ${business.name} is set up.`} />
      <div className="grid-2">
        <BusinessDetailsCard />
        <InventoriesCard />
        <CategoriesCard />
        <LocationsCard />
        {business.role === BaseRoleTypeEnum.OWNER && (
          <Card title="Start over" subtitle="Owners only.">
            <div className="form-actions">
              <Button variant="danger" icon="trash" loading={reset.isPending} onClick={() => void ask()}>Clear all data</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
