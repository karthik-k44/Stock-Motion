import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { CtaBand } from './components/CtaBand';
import { FaqList } from './components/FaqList';
import { PageHeader } from './components/PageHeader';
import { useSignedIn } from './lib/use-signed-in';

/** The FAQ page: questions people ask before signing up. */
export const Faq = () => {
  useDocumentTitle('FAQ');
  const signedIn = useSignedIn();
  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Questions, answered."
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
      <FaqList />
      <p className="mx-auto mt-10 mb-0 max-w-3xl px-4 text-center text-[15px] text-ink-2 sm:px-6">
        Anything else? Create an account and look around — it takes a minute.
      </p>
      <CtaBand signedIn={signedIn} />
    </>
  );
};
