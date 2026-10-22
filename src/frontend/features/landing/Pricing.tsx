import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { CtaBand } from './components/CtaBand';
import { PageHeader } from './components/PageHeader';
import { PricingPlans } from './components/PricingPlans';
import { useSignedIn } from './lib/use-signed-in';

const MORE = [
  { to: paths.features, label: 'See everything StockMotion does' },
  { to: paths.faq, label: 'Read the FAQ' },
];

/** The pricing page: the two plans on a dark band, with the way on to the features and the FAQ. */
export const Pricing = () => {
  useDocumentTitle('Pricing');
  const signedIn = useSignedIn();
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Simple pricing for every stock room" lead="Two plans, priced per month. Start with either — setting up your business takes minutes." />
      <PricingPlans />
      <nav aria-label="More about StockMotion" className="mx-auto flex max-w-300 flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 pt-10 sm:px-6">
        {MORE.map((m) => (
          <Link key={m.to} to={m.to} className="inline-flex items-center gap-2 text-sm font-medium text-ink no-underline hover:underline">
            {m.label}
            <ArrowRight className="size-4 text-primary-700" aria-hidden />
          </Link>
        ))}
      </nav>
      <CtaBand signedIn={signedIn} />
    </>
  );
};
