import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { Cn } from '@/frontend/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: IconName;
  loading?: boolean;
  children?: ReactNode;
};

export const Button = ({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={Cn('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', !children && 'btn-icon', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden /> : icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} /> : null}
      {children}
    </button>
  );
};
