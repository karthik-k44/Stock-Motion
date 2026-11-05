import type { ComponentProps, ReactNode } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { Button as UiButton } from '@/frontend/components/ui/button';
import { Cn } from '@/frontend/lib/utils';

type ButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
  size?: 'sm' | 'md';
  icon?: IconName;
  loading?: boolean;
  children?: ReactNode;
};

const VARIANT = { primary: 'default', secondary: 'outline', ghost: 'ghost', danger: 'destructive', 'danger-ghost': 'destructive-ghost' } as const;

/** The app's button: shadcn/ui's Button with our icon set and a loading state. */
export const Button = ({ variant = 'secondary', size = 'md', icon, loading, disabled, className, children, type = 'button', ...rest }: ButtonProps) => {
  const iconOnly = !children;
  const uiSize = iconOnly ? (size === 'sm' ? 'icon-sm' : 'icon') : size === 'sm' ? 'sm' : 'default';
  return (
    <UiButton
      type={type}
      variant={VARIANT[variant]}
      size={uiSize}
      className={Cn('font-semibold', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden /> : icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} /> : null}
      {children}
    </UiButton>
  );
};
