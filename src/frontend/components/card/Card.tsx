import type { ReactNode } from 'react';
import { Card as UiCard, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Cn } from '@/frontend/lib/utils';

type CardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Content runs edge to edge (tables) */
  flush?: boolean;
};

/** The app's card: shadcn/ui's Card with an optional header (title, subtitle, actions). */
export const Card = ({ title, subtitle, actions, children, className, flush }: CardProps) => (
  <UiCard className={Cn('min-w-0 gap-4 rounded-2xl border-transparent bg-surface py-5 shadow-card', flush && 'overflow-hidden', className)}>
    {(title || actions) && (
      <CardHeader className="px-5">
        {title && <CardTitle className="text-[15px] leading-snug font-semibold text-ink">{title}</CardTitle>}
        {subtitle && <CardDescription className="text-[13px] text-muted-foreground">{subtitle}</CardDescription>}
        {actions && <CardAction className="flex items-center gap-2">{actions}</CardAction>}
      </CardHeader>
    )}
    <CardContent className={Cn('min-w-0', flush ? 'px-0' : 'px-5')}>{children}</CardContent>
  </UiCard>
);
