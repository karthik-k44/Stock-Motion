import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';

export function EmptyState({ icon = 'box', title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty" role="status">
      <span className="empty-icon" aria-hidden>
        <Icon name={icon} size={22} />
      </span>
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
      {action}
    </div>
  );
}
