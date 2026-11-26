import { Navigate } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { authService } from '@/frontend/features/auth/services';
import { FullPageStatus } from '@/frontend/features/shell/components/FullPageStatus';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { sessionState } from '@/frontend/services/session-state';
import { CtaBand } from './components/CtaBand';
import { LandingHero } from './components/BentoHero';
import { SketchSection } from './components/SketchSection';
import { UseCaseSection } from './components/UseCaseSection';
import { usePageMotion } from './lib/use-landing-motion';
import { useSignedIn } from './lib/use-signed-in';

/**
 * The public front page: the pitch, who it's for and how to start. Features, pricing and FAQ have their own pages.
 * Someone signed in who opens the site goes straight to the app instead.
 */
export const Landing = () => {
  useDocumentTitle('Inventory, orders and deliveries — live');
  const session = authService.useGetSession();
  const signedIn = useSignedIn();
  const motion = usePageMotion();
  if (session.data) return <Navigate to={paths.home} replace />;
  // This browser was signed in last time: check before showing the pitch, rather than flash it and then leave.
  if (session.isPending && sessionState.WasSignedIn()) return <FullPageStatus title="Opening StockMotion…" />;
  return (
    <div ref={motion}>
      <LandingHero signedIn={signedIn} />
      <SketchSection />
      <UseCaseSection />
      <CtaBand signedIn={signedIn} />
    </div>
  );
};
