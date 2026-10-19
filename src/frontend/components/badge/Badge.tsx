import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { Cn } from '@/frontend/lib/utils';

export type BadgeTone = 'neutral' | 'good' | 'warning' | 'critical' | 'info' | 'reserved' | 'incoming';

/** Status pill: tone colour always paired with a label (and optionally an icon), never colour alone. */
export function Badge({ tone = 'neutral', icon, children, className }: { tone?: BadgeTone; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <span className={Cn('badge', `badge-${tone}`, className)}>
      {icon ? <Icon name={icon} size={12} /> : <span className="badge-dot" aria-hidden />}
      {children}
    </span>
  );
}
