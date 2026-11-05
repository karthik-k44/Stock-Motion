import { CircleCheck, Mail, Sparkle, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { Button } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { PLANS, PRICE, type PlanType } from '../lib/pricing-content';

const LOGOS: Record<PlanType['id'], string> = {
  starter: 'bg-linear-to-br from-primary-100 to-primary-300 text-primary-800',
  pro: 'bg-linear-to-br from-cta-from to-cta-to text-primary-foreground',
  scale: 'bg-linear-to-br from-carbon to-[#4a4640] text-white',
};

const CARTONS = 'M96 8 170 50v84l-74 42-74-42V50zM22 50l74 42 74-42M96 92v84M170 92l74-42 56 32v84l-56 32-74-42';

/** Stacked cartons in outline, as ribbons: a wide stroke under a slightly narrower one of the card's white. */
const Art = () => (
  <svg viewBox="0 0 300 220" fill="none" strokeLinejoin="round" className="pricing-art" aria-hidden>
    <path d={CARTONS} stroke="currentColor" strokeWidth="19" strokeOpacity="0.55" />
    <path d={CARTONS} stroke="#fff" strokeWidth="17" strokeOpacity="0.72" />
  </svg>
);

const Price = ({ plan, big }: { plan: PlanType; big: boolean }) => (
  <Text as="p" variant={big ? 'hero' : 'title'} weight="semibold" className="tracking-[-0.03em]">
    {plan.price === null ? 'Contact us' : `$${plan.price}`}
    {plan.price !== null && (
      <Text as="span" variant="small" tone="muted" weight="regular" className="ml-1.5 tracking-normal">
        /month
      </Text>
    )}
  </Text>
);

const PlanCard = ({ plan, featured = false }: { plan: PlanType; featured?: boolean }) => {
  const LogoIcon = plan.icon;
  const contact = plan.price === null;
  return (
    <article
      aria-label={`${plan.name}, ${PRICE(plan)}`}
      className={Cn(
        'pricing-card relative isolate flex flex-col overflow-hidden rounded-2xl border bg-white',
        `pricing-card-${plan.id}`,
        featured ? 'border-primary-300 p-7 shadow-[0_32px_70px_-32px_rgb(179_85_0/0.5)] sm:p-8' : 'border-line p-6',
      )}
    >
      <Art />
      {featured && (
        <>
          <Sparkle className="absolute top-20 right-16 size-3 fill-white text-white" aria-hidden />
          <Sparkle className="absolute top-32 right-9 size-2 fill-white text-white" aria-hidden />
          <span className="absolute top-6 right-6 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-medium text-ink backdrop-blur-sm">Most popular</span>
        </>
      )}
      <span className={Cn('grid place-items-center rounded-full', LOGOS[plan.id], featured ? 'size-12' : 'size-10')}>
        <LogoIcon className={featured ? 'size-6' : 'size-5'} aria-hidden />
      </span>
      <Text as="h3" variant={featured ? 'title' : 'feature'} weight="semibold" className="mt-5 tracking-[-0.02em]">
        {plan.name}
      </Text>
      <Text variant={featured ? 'body' : 'small'} tone="secondary" className="mt-1.5 min-h-[2.8em] max-w-[34ch]">
        {plan.pitch}
      </Text>
      <div className={featured ? 'mt-6' : 'mt-5'}>
        <Price plan={plan} big={featured} />
      </div>

      <Button asChild variant={featured ? 'default' : 'outline'} className={Cn('mt-5 w-full rounded-lg font-semibold', featured ? 'h-12 text-[15px]' : 'h-11')}>
        {contact ? (
          <Link to={paths.contact}>
            <Mail aria-hidden />
            {plan.cta}
          </Link>
        ) : (
          <Link to={`${paths.signup}?plan=${plan.id}`}>{plan.cta}</Link>
        )}
      </Button>

      <ul className={Cn('m-0 grid list-none gap-3 p-0', featured ? 'mt-7' : 'mt-6')}>
        {plan.highlights.map((h) => {
          const HighlightIcon = h.icon;
          return (
            <li key={h.lead + h.rest} className="flex items-center gap-2.5 text-[13px] text-ink-2 sm:text-sm">
              <HighlightIcon className="size-4 flex-none text-steel" aria-hidden />
              <span>
                <span className="font-semibold text-ink">{h.lead}</span> {h.rest}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="m-0 mt-5 flex items-center gap-3 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-line" aria-hidden />
        {plan.builds}
        <span className="h-px flex-1 bg-line" aria-hidden />
      </p>

      <ul className="m-0 mt-5 grid list-none gap-3 p-0">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5 text-[13px] text-ink-2 sm:text-sm">
            <CircleCheck className="mt-0.5 size-4 flex-none text-primary-700" aria-hidden />
            {f.text}
            {f.tag && (
              <span className="inline-flex flex-none items-center gap-1 rounded-md border border-line bg-white px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
                <Sparkles className="size-3 text-primary-700" aria-hidden />
                {f.tag}
              </span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
};

/**
 * The three plans, after the reference: side cards either side of a larger Pro card with the page's one solid orange
 * button. On phones and tablets they stack, Pro in the middle as on the wide layout.
 */
export const PricingPlans = () => (
  <section aria-labelledby="plans-title" className="relative mx-auto max-w-300 px-4 pt-4 pb-6 sm:px-6">
    <h2 id="plans-title" className="sr-only">
      Plans
    </h2>
    <div data-reveal-group className="relative mx-auto grid max-w-[460px] items-center gap-5 lg:max-w-none lg:grid-cols-[1fr_1.3fr_1fr]">
      <PlanCard plan={PLANS.starter} />
      <PlanCard plan={PLANS.pro} featured />
      <PlanCard plan={PLANS.scale} />
    </div>
    <p data-reveal className="relative mx-auto mt-10 mb-0 max-w-xl text-center text-[13px] text-ink-2">Prices in US dollars, per month. Every plan includes the retail, café and trades set-ups.</p>
  </section>
);
