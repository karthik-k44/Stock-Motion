import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/frontend/components/logo';
import { Toaster } from '@/frontend/components/toast';
import { Cn } from '@/frontend/lib/utils';

/** The three steps from signing up to working: choose a plan, pay (or skip with the trial), set up the inventories. */
export const FLOW_STEPS = ['Choose a plan', 'Payment', 'Set up inventories'] as const;

const FlowSteps = ({ step }: { step: number }) => (
  <ol className="m-0 flex list-none items-center gap-2.5 p-0" aria-label="Getting started">
    {FLOW_STEPS.map((label, i) => {
      const done = i < step;
      const current = i === step;
      return (
        <li key={label} className="flex min-w-0 items-center gap-2.5 not-last:flex-1" aria-current={current ? 'step' : undefined}>
          <span className={Cn('flex items-center gap-2 text-[13px] whitespace-nowrap', current ? 'font-semibold text-ink' : done ? 'text-ink-2' : 'text-muted-foreground')}>
            <span
              className={Cn(
                'grid size-7 flex-none place-items-center rounded-full text-xs font-bold',
                done && 'bg-primary-100 text-primary-800',
                current && 'bg-primary text-primary-foreground',
                !done && !current && 'bg-sunken text-muted-foreground',
              )}
              aria-hidden
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={Cn(!current && 'max-sm:hidden')}>{label}</span>
          </span>
          {i < FLOW_STEPS.length - 1 && <span className={Cn('h-px min-w-3 flex-1', done ? 'bg-primary-300' : 'bg-line')} aria-hidden />}
        </li>
      );
    })}
  </ol>
);

type Props = {
  /** Which of FLOW_STEPS this page is */
  step: number;
  title: string;
  lead: ReactNode;
  /** A way out, top right (back to the app, or to the plans) */
  aside?: ReactNode;
  children: ReactNode;
};

/** The full-page frame for the plans and payment pages: the logo, where you are in getting started, and the page. */
export const FlowLayout = ({ step, title, lead, aside, children }: Props) => (
  <div className="min-h-dvh bg-surface">
    <header className="mx-auto flex max-w-300 items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Logo className="text-[20px]" markClassName="h-8" />
      {aside}
    </header>
    <main className="mx-auto w-full max-w-300 px-4 pt-4 pb-16 sm:px-6 sm:pt-8">
      <div className="max-w-[560px]">
        <FlowSteps step={step} />
      </div>
      <h1 className="m-0 mt-8 text-[28px] leading-tight font-bold tracking-tight text-ink sm:text-[34px]">{title}</h1>
      <p className="m-0 mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{lead}</p>
      <div className="mt-8">{children}</div>
    </main>
    <Toaster />
  </div>
);
