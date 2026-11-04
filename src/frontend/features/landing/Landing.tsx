import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { CtaBand } from './components/CtaBand';
import { LandingHero } from './components/BentoHero';
import { SketchSection } from './components/SketchSection';
import { UseCaseSection } from './components/UseCaseSection';
import { usePageMotion } from './lib/use-landing-motion';
import { useSignedIn } from './lib/use-signed-in';

/** The public front page: the pitch, who it's for and how to start. Features, pricing and FAQ have their own pages. */
export const Landing = () => {
  useDocumentTitle('Inventory, orders and deliveries — live');
  const signedIn = useSignedIn();
  const motion = usePageMotion();
  return (
    <div ref={motion}>
      <LandingHero signedIn={signedIn} />
      <SketchSection />
      <UseCaseSection />
      <CtaBand signedIn={signedIn} />
    </div>
  );
};
