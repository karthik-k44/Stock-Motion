import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { CtaBand } from './components/CtaBand';
import { FeatureGrid } from './components/FeatureGrid';
import { PageHeader } from './components/PageHeader';
import { ScenarioShowcase } from './components/ScenarioShowcase';
import { useSignedIn } from './lib/use-signed-in';

/** The features page: what StockMotion does, then the illustrated scenarios where it does it. */
export const Features = () => {
  useDocumentTitle('Features');
  const signedIn = useSignedIn();
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Everything moving, nothing out of sight."
        lead="One place for what you stock, what you sell and what is on its way — kept current for everyone, all the time."
      />
      <FeatureGrid />
      <ScenarioShowcase />
      <CtaBand signedIn={signedIn} />
    </>
  );
};
