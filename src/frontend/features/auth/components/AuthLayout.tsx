import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { Toaster } from '@/frontend/components/toast';
import { Button } from '@/frontend/components/ui/button';
import { Cn } from '@/frontend/lib/utils';

type AuthLayoutProps = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  /** A way out above the card, e.g. back to the landing page from sign-in */
  back?: { to: string; label: string };
};

/** Centred card for sign-in, sign-up, invites and onboarding. */
export const AuthLayout = ({ title, subtitle, children, wide, back }: AuthLayoutProps) => {
  return (
    <div className="auth">
      <div className={Cn('grid w-full gap-3', wide ? 'max-w-[960px]' : 'max-w-[420px]')}>
        {back && (
          <Button asChild variant="ghost" size="sm" className="justify-self-start text-ink-2 hover:bg-white/70 hover:text-ink">
            <Link to={back.to}>
              <ArrowLeft aria-hidden />
              {back.label}
            </Link>
          </Button>
        )}
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
      </div>
      <Toaster />
    </div>
  );
};
