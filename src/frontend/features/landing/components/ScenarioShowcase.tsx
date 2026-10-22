import { Text } from '@/frontend/components/text';
import { SCENARIOS } from '../lib/landing-content';
import { SectionHeading } from './SectionHeading';

/** The features at work: each illustrated scenario on a flat card, with what StockMotion does about it. */
export const ScenarioShowcase = () => (
  <section className="mt-24 bg-sunken py-20">
    <div className="mx-auto max-w-300 px-4 sm:px-6">
      <SectionHeading
        eyebrow="In practice"
        title="The problems it catches, day to day."
        lead="Each scene is drawn with the live world's own pieces, and each is something StockMotion does today."
      />
      <ul className="mt-12 grid list-none gap-4 p-0 md:grid-cols-2">
        {SCENARIOS.map((s) => (
          <li key={s.image} className="landing-card flex flex-col rounded-xl border border-transparent bg-white p-3">
            <img
              src={`/landing/scenarios/${s.image}.jpg`}
              alt={s.alt}
              width={1600}
              height={1000}
              loading="lazy"
              decoding="async"
              className="block aspect-[16/10] h-auto w-full rounded-lg border border-line object-cover"
            />
            <div className="px-3 pt-6 pb-4">
              <p className="m-0 text-xs font-semibold tracking-[0.06em] text-primary-700 uppercase">{s.area}</p>
              <Text variant="feature" className="mt-3">
                {s.title}
              </Text>
              <Text variant="body" tone="secondary" className="mt-2">
                {s.text}
              </Text>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
