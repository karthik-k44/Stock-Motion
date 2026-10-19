import { Link } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { paths } from '@/frontend/config/paths';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { FormatDateTime, RelativeTime } from '@/frontend/utils/format';
import { KIND_ICON } from '../lib/activity-presets';
import type { ActivityResponseType } from '../types';

export function ActivityItem({ entry, compact }: { entry: ActivityResponseType; compact?: boolean }) {
  const drawer = useItemDrawer();
  const ref = entry.refId;
  const link =
    ref && entry.refType === 'ORDER' ? (
      <Link className="link mono" to={paths.order(ref)}>{ref}</Link>
    ) : ref && entry.refType === 'DELIVERY' ? (
      <Link className="link mono" to={paths.delivery(ref)}>{ref}</Link>
    ) : ref && entry.refType === 'ITEM' ? (
      <button type="button" className="link mono" onClick={() => drawer.open(ref)}>{ref}</button>
    ) : ref && entry.refType === 'CUSTOMER' ? (
      <Link className="link" to={paths.customer(ref)}>view</Link>
    ) : null;

  return (
    <li className={`activity activity-${entry.kind.toLowerCase()}`}>
      <span className="activity-icon" aria-hidden>
        <Icon name={KIND_ICON[entry.kind] ?? 'clock'} size={15} />
      </span>
      <div className="activity-text">
        <p>{entry.message}</p>
        <p className="muted small">
          <time dateTime={entry.at} title={FormatDateTime(entry.at)}>
            {compact ? RelativeTime(entry.at) : `${FormatDateTime(entry.at)} · ${RelativeTime(entry.at)}`}
          </time>
          {entry.actorName && <> · {entry.actorName}</>}
          {link && !compact && <> · {link}</>}
        </p>
      </div>
    </li>
  );
}
