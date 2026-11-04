import gsap from 'gsap';
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo, LogoMark } from '@/frontend/components/logo';
import { Text } from '@/frontend/components/text';
import { paths } from '@/frontend/config/paths';
import { useMotion } from '@/frontend/hooks/use-motion';
import { Cn } from '@/frontend/lib/utils';
import { AUDIENCE, LIVE_AREAS, LIVE_EVENTS, type HeroObjectType } from '../lib/hero-content';
import { SCENARIOS } from '../lib/landing-content';

const THUMBS_SHOWN = 5;
const EVENT_SECONDS = 3.4;

/** Which live event is showing. Stays on the first with motion off. */
export const useLiveEvent = () => {
  const { reduced } = useMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const interval = window.setInterval(() => setIndex((i) => (i + 1) % LIVE_EVENTS.length), EVENT_SECONDS * 1000);
    return () => window.clearInterval(interval);
  }, [reduced]);
  return index;
};

/** Words wrapped for the rise-in: each sits in a clipped box, with `accent` words painted in the moving gradient. */
const Accented = ({ text, accent, rise = false }: { text: string; accent: string[]; rise?: boolean }) => (
  <>
    {text.split(' ').map((word, i) => {
      const lit = accent.includes(word.replace(/[.,]/g, ''));
      return (
        <Fragment key={`${word}-${i}`}>
          {rise ? (
            <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
              <span data-word className={Cn('inline-block', lit && 'bento-accent')}>
                {word}
              </span>
            </span>
          ) : (
            <span className={Cn(lit && 'bento-accent')}>{word}</span>
          )}{' '}
        </Fragment>
      );
    })}
  </>
);

export const Headline = ({ text, accent, size }: { text: string; accent: string[]; size: string }) => (
  <Text as="h1" variant="banner" className={size}>
    <Accented text={text} accent={accent} rise />
  </Text>
);

/** The scenes from the features page, as a row of swatches leading there. */
export const ThumbRow = () => (
  <Link to={paths.features} aria-label="See the everyday problems StockMotion handles" className="flex w-fit items-center gap-1.5 no-underline">
    {SCENARIOS.slice(0, THUMBS_SHOWN).map((s) => (
      <img key={s.image} data-thumb src={`/landing/scenarios/${s.image}.jpg`} alt="" width={1600} height={1000} className="size-9 rounded-lg border border-line object-cover" />
    ))}
    <span data-thumb className="grid size-9 place-items-center rounded-lg border border-primary-300 text-xs font-semibold text-primary-800">
      +{SCENARIOS.length - THUMBS_SHOWN}
    </span>
  </Link>
);

/** The stacked card in the headline tile: StockMotion's activity going by, with a gradient card peeking out behind. */
export const LiveCard = ({ index }: { index: number }) => {
  const { reduced } = useMotion();
  const body = useRef<HTMLDivElement>(null);
  const event = LIVE_EVENTS[index];
  const EventIcon = event.icon;

  useLayoutEffect(() => {
    if (reduced || index === 0 || !body.current) return;
    const tween = gsap.fromTo(body.current, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    return () => void tween.kill();
  }, [index, reduced]);

  return (
    <div data-rise className="relative pt-3" aria-hidden>
      <span className="bento-strip absolute inset-x-5 top-0 h-7 rounded-t-xl" />
      <div className="bento-live relative flex items-center justify-between gap-3 overflow-hidden rounded-xl p-3.5">
        <div ref={body} className="flex min-h-11 min-w-0 items-center gap-3">
          <span className="grid size-11 flex-none place-items-center rounded-full bg-linear-to-br from-primary-300 to-primary text-ink">
            <EventIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{event.title}</span>
            <span className="block truncate text-sm text-ink-2">{event.detail}</span>
          </span>
        </div>
        <span className="inline-flex flex-none items-center gap-1.5 text-[13px] font-medium text-ink-2">
          <span className="size-2 rounded-full bg-primary" />
          Live
        </span>
      </div>
    </div>
  );
};

/** The picture tile, optionally with the logo set over it. */
export const ImageTile = ({ src, logo = false, className }: { src: string; logo?: boolean; className?: string }) => (
  <div data-tile className={Cn('bento-tile relative overflow-hidden', className)}>
    <img data-hero-image src={src} alt="" decoding="async" fetchPriority="high" className="absolute inset-0 size-full object-cover" />
    {logo && (
      <div data-depth="10" className="absolute inset-0 grid place-items-center" aria-hidden>
        <span data-rise className="rounded-2xl bg-white/95 px-5 py-3 shadow-[0_22px_44px_-18px_rgb(107_51_0/0.7)]">
          <Logo className="gap-2.5 text-[clamp(1.25rem,2vw,1.75rem)]" markClassName="h-10" />
        </span>
      </div>
    )}
  </div>
);

/** The tall orange tile: a glossy object with labels drifting around it, in place of the reference's keys. */
export const ObjectTile = ({ object, className }: { object: HeroObjectType; className?: string }) => (
  <div data-tile className={Cn('bento-object relative isolate flex min-h-[360px] items-center justify-center overflow-hidden', className)}>
    <div data-depth="26" className="absolute inset-0 grid place-items-center pb-9">
      <img data-object src={object.src} alt="" width={1000} height={1000} decoding="async" className="h-auto max-h-[92%] w-[min(90%,420px)] object-contain" />
    </div>
    <div data-depth="-16" className="absolute inset-0" aria-hidden>
      {object.pills.map((pill) => (
        <span key={pill.text} data-pill className="absolute rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-ink shadow-[0_12px_28px_-14px_rgb(107_51_0/0.55)]" style={{ left: pill.left, top: pill.top }}>
          {pill.text}
        </span>
      ))}
    </div>
    <p className="absolute inset-x-4 bottom-5 m-0 text-center text-[17px] font-semibold tracking-[-0.01em] text-ink">{object.caption}</p>
  </div>
);

/** The small tile with the mark, a line and the wordmark. */
export const TaglineTile = ({ text, accent, className }: { text: string; accent: string[]; className?: string }) => (
  <div data-tile className={Cn('bento-tile flex flex-col items-center justify-center gap-4 p-5 text-center', className)}>
    <LogoMark className="h-10" />
    <p className="m-0 max-w-[22ch] text-[15px] leading-snug font-semibold tracking-[-0.01em] text-ink">
      <Accented text={text} accent={accent} />
    </p>
    <span className="text-[15px] font-semibold tracking-[-0.03em] text-ink-2" aria-hidden>
      StockMotion
    </span>
  </div>
);

/** The large logo. Its folds are laid down one by one as the page opens (useHeroMotion). */
export const MarkTile = ({ className }: { className?: string }) => (
  <div data-tile data-big-mark className={Cn('bento-tile grid place-items-center p-6', className)} aria-hidden>
    <LogoMark className="h-28" />
  </div>
);

/** The reference's colour swatches, each standing for a part of the app and lit while the live card shows it. */
export const AreaTiles = ({ index }: { index: number }) => (
  <div className="grid grid-cols-4 gap-2 lg:grid-cols-1" aria-hidden>
    {LIVE_AREAS.map((area, i) => {
      const AreaIcon = area.icon;
      return (
        <span key={area.label} data-tile data-lit={i === index || undefined} title={area.label} className={Cn('bento-area grid h-11 place-items-center rounded-xl lg:w-14', `bento-area-${i}`)}>
          <AreaIcon className="size-5" />
        </span>
      );
    })}
  </div>
);

/** Who it's for, in the place of the reference's client faces: StockMotion has no customers to name yet. */
export const AudienceTile = () => (
  <div data-tile className="bento-tile relative flex min-h-[176px] flex-col justify-between overflow-hidden p-5">
    <div className="flex items-start justify-between gap-4">
      <Text variant="body" tone="secondary">
        Built for
      </Text>
      <ul className="m-0 flex list-none p-0" aria-label={AUDIENCE.map((a) => a.label).join(', ')}>
        {AUDIENCE.map((a, i) => (
          <li key={a.icon} className={Cn('size-14 overflow-hidden rounded-full border-[3px] border-white bg-white shadow-[0_10px_24px_-14px_rgb(107_51_0/0.5)]', i > 0 && '-ml-3')}>
            <img src={`/landing/icons/${a.icon}.webp`} alt="" width={400} height={400} decoding="async" className="size-full object-contain p-1.5" />
          </li>
        ))}
      </ul>
    </div>
    <p className="m-0 mt-3 max-w-[24ch] text-xl leading-[1.2] font-semibold tracking-[-0.02em] text-ink">
      <Accented text="One app for retail, cafés and trades" accent={['retail', 'cafés', 'trades']} />
    </p>
  </div>
);

export const HeadlineTile = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div data-tile className={Cn('bento-tile flex min-w-0 flex-col p-6 sm:p-8', className)}>
    {children}
  </div>
);
