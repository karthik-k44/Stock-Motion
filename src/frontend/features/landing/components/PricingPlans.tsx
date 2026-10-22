import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { PLANS, PRICE, type PlanType } from '../lib/pricing-content';

const Features = ({ plan, tone }: { plan: PlanType; tone: string }) => (
  <ul className="m-0 grid list-none gap-2.5 p-0">
    {plan.features.map((f) => (
      <li key={f} className={Cn('flex items-start gap-3 text-[13px] font-medium tracking-[0.02em] uppercase', tone)}>
        <span className="mt-[5px] size-1.5 flex-none rounded-[1px] bg-current" aria-hidden />
        {f}
      </li>
    ))}
  </ul>
);

const signUp = (plan: PlanType) => `${paths.signup}?plan=${plan.id}`;

/**
 * The two plans, after the reference: on a full-bleed Abyss band, a Starter card with a glass-light artwork and a
 * white button, and a Pro card whose orange headline and orange button are the band's single accent.
 */
export const PricingPlans = () => {
  const { starter, pro } = PLANS;
  return (
    <section aria-labelledby="plans-title" className="px-3 sm:px-4">
      <div className="landing-grain relative isolate overflow-hidden rounded-xl bg-abyss px-4 py-14 sm:px-8 sm:py-20">
        <h2 id="plans-title" className="sr-only">
          Plans
        </h2>
        <div className="mx-auto grid max-w-[920px] gap-4 md:grid-cols-2">
          <article className="flex flex-col rounded-xl border border-white/10 bg-carbon p-3" aria-label={`${starter.name}, ${PRICE(starter)}`}>
            <div className="pricing-glass relative flex aspect-[16/10] items-end overflow-hidden rounded-lg p-5" aria-hidden>
              <span className="text-[clamp(2.25rem,5vw,3rem)] leading-none font-semibold tracking-[-0.04em] text-white uppercase">{starter.name}</span>
            </div>
            <div className="flex flex-1 flex-col gap-6 px-3 pt-6 pb-3">
              <p className="m-0 text-[15px] tracking-[-0.01em] text-[#b9bbc6]">{starter.pitch}</p>
              <Features plan={starter} tone="text-white/85" />
              <Link
                to={signUp(starter)}
                className="mt-auto inline-flex h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold tracking-[0.02em] text-black uppercase no-underline hover:bg-white/90"
              >
                {starter.cta} · {PRICE(starter)}
              </Link>
            </div>
          </article>

          <article className="flex flex-col gap-6 rounded-xl border border-primary/45 bg-carbon p-6 sm:p-8" aria-label={`${pro.name}, ${PRICE(pro)}`}>
            <p className="m-0 text-xs font-semibold tracking-[0.08em] text-primary uppercase">{pro.name} access</p>
            <p className="m-0 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-primary uppercase">{pro.pitch}</p>
            <Features plan={pro} tone="text-white/80" />
            <Link
              to={signUp(pro)}
              className="mt-auto inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold tracking-[0.02em] text-primary-foreground uppercase no-underline hover:bg-primary-600"
            >
              {pro.cta} · {PRICE(pro)}
            </Link>
          </article>
        </div>
        <p className="mx-auto mt-8 mb-0 max-w-xl text-center text-[13px] text-[#8b8d98]">
          Prices in US dollars, per month. Every plan includes the retail, café and trades set-ups.
        </p>
      </div>
    </section>
  );
};
