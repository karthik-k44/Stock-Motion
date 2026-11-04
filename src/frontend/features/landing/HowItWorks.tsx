import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { PageHero } from './components/BentoHero';
import { BusinessFlows, JourneySection, Safeguards, SetupSteps } from './components/HowItWorksSections';
import { HOW_ART } from './lib/hero-content';
import { usePageMotion } from './lib/use-landing-motion';

const MORE = [
  { to: paths.features, label: 'See everything StockMotion does' },
  { to: paths.pricing, label: 'Compare the plans' },
];

/**
 * The How it works page: setting up, then the loop one box takes through a working day, how that loop reads for each
 * kind of business, and what keeps the numbers right.
 */
export const HowItWorks = () => {
  useDocumentTitle('How it works');
  const motion = usePageMotion();
  return (
    <div ref={motion}>
      <PageHero
        eyebrow="How it works"
        title="From first sign-in to a stock room in sync."
        accent={['sync']}
        lead="Set up in three steps. After that, every delivery, count and order updates the same numbers for your whole team, the moment it happens."
        art={HOW_ART}
      />
      <SetupSteps />
      <JourneySection />
      <BusinessFlows />
      <Safeguards />
      <nav data-reveal aria-label="More about StockMotion" className="mx-auto flex max-w-300 flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 sm:px-6">
        {MORE.map((m) => (
          <Link key={m.to} to={m.to} className="inline-flex items-center gap-2 text-sm font-medium text-ink no-underline hover:underline">
            {m.label}
            <ArrowRight className="size-4 text-primary-700" aria-hidden />
          </Link>
        ))}
      </nav>
    </div>
  );
};
