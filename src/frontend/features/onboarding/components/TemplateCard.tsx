import { Minus, Plus } from 'lucide-react';
import { Button as UiButton } from '@/frontend/components/ui/button';
import type { TemplateResponseType } from '@/frontend/features/businesses/types';
import { Cn } from '@/frontend/lib/utils';
import { SCENE } from '../lib/onboarding-options';

type Props = {
  template: TemplateResponseType;
  /** How many inventories of this kind */
  count: number;
  /** No more can be added: every inventory paid for has a kind */
  full: boolean;
  onChange: (count: number) => void;
  /** A click on the picture or words: add one, or pick this kind when only one inventory is left to set up */
  onPick: () => void;
  /** Hovering or tabbing to a card shows it in the preview */
  onPreview: (previewing: boolean) => void;
};

/**
 * One kind of business with how many inventories of it to set up. The picture and words are a button that adds one
 * (or, when there's room for just one, picks this kind); the minus and plus fine-tune the number.
 */
export const TemplateCard = ({ template, count, full, onChange, onPick, onPreview }: Props) => {
  const label = template.name.toLowerCase();
  return (
    <div
      onMouseEnter={() => onPreview(true)}
      onMouseLeave={() => onPreview(false)}
      onFocus={() => onPreview(true)}
      onBlur={() => onPreview(false)}
      className={Cn(
        'flex w-full items-center gap-4 rounded-2xl border bg-surface p-2.5 pr-3 transition-[border-color,background-color,box-shadow] duration-150',
        count > 0 ? 'border-primary-500 bg-primary-50 shadow-[0_0_0_1px_var(--color-primary-500)]' : 'border-line hover:border-primary-300 hover:bg-primary-50/50',
      )}
    >
      {/* The steppers are the accessible control; this larger target duplicates them for pointers. */}
      <button type="button" tabIndex={-1} aria-hidden onClick={onPick} className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 border-0 bg-transparent p-0 text-left">
      <img src={SCENE[template.type]} alt="" width={1600} height={1000} decoding="async" className="block h-18 w-26 flex-none rounded-xl object-cover" />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-[15px] leading-snug font-semibold text-ink">{template.name}</span>
        <span className="text-[13px] leading-snug text-ink-2">{template.tagline}</span>
        <span className="mt-1 text-xs text-muted-foreground lg:hidden">{template.orderFlow.map((s) => s.label).join(' → ')}</span>
      </span>
      </button>
      <span className="flex flex-none items-center gap-1" role="group" aria-label={`Inventories of kind ${label}`}>
        <UiButton type="button" variant="ghost" size="icon-sm" aria-label={`One fewer ${label}`} disabled={count === 0} onClick={() => onChange(count - 1)}>
          <Minus aria-hidden />
        </UiButton>
        <output className="w-7 text-center text-base font-bold text-ink tabular-nums" aria-live="polite" aria-label={`${count} × ${label}`}>
          {count}
        </output>
        <UiButton type="button" variant="ghost" size="icon-sm" aria-label={`One more ${label}`} disabled={full} onClick={() => onChange(count + 1)}>
          <Plus aria-hidden />
        </UiButton>
      </span>
    </div>
  );
};
