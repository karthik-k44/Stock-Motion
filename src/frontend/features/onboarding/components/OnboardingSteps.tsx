import { Check } from 'lucide-react';
import { Cn } from '@/frontend/lib/utils';

export const STEPS = ['Business type', 'Details', 'Get started'];

/** Where you are in the setup. Finished steps are buttons, so you can go straight back to one. */
export const OnboardingSteps = ({ step, onJump }: { step: number; onJump: (step: number) => void }) => (
  <ol className="m-0 flex list-none items-center gap-2.5 p-0" aria-label="Setup progress">
    {STEPS.map((label, i) => {
      const done = i < step;
      const current = i === step;
      return (
        <li key={label} className="flex min-w-0 items-center gap-2.5 not-last:flex-1" aria-current={current ? 'step' : undefined}>
          <button
            type="button"
            disabled={!done}
            onClick={() => onJump(i)}
            aria-label={done ? `Back to ${label.toLowerCase()}` : undefined}
            className={Cn('flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] whitespace-nowrap', done ? 'cursor-pointer text-ink-2 hover:text-ink' : 'cursor-default', current ? 'font-semibold text-ink' : !done && 'text-muted-foreground')}
          >
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
          </button>
          {i < STEPS.length - 1 && <span className={Cn('h-px min-w-3 flex-1', done ? 'bg-primary-300' : 'bg-line')} aria-hidden />}
        </li>
      );
    })}
  </ol>
);
