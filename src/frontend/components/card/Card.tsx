import type { ReactNode } from 'react';
import { Text } from '@/frontend/components/text';
import { Cn } from '@/frontend/lib/utils';

type CardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
};

export const Card = ({ title, subtitle, actions, children, className, flush }: CardProps) => {
  return (
    <section className={Cn('card', flush && 'card-flush', className)}>
      {(title || actions) && (
        <header className="card-head">
          <div>
            {title && <Text variant="subheading" as="h2">{title}</Text>}
            {subtitle && <Text variant="small" tone="muted" className="mt-0.5">{subtitle}</Text>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
};
