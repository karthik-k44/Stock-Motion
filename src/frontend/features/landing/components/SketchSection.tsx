import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { paths } from '@/frontend/config/paths';
import { InventorySketch, SketchStatus, useSketchRound } from './InventorySketch';

/**
 * Straight after the hero: a compact heading and the live step written over the hand-drawn sketch of a company's stock,
 * which runs behind them as the section's background, drawn straight onto the white page.
 */
export const SketchSection = () => {
  const { ref, drawn, stop } = useSketchRound();
  return (
    <section ref={ref} aria-labelledby="sketch-title" className="relative isolate h-[clamp(560px,44vw,700px)] overflow-hidden">
      <div className="absolute inset-x-0 top-0 bottom-3 -z-10 flex justify-center">
        <InventorySketch drawn={drawn} stop={stop} />
      </div>
      <div className="sketch-wash absolute inset-x-0 top-0 -z-10" aria-hidden />
      <div data-reveal className="mx-auto flex max-w-2xl flex-col items-center gap-1 px-4 pt-6 text-center">
        <Text as="h2" id="sketch-title" variant="section" className="text-[clamp(1.5rem,2.4vw,2.125rem)] leading-tight">
          From the truck to the customer's door.
        </Text>
        <Text variant="body" tone="secondary" className="text-[15px]">
          Every step a box takes shows up on every screen, the moment it happens.
        </Text>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <SketchStatus stop={stop} />
          <Link to={paths.howItWorks} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink no-underline hover:underline">
            How it works
            <ArrowRight className="size-4 text-primary-700" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
};
