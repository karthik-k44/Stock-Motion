import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { Text } from '@/frontend/components/text';

export const EmptyState = ({ icon = 'box', title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) => {
  return (
    <div className="empty" role="status">
      <span className="empty-icon" aria-hidden>
        <Icon name={icon} size={22} />
      </span>
      <Text variant="subheading">{title}</Text>
      {children && (
        <Text variant="small" tone="muted" className="max-w-[46ch]">
          {children}
        </Text>
      )}
      {action}
    </div>
  );
};
