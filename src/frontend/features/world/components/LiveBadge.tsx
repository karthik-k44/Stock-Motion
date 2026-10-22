import { useEffect, useState } from 'react';
import { Cn } from '@/frontend/lib/utils';
import { RelativeTime } from '@/frontend/utils/format';

const STALE_MS = 30 * 60_000;

/** LIVE dot with "updated X ago"; turns grey when the numbers are older than 30 minutes or the link is down. */
export const LiveBadge = ({ updatedAt, connected }: { updatedAt: number; connected: boolean }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);
  const stale = !updatedAt || now - updatedAt > STALE_MS;
  const live = connected && !stale;
  return (
    <p className={Cn('live', live ? 'live-on' : 'live-off')} role="status" aria-live="polite">
      <span className="live-dot" aria-hidden />
      <strong>{live ? 'LIVE' : stale ? 'STALE' : 'OFFLINE'}</strong>
      <span>updated {updatedAt ? RelativeTime(new Date(updatedAt).toISOString(), now) : 'never'}</span>
    </p>
  );
};
