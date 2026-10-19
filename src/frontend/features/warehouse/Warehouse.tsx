import { useSearchParams } from 'react-router';
import { Card } from '@/frontend/components/card';
import { ActivityFeed } from '@/frontend/features/activity/components/ActivityFeed';
import { activityService } from '@/frontend/features/activity/services';
import { usersService } from '@/frontend/features/users/services';
import { useActingUser } from '@/frontend/hooks/use-acting-user';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { AttentionList } from './components/AttentionList';
import { CrewRoster } from './components/CrewRoster';
import { WarehouseScene } from './components/WarehouseScene';

export function Warehouse() {
  useDocumentTitle('Warehouse floor');
  const [params] = useSearchParams();
  const { id: actingUserId } = useActingUser();
  const { data: users = [] } = usersService.useUsers();
  const activity = activityService.useActivity({ limit: 6 });

  return (
    <div className="page page-warehouse">
      <div className="warehouse-intro">
        <h1 className="page-title">Warehouse floor</h1>
        <p className="page-desc">
          Scroll through the building, hover a carton for stock details, click it for history and actions. People on the floor move
          as work happens.
        </p>
      </div>
      <WarehouseScene focusSku={params.get('focus')} focusZone={params.get('zone')} />
      <div className="grid-3 below-scene">
        <CrewRoster users={users} actingUserId={actingUserId} />
        <AttentionList />
        <Card title="Recent activity">
          <ActivityFeed query={activity} compact />
        </Card>
      </div>
    </div>
  );
}
