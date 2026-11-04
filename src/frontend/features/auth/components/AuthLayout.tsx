import type { ReactNode } from 'react';
import { Logo } from '@/frontend/components/logo';
import { Toaster } from '@/frontend/components/toast';

/** Centred card for onboarding. Sign-in, sign-up and invites use AuthSplitLayout. */
export const AuthLayout = ({ title, subtitle, children, wide }: { title: string; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) => {
  return (
    <div className="auth">
      <main className={wide ? 'auth-card auth-card-wide' : 'auth-card'}>
        <Logo />
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </main>
      <Toaster />
    </div>
  );
};
