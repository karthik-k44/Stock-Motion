import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/frontend/components/ui/accordion';
import { Button } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { FAQS } from '../lib/landing-content';

/**
 * Questions people ask before signing up: the heading and a way to start on the left, the answers as a stack of rounded
 * cards on the right, one open at a time. On phones the answers come straight after the heading, with the card below them.
 */
export const FaqSection = ({ signedIn }: { signedIn: boolean }) => (
  <section aria-labelledby="faq-list-title" className="relative isolate overflow-hidden pt-4 pb-24">
    <div className="landing-wash landing-wash-soft" aria-hidden />
    <div className="mx-auto grid max-w-300 gap-x-10 gap-y-7 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
      <div data-reveal>
        <p className="m-0 flex items-center gap-2.5 text-[15px] font-medium text-ink">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          FAQs
        </p>
        <Text as="h2" id="faq-list-title" variant="section" className="mt-3 text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.15]">
          Frequently Asked Questions
        </Text>
      </div>

      <Accordion data-reveal-group type="single" collapsible defaultValue={FAQS[0].q} className="grid content-start gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        {FAQS.map((f) => (
          <AccordionItem key={f.q} value={f.q} className="rounded-2xl border border-line bg-white px-5 shadow-[0_14px_36px_-28px_rgb(179_85_0/0.45)]">
            <AccordionTrigger className="py-[18px] text-ink">
              <Text as="span" variant="subheading" className="text-[17px] font-medium tracking-[-0.01em]">
                {f.q}
              </Text>
            </AccordionTrigger>
            <AccordionContent className="pr-9 pb-5">
              <Text variant="body" tone="secondary">
                {f.a}
              </Text>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div data-reveal className="self-start rounded-2xl border border-line bg-white p-6 shadow-[0_24px_60px_-36px_rgb(179_85_0/0.4)] sm:p-7">
        <span className="grid size-16 place-items-center rounded-full bg-primary-50 shadow-[0_0_30px_rgb(255_121_0/0.22)]" aria-hidden>
          <img src="/auth/stock-stack.webp" alt="" width={1800} height={1800} loading="lazy" decoding="async" className="size-12 object-contain" />
        </span>
        <Text as="h3" variant="title" weight="semibold" className="mt-5 tracking-[-0.02em]">
          Still have a question?
        </Text>
        <Text variant="body" tone="secondary" className="mt-2">
          Create an account and look around — it takes a minute.
        </Text>
        <Button asChild className="mt-5 h-12 w-full rounded-xl text-[15px] font-semibold">
          <Link to={signedIn ? paths.home : paths.signup}>{signedIn ? 'Open StockMotion' : 'Get started'}</Link>
        </Button>
      </div>
    </div>
  </section>
);
