import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { PageHero } from './components/BentoHero';
import { FeatureGrid } from './components/FeatureGrid';
import { ScenarioShowcase } from './components/ScenarioShowcase';
import { FEATURES_ART } from './lib/hero-content';
import { usePageMotion } from './lib/use-landing-motion';

/** The features page: what StockMotion does, then the illustrated scenarios where it does it. */
export const Features = () => {
  useDocumentTitle('Features');
  const motion = usePageMotion();
  return (
    <div ref={motion}>
      <PageHero
        eyebrow="Features"
        title="Everything moving, nothing out of sight."
        accent={['moving', 'sight']}
        lead="One place for what you stock, what you sell and what is on its way — kept current for everyone, all the time."
        art={FEATURES_ART}
      />
      <FeatureGrid />
      <ScenarioShowcase />
    </div>
  );
};
