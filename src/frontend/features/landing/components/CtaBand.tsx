import { ArrowRight, Shapes } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { Button } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';

/**
 * 3D icons from 3dicons (CC0, realvjy/3dicons), one per thing StockMotion handles, floating around the call to
 * action like app icons. x / y are the tile's centre in % of the section; `wide` tiles only show on large screens.
 */
const TILES: { icon: string; x: number; y: number; size: number; tilt: number; wide?: boolean }[] = [
  { icon: 'orders', x: 9, y: 22, size: 124, tilt: -7 },
  { icon: 'stock', x: 22, y: 42, size: 72, tilt: 8, wide: true },
  { icon: 'catalogue', x: 7, y: 60, size: 100, tilt: 5 },
  { icon: 'dashboard', x: 19, y: 78, size: 108, tilt: -5, wide: true },
  { icon: 'import', x: 6, y: 86, size: 64, tilt: 10, wide: true },
  { icon: 'cafe', x: 27, y: 14, size: 60, tilt: -10, wide: true },
  { icon: 'alerts', x: 89, y: 18, size: 112, tilt: 7 },
  { icon: 'realtime', x: 76, y: 36, size: 70, tilt: -9, wide: true },
  { icon: 'deliveries', x: 88, y: 56, size: 132, tilt: -4 },
  { icon: 'locations', x: 77, y: 78, size: 96, tilt: 6, wide: true },
  { icon: 'trades', x: 92, y: 85, size: 64, tilt: -10, wide: true },
  { icon: 'launch', x: 72, y: 12, size: 58, tilt: 9, wide: true },
];

/** The closing ask, after the reference: centred promise and two pills, with the product's world floating around it. */
export const CtaBand = ({ signedIn, more = { to: paths.howItWorks, label: 'See how it works' } }: { signedIn: boolean; more?: { to: string; label: string } }) => (
  <section className="relative isolate overflow-x-clip py-28 sm:py-36" aria-labelledby="cta-title">
    <div className="landing-wash" aria-hidden />
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {TILES.map((t) => (
        <span
          key={t.icon}
          data-pop
          className={Cn('landing-tile absolute', t.wide ? 'hidden lg:block' : 'hidden sm:block')}
          style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.size, height: t.size, '--tilt': `${t.tilt}deg` } as CSSProperties}
        >
          <img src={`/landing/icons/${t.icon}.webp`} alt="" width={400} height={400} loading="lazy" decoding="async" className="size-full object-contain p-[12%]" />
        </span>
      ))}
    </div>

    <div data-reveal className="relative mx-auto max-w-xl px-4 text-center">
      <span className="mx-auto grid size-10 place-items-center rounded-xl bg-sunken text-ink" aria-hidden>
        <Shapes className="size-5" strokeWidth={1.6} />
      </span>
      <Text id="cta-title" variant="section" className="mt-6">
        Power up your stock room.
      </Text>
      <Text variant="lead" tone="secondary" className="mx-auto mt-4 max-w-md">
        Sign up, pick your kind of business and StockMotion sets up your shelves, your order flow and your live world in minutes.
      </Text>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="h-12 rounded-xl px-6 text-[15px] font-semibold">
          <Link to={signedIn ? paths.home : paths.signup}>
            {signedIn ? 'Open StockMotion' : 'Get started'}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Link to={more.to} className="inline-flex h-12 items-center rounded-xl px-4 text-[15px] font-medium text-ink no-underline hover:bg-sunken">
          {more.label}
        </Link>
      </div>
    </div>
  </section>
);
