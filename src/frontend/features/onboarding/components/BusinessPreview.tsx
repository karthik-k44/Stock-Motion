import { ArrowRight } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { BusinessInitials } from '@/frontend/features/businesses/lib/business-initials';
import type { TemplateResponseType } from '@/frontend/features/businesses/types';
import { SCENE } from '../lib/onboarding-options';

type Props = {
  template: TemplateResponseType;
  name: string;
  /** Empty until it has been chosen */
  currency: string;
};

const CHIP = 'inline-flex items-center rounded-full bg-sunken px-2.5 py-1 text-xs font-medium text-ink-2';

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="min-w-0">
    <h3 className="m-0 mb-2 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
    {children}
  </section>
);

/** What this business will look like, drawn from the real template, so a choice is made seeing what it gives you. */
export const BusinessPreview = ({ template, name, currency }: Props) => {
  const { labels } = template;
  const title = name.trim() || 'Your business';
  const menu: { icon: IconName; label: string }[] = [
    { icon: 'box', label: labels.items },
    { icon: 'orders', label: labels.orders },
    { icon: 'truck', label: labels.deliveries },
    { icon: 'grid', label: labels.locations },
  ];
  return (
    <div className="relative w-full max-w-[600px] overflow-hidden rounded-3xl bg-surface shadow-[0_32px_70px_-28px_rgb(107_51_0/0.55)]">
      <div className="flex items-center gap-3 p-4">
        <span className="switcher-avatar" aria-hidden>
          {BusinessInitials(title)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[15px] leading-snug font-bold text-ink">{title}</p>
          <p className="m-0 truncate text-xs text-muted-foreground">{[template.name, currency].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      {/* Keyed by type, so changing business fades the new one in */}
      <div key={template.type} className="animate-in fade-in duration-300">
        <img src={SCENE[template.type]} alt="" width={1600} height={1000} decoding="async" className="block aspect-[16/10] h-auto max-h-[42dvh] w-full object-cover" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
          <Section title="Your menu">
            <ul className="m-0 grid list-none gap-1.5 p-0">
              {menu.map((m) => (
                <li key={m.icon} className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-ink-2">
                  <Icon name={m.icon} size={15} className="flex-none text-primary-700" />
                  <span className="truncate">{m.label}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title={`How ${labels.orders.toLowerCase()} flow`}>
            <p className="m-0 flex flex-wrap items-center gap-x-1 gap-y-1.5">
              {template.orderFlow.map((s, i) => (
                <Fragment key={s.status}>
                  {i > 0 && <ArrowRight className="size-3 text-steel" aria-hidden />}
                  <span className={CHIP}>{s.label}</span>
                </Fragment>
              ))}
            </p>
          </Section>
          <Section title={`Your ${labels.locations.toLowerCase()}`}>
            <p className="m-0 flex flex-wrap gap-1.5">
              {template.zones.slice(0, 4).map((z) => (
                <span key={z.code} className={CHIP}>{z.name}</span>
              ))}
            </p>
          </Section>
          <Section title="Roles for your team">
            <p className="m-0 flex flex-wrap gap-1.5">
              {template.roles.filter((r) => r.code !== 'OWNER').slice(0, 4).map((r) => (
                <span key={r.code} className={CHIP}>{r.label}</span>
              ))}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};
