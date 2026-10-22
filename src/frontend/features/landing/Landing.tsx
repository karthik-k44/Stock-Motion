import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { CtaBand } from './components/CtaBand';
import { Hero } from './components/Hero';
import { StepsSection } from './components/StepsSection';
import { UseCaseSection } from './components/UseCaseSection';
import { useSignedIn } from './lib/use-signed-in';

/** The public front page: the pitch, who it's for and how to start. Features, pricing and FAQ have their own pages. */
export const Landing = () => {
  useDocumentTitle('Inventory, orders and deliveries — live');
  const signedIn = useSignedIn();
  return (
    <>
      <Hero signedIn={signedIn} />
      <UseCaseSection />
      <StepsSection />
      <CtaBand signedIn={signedIn} />
    </>
  );
};
