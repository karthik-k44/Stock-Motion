import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { Cn } from '@/frontend/lib/utils';

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: IconName;
  hint?: ReactNode;
  tone?: 'neutral' | 'warning' | 'critical';
  onClick?: () => void;
};

export function StatCard({ label, value, icon, hint, tone = 'neutral', onClick }: StatCardProps) {
  const body = (
    <>
      <span className="stat-icon" aria-hidden>
        <Icon name={icon} size={18} />
      </span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </>
  );
  return onClick ? (
    <button type="button" className={Cn('stat', `stat-${tone}`, 'stat-link')} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={Cn('stat', `stat-${tone}`)}>{body}</div>
  );
}
