import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { PageHero } from './components/BentoHero';
import { FaqSection } from './components/FaqSection';
import { FAQ_ART } from './lib/hero-content';
import { usePageMotion } from './lib/use-landing-motion';
import { useSignedIn } from './lib/use-signed-in';

/** The FAQ page: questions people ask before signing up. */
export const Faq = () => {
  useDocumentTitle('FAQ');
  const signedIn = useSignedIn();
  const motion = usePageMotion();
  return (
    <div ref={motion}>
      <PageHero
        eyebrow="FAQ"
        title="Questions, answered."
        accent={['answered']}
        art={FAQ_ART}
        lead={
          <>
            How StockMotion works and who it's for. Plans and prices are on the{' '}
            <Link to={paths.pricing} className="font-medium text-ink underline underline-offset-4">
              pricing page
            </Link>
            .
          </>
        }
      />
      <FaqSection signedIn={signedIn} />
    </div>
  );
};
