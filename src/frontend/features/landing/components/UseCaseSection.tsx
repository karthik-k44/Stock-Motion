import { Text } from '@/frontend/components/text';
import { USE_CASES } from '../lib/landing-content';
import { SectionHeading } from './SectionHeading';

/** Who it's for: one flat hairline card per use case, each the target of its mega-menu link. */
export const UseCaseSection = () => (
  <section id="use-cases" className="scroll-mt-28 py-20">
    <div className="mx-auto max-w-300 px-4 sm:px-6">
      <SectionHeading eyebrow="Use cases" title="Built around the way your business already works." lead="Pick your kind of business and StockMotion speaks your language — from aisles and pick lists to recipes and job kits." />
      <ul data-reveal-group className="mt-12 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map((u) => {
          const UseCaseIcon = u.icon;
          return (
            <li key={u.id} id={u.id} className="landing-card scroll-mt-32 rounded-xl border border-line bg-white p-8">
              <UseCaseIcon className="size-5 text-steel" strokeWidth={1.7} aria-hidden />
              <Text variant="feature" className="mt-10">
                {u.title}
              </Text>
              <Text variant="body" tone="secondary" className="mt-2">
                {u.text}
              </Text>
            </li>
          );
        })}
      </ul>
    </div>
  </section>
);
