import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { Badge as UiBadge } from '@/frontend/components/ui/badge';
import { Cn } from '@/frontend/lib/utils';

export type BadgeTone = 'neutral' | 'good' | 'warning' | 'critical' | 'info' | 'reserved' | 'incoming';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-bg text-neutral',
  good: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  critical: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  reserved: 'bg-reserved-bg text-reserved',
  incoming: 'bg-incoming-bg text-incoming',
};

/** Status pill (shadcn/ui Badge): tone colour always paired with a label (and optionally an icon), never colour alone. */
export const Badge = ({ tone = 'neutral', icon, children, className }: { tone?: BadgeTone; icon?: IconName; children: ReactNode; className?: string }) => (
  <UiBadge className={Cn('gap-1.5 rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold', TONE[tone], className)}>
    {icon ? <Icon name={icon} size={12} /> : <span className="size-1.5 rounded-full bg-current" aria-hidden />}
    {children}
  </UiBadge>
);
