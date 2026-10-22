import type { ReactNode } from 'react';
import { Text } from '@/frontend/components/text';

/** The opener of every page after the front one: eyebrow, the page's one h1 and a lead, centred under the navbar. */
export const PageHeader = ({ eyebrow, title, lead }: { eyebrow: string; title: ReactNode; lead: ReactNode }) => (
  <header className="landing-rise mx-auto max-w-300 px-4 pt-[164px] pb-14 text-center sm:px-6">
    <Text variant="eyebrow" className="text-[12px] tracking-[0.06em]">
      {eyebrow}
    </Text>
    <Text variant="banner" className="mx-auto mt-5 max-w-3xl">
      {title}
    </Text>
    <Text variant="lead" tone="secondary" className="mx-auto mt-6 max-w-xl">
      {lead}
    </Text>
  </header>
);
