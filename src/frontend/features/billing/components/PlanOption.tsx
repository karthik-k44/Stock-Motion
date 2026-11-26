import { Check, Minus } from 'lucide-react';
import { Cn } from '@/frontend/lib/utils';
import { FormatMoney, Inventories, PER, PricePerInventory, TotalFor } from '../lib/billing-format';
import { PlanCodeEnum, type BillingIntervalTypeEnum, type PlanResponseType } from '../types';

type Props = {
  plan: PlanResponseType;
  interval: BillingIntervalTypeEnum;
  quantity: number;
  selected: boolean;
  /** Whether Tab lands here: the selected option */
  tabbable: boolean;
  onSelect: () => void;
};

const Feature = ({ included, children }: { included: boolean; children: string }) => (
  <li className={Cn('flex items-start gap-2.5 text-sm', included ? 'text-ink' : 'text-muted-foreground')}>
    {included ? <Check className="mt-0.5 size-4 flex-none text-success" strokeWidth={2.5} aria-hidden /> : <Minus className="mt-0.5 size-4 flex-none" aria-hidden />}
    <span>
      {!included && <span className="sr-only">Not included: </span>}
      {children}
    </span>
  </li>
);

/** One plan as a radio card: the price of one inventory, what it includes, and the total for the inventories chosen. */
export const PlanOption = ({ plan, interval, quantity, selected, tabbable, onSelect }: Props) => {
  const each = PricePerInventory(plan, interval) ?? 0;
  const members = plan.limits.maxMembers;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${plan.name}, ${FormatMoney(each, plan.currency)} per inventory a ${PER[interval]}`}
      tabIndex={tabbable ? 0 : -1}
      onClick={onSelect}
      className={Cn(
        'relative flex flex-col rounded-2xl border bg-surface p-6 text-left transition-[border-color,box-shadow] duration-150',
        selected ? 'border-primary shadow-[0_0_0_1px_var(--color-primary-500),0_8px_30px_-12px_rgb(232_107_44/0.45)]' : 'border-line hover:border-primary-300',
      )}
    >
      {plan.code === PlanCodeEnum.PRO && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>
      )}
      <span className="flex items-center justify-between gap-3">
        <span className="text-lg font-bold text-ink">{plan.name}</span>
        <span className={Cn('grid size-6 flex-none place-items-center rounded-full border', selected ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong')} aria-hidden>
          {selected && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      </span>
      <span className="mt-3 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight text-ink">{FormatMoney(each, plan.currency)}</span>
        <span className="text-sm text-muted-foreground">/ inventory / {PER[interval]}</span>
      </span>
      <ul className="m-0 mt-5 grid list-none gap-2.5 p-0">
        <Feature included>Inventory, orders, deliveries and CSV import</Feature>
        <Feature included>The live world and stock history</Feature>
        <Feature included={members !== 1}>{members === 1 ? 'Team members and roles' : `Up to ${members ?? 'unlimited'} people per inventory, with roles`}</Feature>
        <Feature included={plan.limits.reorder}>Reorder low stock by supplier in one go</Feature>
      </ul>
      <span className="mt-6 flex items-baseline justify-between gap-3 border-t border-line pt-4 text-sm">
        <span className="text-ink-2">{Inventories(quantity)}</span>
        <span className="font-bold text-ink tabular-nums">
          {FormatMoney(TotalFor(plan, interval, quantity), plan.currency)} / {PER[interval]}
        </span>
      </span>
    </button>
  );
};
