import { Check } from 'lucide-react';
import type { TemplateResponseType } from '@/frontend/features/businesses/types';
import { Cn } from '@/frontend/lib/utils';
import { SCENE } from '../lib/onboarding-options';

type Props = {
  template: TemplateResponseType;
  selected: boolean;
  /** Whether Tab lands here: the selected option, or the first when none is */
  tabbable: boolean;
  onSelect: () => void;
  /** Hovering or tabbing to a card shows it in the preview without choosing it */
  onPreview: (previewing: boolean) => void;
};

/** One kind of business: a picture and a line. The details live in the preview beside it, or under it on small screens. */
export const TemplateCard = ({ template, selected, tabbable, onSelect, onPreview }: Props) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    tabIndex={tabbable ? 0 : -1}
    onClick={onSelect}
    onMouseEnter={() => onPreview(true)}
    onMouseLeave={() => onPreview(false)}
    onFocus={() => onPreview(true)}
    onBlur={() => onPreview(false)}
    className={Cn(
      'flex w-full items-center gap-4 rounded-2xl border bg-surface p-2.5 pr-4 text-left transition-[border-color,background-color,box-shadow] duration-150',
      selected ? 'border-primary-500 bg-primary-50 shadow-[0_0_0_1px_var(--color-primary-500)]' : 'border-line hover:border-primary-300 hover:bg-primary-50/50',
    )}
  >
    <img src={SCENE[template.type]} alt="" width={1600} height={1000} decoding="async" className="block h-[72px] w-[104px] flex-none rounded-xl object-cover" />
    <span className="grid min-w-0 flex-1 gap-0.5">
      <span className="text-[15px] leading-snug font-semibold text-ink">{template.name}</span>
      <span className="text-[13px] leading-snug text-ink-2">{template.tagline}</span>
      <span className="mt-1 text-xs text-muted-foreground lg:hidden">{template.orderFlow.map((s) => s.label).join(' → ')}</span>
    </span>
    <span className={Cn('grid size-6 flex-none place-items-center rounded-full border', selected ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong')} aria-hidden>
      {selected && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  </button>
);
