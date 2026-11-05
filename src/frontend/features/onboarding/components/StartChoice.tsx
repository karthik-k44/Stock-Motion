import { Check, PackageOpen, Sparkles } from 'lucide-react';
import type { TemplateResponseType } from '@/frontend/features/businesses/types';
import { Cn } from '@/frontend/lib/utils';
import { MoveRadio } from '../lib/onboarding-options';

type Props = { template: TemplateResponseType; sampleData: boolean; onChange: (sample: boolean) => void };

/** Start with a realistic example business, or with nothing. */
export const StartChoice = ({ template, sampleData, onChange }: Props) => {
  const { labels } = template;
  const options = [
    {
      value: true,
      icon: Sparkles,
      title: 'Explore with sample data',
      badge: 'Best way to look around',
      text: `A working ${template.name.toLowerCase()}, with ${labels.items.toLowerCase()}, ${labels.madePlural.toLowerCase()}, open ${labels.orders.toLowerCase()} and ${labels.deliveries.toLowerCase()} on the way. Clear it any time in Settings.`,
    },
    {
      value: false,
      icon: PackageOpen,
      title: 'Start empty',
      text: `Add your own ${labels.items.toLowerCase()} one by one, or import them from a spreadsheet as a CSV.`,
    },
  ];
  return (
    <div className="grid gap-3" role="radiogroup" aria-label="How to start" onKeyDown={MoveRadio}>
      {options.map((o) => {
        const selected = sampleData === o.value;
        const OptionIcon = o.icon;
        return (
          <button
            key={o.title}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={Cn(
              'flex w-full items-start gap-3.5 rounded-2xl border bg-surface p-4 text-left transition-[border-color,background-color,box-shadow] duration-150',
              selected ? 'border-primary-500 bg-primary-50 shadow-[0_0_0_1px_var(--color-primary-500)]' : 'border-line hover:border-primary-300 hover:bg-primary-50/50',
            )}
          >
            <span className={Cn('grid size-10 flex-none place-items-center rounded-xl', selected ? 'bg-primary-100 text-primary-700' : 'bg-sunken text-ink-2')} aria-hidden>
              <OptionIcon className="size-5" strokeWidth={1.8} />
            </span>
            <span className="grid min-w-0 flex-1 gap-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[15px] leading-snug font-semibold text-ink">{o.title}</span>
                {o.badge && <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-800">{o.badge}</span>}
              </span>
              <span className="text-[13px] leading-normal text-ink-2">{o.text}</span>
            </span>
            <span className={Cn('grid size-6 flex-none place-items-center rounded-full border', selected ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong')} aria-hidden>
              {selected && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
};
