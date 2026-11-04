import type { ReactNode } from 'react';
import { Text } from '@/frontend/components/text';
import { Cn } from '@/frontend/lib/utils';

/** Eyebrow, heading and a line of lead text — the opener of every marketing section. */
export const SectionHeading = ({ eyebrow, title, lead, center }: { eyebrow: string; title: ReactNode; lead?: ReactNode; center?: boolean }) => (
  <div data-reveal className={Cn('max-w-2xl', center && 'mx-auto text-center')}>
    <Text variant="eyebrow" className="mb-4 text-[12px] tracking-[0.06em]">
      {eyebrow}
    </Text>
    <Text variant="section">{title}</Text>
    {lead && (
      <Text variant="lead" tone="secondary" className="mt-4">
        {lead}
      </Text>
    )}
  </div>
);
