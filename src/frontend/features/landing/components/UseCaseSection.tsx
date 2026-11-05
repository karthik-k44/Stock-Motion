import { ArrowRight, Check } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { Cn } from '@/frontend/lib/utils';
import { SCENARIOS, USE_CASES, type UseCaseType } from '../lib/landing-content';
import { SectionHeading } from './SectionHeading';

const CHIP = 'inline-flex h-7 items-center rounded-full border border-line bg-white px-3 text-[13px] font-medium text-ink-2';

const Chips = ({ label, items, steps }: UseCaseType['chips']) => (
  <div className="mt-7 border-t border-line pt-5">
    <p className="m-0 mb-2.5 text-xs font-semibold tracking-[0.06em] text-primary-700 uppercase">{label}</p>
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, i) => (
        <Fragment key={item}>
          {steps && i > 0 && <ArrowRight className="size-3.5 text-steel" aria-hidden />}
          <span className={CHIP}>{item}</span>
        </Fragment>
      ))}
    </div>
  </div>
);

const Row = ({ useCase, flipped }: { useCase: UseCaseType; flipped: boolean }) => {
  const UseCaseIcon = useCase.icon;
  return (
    <li id={useCase.id} data-reveal className="grid scroll-mt-32 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <img
        src={`/landing/scenarios/${useCase.image}.jpg`}
        alt={SCENARIOS.find((s) => s.image === useCase.image)?.alt ?? ''}
        width={1600}
        height={1000}
        loading="lazy"
        decoding="async"
        className={Cn('block aspect-[16/10] h-auto w-full rounded-xl border border-line object-cover', flipped && 'lg:order-last')}
      />
      <div>
        <span className="grid size-10 place-items-center rounded-xl bg-primary-50 text-primary-700" aria-hidden>
          <UseCaseIcon className="size-5" strokeWidth={1.7} />
        </span>
        <Text variant="display" as="h3" weight="semibold" className="mt-5">
          {useCase.title}
        </Text>
        <Text variant="lead" tone="secondary" className="mt-3 text-base sm:text-[17px] sm:leading-[1.5]">
          {useCase.lead}
        </Text>
        <ul className="m-0 mt-6 grid list-none gap-4 p-0">
          {useCase.points.map((p) => (
            <li key={p.title} className="flex gap-3">
              <Check className="mt-0.5 size-[18px] flex-none text-primary-700" strokeWidth={2.2} aria-hidden />
              <div>
                <Text variant="subheading">{p.title}</Text>
                <Text variant="body" tone="secondary" className="mt-0.5">
                  {p.text}
                </Text>
              </div>
            </li>
          ))}
        </ul>
        <Chips {...useCase.chips} />
      </div>
    </li>
  );
};

/** Who it's for, in detail: one illustrated row per use case, each the target of its mega-menu link. */
export const UseCaseSection = () => (
  <section id="use-cases" className="scroll-mt-28 py-20">
    <div className="mx-auto max-w-300 px-4 sm:px-6">
      <SectionHeading eyebrow="Use cases" title="Built around the way your business already works." lead="Pick your kind of business and StockMotion speaks your language — from aisles and pick lists to recipes and job kits." />
      <nav aria-label="Jump to a use case" className="mt-8 flex flex-wrap gap-2">
        {USE_CASES.map((u) => (
          <Link key={u.id} to={`/#${u.id}`} className={Cn(CHIP, 'h-9 px-4 text-sm no-underline transition-colors hover:border-primary-200 hover:bg-primary-50')}>
            {u.name}
          </Link>
        ))}
      </nav>
      <ul className="m-0 mt-14 grid list-none gap-20 p-0 lg:gap-24">
        {USE_CASES.map((u, i) => (
          <Row key={u.id} useCase={u} flipped={i % 2 === 1} />
        ))}
      </ul>
    </div>
  </section>
);
