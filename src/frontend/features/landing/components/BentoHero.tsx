import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { Button } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { LANDING_ART, type HeroArtType } from '../lib/hero-content';
import { useHeroMotion } from '../lib/use-landing-motion';
import { EmailStart } from './EmailStart';
import { AreaTiles, AudienceTile, Headline, HeadlineTile, ImageTile, LiveCard, MarkTile, ObjectTile, TaglineTile, ThumbRow, useLiveEvent } from './HeroTiles';

const GRID_GAP = 'gap-3 sm:gap-4';

/**
 * The front page's hero, after the brand-board reference: a bento of tiles on white with the page's soft wash. The headline
 * tile comes first in the markup, so it leads on phones and for screen readers; from 1024px it moves to the right column.
 */
export const LandingHero = ({ signedIn }: { signedIn: boolean }) => {
  const root = useHeroMotion();
  const live = useLiveEvent();
  return (
    <section ref={root} className="relative isolate overflow-hidden pt-[116px] pb-14 lg:pb-20">
      <div aria-hidden />
      <div className={Cn('mx-auto grid max-w-[1360px] px-3 sm:px-6 lg:grid-cols-[minmax(0,1.36fr)_minmax(0,1fr)]', GRID_GAP)}>
        <div className={Cn('flex min-w-0 flex-col lg:col-start-2 lg:row-start-1', GRID_GAP)}>
          <HeadlineTile className="flex-1 gap-4 sm:p-7">
            <ThumbRow />
            <Headline text="Real-time inventory for businesses that never stop moving" accent={['Real-time', 'moving']} size="text-[clamp(2.25rem,3.3vw,3.05rem)] leading-[1.06]" />
            <Text data-rise variant="body" tone="secondary" className="text-[15px] sm:text-base">
              Stock, orders and deliveries in sync across your team, with problems flagged before they cost you a sale.
            </Text>
            <div data-rise>
              {signedIn ? (
                <Button asChild className="h-12 rounded-xl px-6 text-[15px] font-semibold">
                  <Link to={paths.home}>Open StockMotion</Link>
                </Button>
              ) : (
                <EmailStart className="max-w-none" />
              )}
            </div>
            <LiveCard index={live} />
          </HeadlineTile>
          <div className={Cn('grid lg:grid-cols-[auto_minmax(0,1fr)]', GRID_GAP)}>
            <AreaTiles index={live} />
            <AudienceTile />
          </div>
        </div>

        <div className={Cn('grid min-w-0 lg:col-start-1 lg:row-start-1 lg:grid-rows-[minmax(0,0.68fr)_minmax(0,1fr)]', GRID_GAP)}>
          <ImageTile src={LANDING_ART.image} logo className="aspect-[16/9] lg:aspect-auto" />
          <div className={Cn('grid min-h-0 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]', GRID_GAP)}>
            <div className={Cn('grid min-h-0 grid-cols-2 sm:grid-cols-1 sm:grid-rows-2', GRID_GAP)}>
              <TaglineTile text={LANDING_ART.tagline} accent={LANDING_ART.taglineAccent} />
              <MarkTile />
            </div>
            <ObjectTile object={LANDING_ART.object} />
          </div>
        </div>
      </div>
    </section>
  );
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  accent: string[];
  lead: ReactNode;
  art: HeroArtType;
};

/** The same bento, shorter, opening the pages after the front one: their content stays near the fold. */
export const PageHero = ({ eyebrow, title, accent, lead, art }: PageHeroProps) => {
  const root = useHeroMotion();
  return (
    <section ref={root} className="relative isolate overflow-hidden pt-[116px] pb-14 lg:pb-16">
      <div aria-hidden />
      <div className={Cn('mx-auto grid max-w-300 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.82fr)_minmax(0,0.68fr)]', GRID_GAP)}>
        <HeadlineTile className="justify-center gap-5 lg:min-h-[440px] lg:p-10">
          <Text data-rise variant="eyebrow" tone="primary" className="text-[12px] tracking-[0.06em]">
            {eyebrow}
          </Text>
          <Headline text={title} accent={accent} size="text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.05]" />
          <Text data-rise variant="lead" tone="secondary" className="max-w-xl">
            {lead}
          </Text>
        </HeadlineTile>
        <ObjectTile object={art.object} />
        <div className={Cn('grid sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2', GRID_GAP)}>
          <ImageTile src={art.image} className="aspect-[16/9] sm:aspect-auto" />
          <TaglineTile text={art.tagline} accent={art.taglineAccent} />
        </div>
      </div>
    </section>
  );
};
