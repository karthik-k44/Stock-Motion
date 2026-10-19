import { useState } from 'react';
import { Card } from '@/frontend/components/card';
import { SearchInput, Select } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { usersService } from '@/frontend/features/users/services';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { ActivityFeed } from './components/ActivityFeed';
import { KIND_OPTIONS } from './lib/activity-presets';
import { activityService } from './services';
import type { ActivityKindTypeEnum } from './types';

export function Activity() {
  useDocumentTitle('Activity history');
  const [kind, setKind] = useState<ActivityKindTypeEnum | ''>('');
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const { data: users = [] } = usersService.useUsers();
  const query = activityService.useActivity({ kind: kind || undefined, userId: userId || undefined, search: q || undefined, limit: 300 });

  return (
    <div className="page">
      <PageHeader
        title="Activity history"
        description="A chronological log of deliveries, stock adjustments, allocation, picking, packing and shipment."
      />
      <Card flush>
        <div className="filters">
          <SearchInput label="Search activity" placeholder="Search messages, SKUs, orders…" value={search} onChange={setSearch} busy={query.isFetching && !query.isPending} />
          <Select aria-label="Filter by activity type" value={kind} options={KIND_OPTIONS} onChange={(v) => setKind(v as ActivityKindTypeEnum | '')} />
          <Select
            aria-label="Filter by person"
            value={userId}
            options={[{ value: '', label: 'Everyone' }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
            onChange={setUserId}
          />
        </div>
        <div className="card-pad">
          <ActivityFeed query={query} grouped />
        </div>
      </Card>
    </div>
  );
}
