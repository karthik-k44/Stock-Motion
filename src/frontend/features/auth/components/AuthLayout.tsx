import type { ReactNode } from 'react';
import { Icon } from '@/frontend/components/icon';
import { Toaster } from '@/frontend/components/toast';

/** Centred card for sign-in, sign-up, invites and onboarding. */
export const AuthLayout = ({ title, subtitle, children, wide }: { title: string; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) => {
  return (
    <div className="auth">
      <main className={wide ? 'auth-card auth-card-wide' : 'auth-card'}>
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden>
            <Icon name="package" size={20} />
          </span>
          <span className="brand-name">StockMotion</span>
        </div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </main>
      <Toaster />
    </div>
  );
};
