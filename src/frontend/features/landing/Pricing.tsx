import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { PageHero } from './components/BentoHero';
import { PricingPlans } from './components/PricingPlans';
import { PRICING_ART } from './lib/hero-content';
import { usePageMotion } from './lib/use-landing-motion';

const MORE = [
  { to: paths.features, label: 'See everything StockMotion does' },
  { to: paths.faq, label: 'Read the FAQ' },
];

/** The pricing page: the bento hero, the three plans on white, and the way on to the features and the FAQ. */
export const Pricing = () => {
  useDocumentTitle('Pricing');
  const motion = usePageMotion();
  return (
    <div ref={motion}>
      <PageHero eyebrow="Pricing" title="Simple pricing for every stock room" accent={['Simple', 'pricing']} lead="Start on Starter or Pro in minutes, or talk to us if you run something bigger." art={PRICING_ART} />
      <PricingPlans />
      <nav data-reveal aria-label="More about StockMotion" className="mx-auto flex max-w-300 flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 pt-10 pb-24 sm:px-6">
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
