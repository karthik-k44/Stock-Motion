import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Text } from '@/frontend/components/text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { useMotion } from '@/frontend/hooks/use-motion';
import { BUSINESS_FLOWS, JOURNEY, SAFEGUARDS, SETUP_STEPS, type BusinessFlowType } from '../lib/how-it-works-content';
import { SCENARIOS } from '../lib/landing-content';
import { SectionHeading } from './SectionHeading';

const Row = ({ who, text, accent = false }: { who: string; text: string; accent?: boolean }) => (
  <div>
    <dt className={accent ? 'text-[13px] font-semibold text-primary-700' : 'text-[13px] font-semibold text-ink'}>{who}</dt>
    <dd className="m-0 mt-0.5 text-[15px] leading-normal text-ink-2">{text}</dd>
  </div>
);

/** The three things to do once, each with what you do and what StockMotion does in return. */
export const SetupSteps = () => (
  <section aria-labelledby="setup-title" className="mx-auto max-w-300 px-4 pt-6 sm:px-6">
    <SectionHeading eyebrow="Getting started" title={<span id="setup-title">Up and running in an afternoon.</span>} lead="Three steps, once. Each one leaves StockMotion knowing a little more about how you work." />
    <ol data-reveal-group className="m-0 mt-12 grid list-none gap-4 p-0 lg:grid-cols-3">
      {SETUP_STEPS.map((step, i) => (
        <li key={step.title} className="landing-card flex flex-col rounded-2xl border border-line bg-white p-7">
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-ink tabular-nums" aria-hidden>
              {i + 1}
            </span>
            <img src={`/landing/icons/${step.icon}.webp`} alt="" width={400} height={400} loading="lazy" decoding="async" className="size-16 object-contain" />
          </div>
          <Text as="h3" variant="feature" className="mt-5">
            <span className="sr-only">Step {i + 1}: </span>
            {step.title}
          </Text>
          <dl className="m-0 mt-4 grid gap-3">
            <Row who="You" text={step.you} />
            <Row who="StockMotion" text={step.app} accent />
          </dl>
        </li>
      ))}
    </ol>
  </section>
);

/**
 * One box's trip through a working day. A line down the side fills as the page scrolls and each stage's number lights
 * up when it is reached, so the page itself walks the loop.
 */
export const JourneySection = () => (
  <section aria-labelledby="journey-title" className="mt-10 py-20">
    <div className="mx-auto max-w-300 px-4 sm:px-6">
      <SectionHeading eyebrow="Every day" title={<span id="journey-title">What happens to a box, step by step.</span>} lead="Once you are set up, this is the loop. Follow one box from the supplier to the customer and back to the reorder." />
      <div className="relative mt-14">
        <span className="journey-rail" aria-hidden>
          <span data-progress />
        </span>
        <ol className="m-0 grid list-none gap-14 p-0 lg:gap-20">
          {JOURNEY.map((stage, i) => (
            <li key={stage.image} data-step data-reveal className="journey-step relative grid items-center gap-6 pl-12 sm:pl-16 lg:grid-cols-2 lg:gap-14">
              <span className="journey-dot" aria-hidden>
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold tracking-[0.06em] text-primary-700 uppercase">{stage.area}</p>
                <Text as="h3" variant="feature" className="mt-2 text-2xl leading-tight tracking-[-0.02em]">
                  <span className="sr-only">Stage {i + 1}: </span>
                  {stage.title}
                </Text>
                <dl className="m-0 mt-4 grid gap-3">
                  <Row who="You" text={stage.you} />
                  <Row who="StockMotion" text={stage.app} accent />
                </dl>
              </div>
              <figure className="journey-picture relative m-0 min-w-0 overflow-hidden rounded-2xl border border-line bg-white">
                <img
                  data-parallax="3"
                  src={`/landing/scenarios/${stage.image}.jpg`}
                  alt={SCENARIOS.find((s) => s.image === stage.image)?.alt ?? ''}
                  width={1600}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[16/10] h-auto w-full scale-110 object-cover"
                />
                <figcaption className="absolute bottom-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl bg-white px-3 py-2 text-[13px] font-medium text-ink shadow-[0_12px_28px_-14px_rgb(107_51_0/0.5)]">
                  <span className="size-2 flex-none rounded-full bg-primary" aria-hidden />
                  <span className="truncate">Everyone sees: {stage.shows}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

const Flow = ({ business }: { business: BusinessFlowType }) => {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-flow-stage]', { autoAlpha: 0, x: -18, duration: 0.55, stagger: 0.1, ease: 'power3.out', clearProps: 'transform' });
      gsap.from('[data-flow-word]', { autoAlpha: 0, y: 10, duration: 0.45, stagger: 0.035, ease: 'power3.out', clearProps: 'transform' });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={root} className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <Text as="h3" variant="feature">
          {business.order}, from start to finish
        </Text>
        <ol className="m-0 mt-5 grid list-none gap-2 p-0">
          {business.flow.map((stage, i) => (
            <li key={stage.label} data-flow-stage className="flex items-center gap-3 rounded-xl bg-primary-50 px-3 py-3">
              <span className="grid size-7 flex-none place-items-center rounded-full bg-white text-[13px] font-semibold text-primary-800 tabular-nums" aria-hidden>
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-ink">{stage.label}</span>
                <span className="block text-sm text-ink-2">{stage.note}</span>
              </span>
              {i < business.flow.length - 1 && <ArrowRight className="ml-auto size-4 flex-none rotate-90 text-primary-700" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <Text as="h3" variant="feature">
          In your words
        </Text>
        <dl className="m-0 mt-3 divide-y divide-line">
          {business.words.map((word) => (
            <div key={word.label} data-flow-word className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-2.5">
              <dt className="text-sm text-muted-foreground">{word.label}</dt>
              <dd className="m-0 text-sm font-medium text-ink">{word.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

/** The same loop for each kind of business: tabs with its real order flow and its own words. */
export const BusinessFlows = () => {
  const [active, setActive] = useState(BUSINESS_FLOWS[0].id);
  return (
    <section aria-labelledby="flows-title" className="mx-auto max-w-300 px-4 sm:px-6">
      <SectionHeading eyebrow="Your business" title={<span id="flows-title">The same loop, in your own words.</span>} lead="Pick your kind of business and StockMotion takes on its language, its order flow and its storage." />
      <Tabs data-reveal value={active} onValueChange={setActive} className="mt-10 gap-4">
        <TabsList className="h-12 w-full max-w-md rounded-xl p-1">
          {BUSINESS_FLOWS.map((business) => {
            const BusinessIcon = business.icon;
            return (
              <TabsTrigger key={business.id} value={business.id} className="h-full cursor-pointer rounded-lg text-sm">
                <BusinessIcon aria-hidden />
                {business.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {BUSINESS_FLOWS.map((business) => (
          <TabsContent key={business.id} value={business.id}>
            <Flow business={business} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};

/** Why the numbers can be trusted. */
export const Safeguards = () => (
  <section aria-labelledby="safeguards-title" className="py-20">
    <div className="mx-auto max-w-300 px-4 sm:px-6">
      <SectionHeading eyebrow="Under the hood" title={<span id="safeguards-title">What keeps the numbers right.</span>} lead="A count is only useful if the whole team can trust it. These are the parts that make sure they can." />
      <ul data-reveal-group className="m-0 mt-12 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {SAFEGUARDS.map((item) => {
          const SafeguardIcon = item.icon;
          return (
            <li key={item.title} className="landing-card rounded-2xl border border-line bg-white p-7">
              <span className="grid size-10 place-items-center rounded-full bg-primary-50 text-primary-700">
                <SafeguardIcon className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <Text as="h3" variant="feature" className="mt-5">
                {item.title}
              </Text>
              <Text variant="body" tone="secondary" className="mt-2">
                {item.text}
              </Text>
            </li>
          );
        })}
      </ul>
    </div>
  </section>
);
