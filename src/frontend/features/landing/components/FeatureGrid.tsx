import { Text } from '@/frontend/components/text';
import { FEATURES } from '../lib/landing-content';

/** What it does: the six things people notice first, on hairline-topped columns. */
export const FeatureGrid = () => (
  <section aria-labelledby="feature-grid-title" className="mx-auto max-w-300 px-4 sm:px-6">
    <h2 id="feature-grid-title" className="sr-only">
      What StockMotion does
    </h2>
    <ul className="m-0 grid list-none gap-x-10 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f) => {
        const FeatureIcon = f.icon;
        return (
          <li key={f.title} className="border-t border-line pt-6">
            <FeatureIcon className="size-5 text-steel" strokeWidth={1.7} aria-hidden />
            <Text variant="feature" className="mt-5">
              {f.title}
            </Text>
            <Text variant="body" tone="secondary" className="mt-2">
              {f.text}
            </Text>
          </li>
        );
      })}
    </ul>
  </section>
);
