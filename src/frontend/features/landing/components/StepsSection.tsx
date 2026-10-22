import { Text } from '@/frontend/components/text';
import { STEPS } from '../lib/landing-content';
import { SectionHeading } from './SectionHeading';

/** How to start: three numbered steps on flat hairline cards. */
export const StepsSection = () => (
  <section id="how-it-works" className="scroll-mt-28 py-20">
    <div className="mx-auto max-w-300 px-4 sm:px-6">
      <SectionHeading eyebrow="How it works" title="Up and running in an afternoon." />
      <ol className="mt-12 grid list-none gap-4 p-0 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-line bg-white p-8">
            <span className="text-[13px] font-semibold text-muted-foreground tabular-nums" aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            <Text variant="feature" className="mt-8">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </Text>
            <Text variant="body" tone="secondary" className="mt-2">
              {s.text}
            </Text>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
