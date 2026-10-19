import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { usersService } from '@/frontend/features/users/services';
import { DayLabel } from '@/frontend/utils/format';
import type { activityService } from '../services';
import { ActivityItem } from './ActivityItem';

type Props = {
  query: ReturnType<typeof activityService.useActivity>;
  compact?: boolean;
  /** Group entries under day headings */
  grouped?: boolean;
};

export function ActivityFeed({ query, compact, grouped }: Props) {
  const { data: users } = usersService.useUsers();
  if (query.isPending) return <SkeletonRows rows={compact ? 4 : 8} height={compact ? 36 : 48} label="Loading activity" />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  if (!query.data.length) return <EmptyState icon="clock" title="No activity matches" />;

  const userOf = (id: string) => users?.find((u) => u.id === id);
  if (!grouped) {
    return (
      <ol className="feed">
        {query.data.map((a) => (
          <ActivityItem key={a.id} entry={a} user={userOf(a.userId)} compact={compact} />
        ))}
      </ol>
    );
  }

  const days = new Map<string, typeof query.data>();
  query.data.forEach((a) => {
    const label = DayLabel(a.at);
    days.set(label, [...(days.get(label) ?? []), a]);
  });
  return (
    <div className="feed-days">
      {[...days.entries()].map(([day, entries]) => (
        <section key={day} aria-label={day}>
          <h3 className="feed-day">{day}</h3>
          <ol className="feed">
            {entries.map((a) => (
              <ActivityItem key={a.id} entry={a} user={userOf(a.userId)} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
