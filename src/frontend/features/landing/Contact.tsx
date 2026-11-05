import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import { Text } from '@/frontend/components/text';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { ContactForm } from './components/ContactForm';
import { CONTACT } from './lib/landing-content';
import { usePageMotion } from './lib/use-landing-motion';

const DETAILS: { icon: LucideIcon; label: string; value: string; href?: string }[] = [
  { icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: Phone, label: 'Phone', value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/[^\d+]/g, '')}` },
  { icon: MapPin, label: 'Office', value: CONTACT.office },
];

/** The contact page: a scene and the ways to reach the team on the left, the form on the right. */
export const Contact = () => {
  useDocumentTitle('Contact us');
  const motion = usePageMotion();
  return (
    <div ref={motion}>
      <section className="mx-auto grid max-w-300 gap-4 px-4 pt-[124px] pb-20 sm:px-6 lg:grid-cols-2" aria-label="Contact us">
        <div data-reveal className="grid gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
          <img
            src="/landing/scenarios/receiving.jpg"
            alt="Illustration: pallets counted in at the dock door from a delivery truck, with a delivery-received notice."
            width={1600}
            height={1000}
            decoding="async"
            className="block aspect-[16/10] h-auto w-full rounded-xl border border-line object-cover object-[46%_center] lg:aspect-auto lg:h-full"
          />
          <ul className="m-0 grid list-none gap-5 rounded-xl border border-line bg-white p-5 sm:p-6">
            {DETAILS.map((d) => {
              const DetailIcon = d.icon;
              return (
                <li key={d.label} className="flex items-center gap-3.5">
                  <span className="grid size-10 flex-none place-items-center rounded-full bg-primary-50 text-primary-700" aria-hidden>
                    <DetailIcon className="size-[18px]" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <Text variant="subheading">{d.label}</Text>
                    {d.href ? (
                      <a href={d.href} className="text-[13px] font-medium text-ink-2 no-underline hover:text-primary-700 hover:underline">
                        {d.value}
                      </a>
                    ) : (
                      <Text variant="small" weight="medium" tone="secondary">
                        {d.value}
                      </Text>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div data-reveal className="rounded-xl border border-line bg-white p-6 sm:p-8">
          <Text variant="display" as="h1" weight="semibold">
            Get in touch
          </Text>
          <Text variant="lead" tone="secondary" className="mt-3 mb-7 text-[15px] sm:text-base">
            Our friendly team would love to hear from you.
          </Text>
          <ContactForm />
        </div>
      </section>
    </div>
  );
};
