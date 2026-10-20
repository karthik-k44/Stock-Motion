import type { ReactNode } from 'react';
import { Text } from '@/frontend/components/text';

export const PageHeader = ({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) => {
  return (
    <div className="page-head">
      <div>
        <Text variant="title">{title}</Text>
        {description && (
          <Text tone="secondary" className="mt-1 max-w-[72ch]">
            {description}
          </Text>
        )}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
};
