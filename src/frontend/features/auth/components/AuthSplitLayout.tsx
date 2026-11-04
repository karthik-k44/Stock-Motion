import { ArrowLeft } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '@/frontend/components/logo';
import { Text } from '@/frontend/components/text';
import { Toaster } from '@/frontend/components/toast';
import { Button } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';

export type AuthTabType = 'login' | 'signup';

type AuthSplitLayoutProps = {
  title: string;
  subtitle?: ReactNode;
  /** The Sign in / Sign up switch and the way back to the landing page. `search` keeps `?next=` across the switch. */
  tab?: { active: AuthTabType; search?: string };
  children: ReactNode;
};

const TABS: { id: AuthTabType; label: string; to: string }[] = [
  { id: 'login', label: 'Sign in', to: paths.login },
  { id: 'signup', label: 'Sign up', to: paths.signup },
];

/** The faint streaks of light behind the artwork: position in % of the panel, height in %. */
const STREAKS = [
  { left: 7, top: 62, height: 30 },
  { left: 18, top: 8, height: 26 },
  { left: 26, top: 74, height: 24 },
  { left: 44, top: 0, height: 16 },
  { left: 57, top: 82, height: 18 },
  { left: 72, top: 4, height: 30 },
  { left: 80, top: 66, height: 28 },
  { left: 92, top: 34, height: 22 },
];

/** Sign-in, sign-up and invites: the form on the left, the artwork on the right (from 1024px; below that, the form alone). */
export const AuthSplitLayout = ({ title, subtitle, tab, children }: AuthSplitLayoutProps) => (
  <div className="grid min-h-dvh bg-surface lg:grid-cols-2">
    <main className="relative flex min-h-dvh flex-col px-5 pt-16 pb-6 sm:px-8">
      {tab && (
        <Button asChild variant="ghost" size="sm" className="absolute top-4 left-3 text-ink-2 hover:text-ink sm:top-5 sm:left-6">
          <Link to={paths.landing}>
            <ArrowLeft aria-hidden />
            Back to home
          </Link>
        </Button>
      )}

      <div className="flex justify-center">
        <Logo className="text-[22px]" markClassName="h-9" />
      </div>

      <div className="mx-auto my-auto w-full max-w-[380px] py-8">
        <Text variant="display" className="text-center">
          {title}
        </Text>
        {subtitle && (
          <Text variant="body" tone="muted" className="mt-2 text-center">
            {subtitle}
          </Text>
        )}

        {tab && (
          <nav aria-label="Sign in or sign up" className="mt-7 grid grid-cols-2 rounded-xl bg-sunken p-1">
            {TABS.map((t) => (
              <Link
                key={t.id}
                to={`${t.to}${tab.search ?? ''}`}
                aria-current={t.id === tab.active ? 'page' : undefined}
                className={Cn(
                  'rounded-[10px] py-2 text-center text-sm font-medium text-ink-2 no-underline transition-colors hover:text-ink',
                  t.id === tab.active && 'bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(28_25_23/0.1)]',
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-5">{children}</div>
      </div>

      <Text variant="caption" tone="muted" className="mx-auto max-w-md text-center">
        Stock, orders and deliveries in sync across your team, with problems flagged before they cost you a sale.
      </Text>
    </main>

    <aside className="auth-art relative hidden place-items-center overflow-hidden lg:grid" aria-hidden>
      {STREAKS.map((s) => (
        <span key={s.left} className="auth-art-streak" style={{ left: `${s.left}%`, top: `${s.top}%`, height: `${s.height}%` } as CSSProperties} />
      ))}
      <img src="/auth/stock-stack.webp" alt="" width={1800} height={1800} decoding="async" className="auth-art-object relative h-auto w-[min(86%,640px)]" />
    </aside>

    <Toaster />
  </div>
);
