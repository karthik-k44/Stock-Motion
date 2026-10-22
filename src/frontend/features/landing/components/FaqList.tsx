import { Plus } from 'lucide-react';
import { Text } from '@/frontend/components/text';
import { FAQS } from '../lib/landing-content';

/** Questions people ask before signing up, as native disclosures (keyboard and screen-reader friendly). */
export const FaqList = () => (
  <section aria-labelledby="faq-list-title" className="mx-auto max-w-3xl px-4 sm:px-6">
    <h2 id="faq-list-title" className="sr-only">
      Questions
    </h2>
    <div className="divide-y divide-line border-y border-line">
      {FAQS.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <Text as="span" variant="feature">
              {f.q}
            </Text>
            <Plus className="size-5 flex-none text-ink transition-transform duration-200 group-open:rotate-45" aria-hidden />
          </summary>
          <Text variant="body" tone="secondary" className="max-w-2xl pb-6">
            {f.a}
          </Text>
        </details>
      ))}
    </div>
  </section>
);
