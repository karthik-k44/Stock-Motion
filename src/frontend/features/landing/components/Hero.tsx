import { ArrowRight, RadioTower, Store } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { Button } from '@/frontend/components/ui/button';
import { DepthCarousel } from '@/frontend/components/ui/depth-carousel';
import { paths } from '@/frontend/config/paths';
import { useMediaQuery } from '@/frontend/hooks/use-media-query';
import { SCENARIOS } from '../lib/landing-content';
import { EmailStart } from './EmailStart';

const TAGS = [
  { icon: Store, text: 'Built for retail, cafés & trades' },
  { icon: RadioTower, text: 'Live across every screen' },
];

const SLIDES = SCENARIOS.map((s) => ({ image: `/landing/scenarios/${s.image}.jpg`, alt: s.alt }));

/**
 * Above the fold, a full-width band under the navbar — white where it meets the navbar, fading into the use-cases
 * band's grey at the bottom, so neither edge shows a line: the pitch on the left (tags, headline, email capture, a link
 * to the features) and, on the right, the everyday problems StockMotion handles as cards in depth — the one in
 * front captioned, the previous ones receding to the left and the next ones to the right. Stacks to a single column below 1024px.
 */
export const Hero = ({ signedIn }: { signedIn: boolean }) => {
  const [active, setActive] = useState(0);
  // Phones: a tighter stack and no arrows (swipe or the dots), so the cards can be bigger.
  const roomy = useMediaQuery('(min-width: 640px)');
  const scenario = SCENARIOS[active];
  return (
    <section className="landing-hero-panel landing-grain relative isolate mt-[100px] overflow-hidden">
      <div className="mx-auto grid max-w-300 items-center gap-6 px-4 pt-14 pb-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8 lg:pt-16 lg:pb-24">
        <div className="landing-rise flex flex-col items-center text-center lg:items-start lg:text-left">
          <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-2 p-0 lg:justify-start">
            {TAGS.map((t) => {
              const TagIcon = t.icon;
              return (
                <li key={t.text} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-2">
                  <TagIcon className="size-3.5 text-steel" aria-hidden />
                  {t.text}
                </li>
              );
            })}
          </ul>
          <Text variant="banner" className="mt-7 max-w-2xl lg:text-[clamp(2.75rem,3.9vw,3.5rem)] lg:leading-[1.05]">
            Real-time inventory for businesses that never stop moving
          </Text>
          <Text variant="lead" tone="secondary" className="mt-6 max-w-xl">
            Stock, orders and deliveries in sync across your team — with problems flagged early: shortages before a sale is lost, late trucks, orders stuck mid-pick.
          </Text>
          <div className="mt-9 flex w-full flex-col items-center gap-4 lg:items-start">
            {signedIn ? (
              <Button asChild className="h-12 rounded-xl px-6 text-[15px] font-semibold">
                <Link to={paths.home}>Open StockMotion</Link>
              </Button>
            ) : (
              <EmailStart />
            )}
            <Link to={paths.features} className="inline-flex items-center gap-2 text-sm font-medium text-ink no-underline hover:underline">
              Explore the features
              <ArrowRight className="size-4 text-primary-700" aria-hidden />
            </Link>
          </div>
        </div>

        <figure className="landing-rise m-0 min-w-0 [animation-delay:120ms]">
          <DepthCarousel
            items={SLIDES}
            label="StockMotion at work"
            cardWidth={440}
            cardHeight={275}
            radius={14}
            fade="mist"
            tint="#fffaf6"
            sides="both"
            depth={roomy ? 160 : 130}
            spread={roomy ? 60 : 72}
            tilt={18}
            visibleCards={roomy ? 2 : 1}
            falloff={0.15}
            blur={2}
            autoplay
            autoplayDelay={3600}
            showControls={roomy}
            arrowInset={0}
            onChange={(index) => setActive(index)}
            className="h-[250px] sm:h-[380px] lg:h-[360px]"
          />
          <figcaption className="mt-1 text-center">
            <span key={active} className="landing-caption inline-flex flex-col items-center gap-1">
              <span className="text-xs font-semibold tracking-[0.06em] text-primary-700 uppercase">{scenario.area}</span>
              <span className="text-[15px] font-medium tracking-[-0.01em] text-ink">{scenario.title}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
};
