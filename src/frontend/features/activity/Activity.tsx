import { useState } from 'react';
import { Card } from '@/frontend/components/card';
import { SearchInput, Select } from '@/frontend/components/form';
import { PageHeader } from '@/frontend/components/layout';
import { teamService } from '@/frontend/features/team/services';
import { useDebouncedValue } from '@/frontend/hooks/use-debounced-value';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { ActivityFeed } from './components/ActivityFeed';
import { KIND_OPTIONS } from './lib/activity-presets';
import { activityService } from './services';
import type { ActivityKindTypeEnum } from './types';

export function Activity() {
  useDocumentTitle('Activity history');
  const [kind, setKind] = useState<ActivityKindTypeEnum | ''>('');
  const [accountId, setAccountId] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const { data: members = [] } = teamService.useMembers();
  const query = activityService.useActivity({ kind: kind || undefined, accountId: accountId || undefined, search: q || undefined, limit: 300 });

  return (
    <div className="page">
      <PageHeader title="Activity history" description="Everything that happened in this business, who did it and when — deliveries, counts, reservations, stock used and team changes." />
      <Card flush>
        <div className="filters">
          <SearchInput label="Search activity" placeholder="Search messages, SKUs, numbers…" value={search} onChange={setSearch} busy={query.isFetching && !query.isPending} />
          <Select aria-label="Filter by type" value={kind} options={KIND_OPTIONS} onChange={(v) => setKind(v as ActivityKindTypeEnum | '')} />
          <Select aria-label="Filter by person" value={accountId} options={[{ value: '', label: 'Everyone' }, ...members.map((m) => ({ value: m.accountId, label: m.name }))]} onChange={setAccountId} />
        </div>
        <div className="card-pad">
          <ActivityFeed query={query} grouped />
        </div>
      </Card>
    </div>
  );
}
