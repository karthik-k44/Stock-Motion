import { LockKeyhole } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { FormatMoney, Inventories, INTERVAL_LABEL, LongDate, PER, PricePerInventory, TotalFor } from '../lib/billing-format';
import { PlanChoiceQuery } from '../lib/plan-choice';
import {
  BillingProviderTypeEnum,
  CheckoutModeTypeEnum,
  RazorpayModeTypeEnum,
  type BillingResponseType,
  type PlanChoiceType,
  type PlanResponseType,
} from '../types';

type Props = { billing: BillingResponseType; plan: PlanResponseType; choice: PlanChoiceType };

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
    <dt className={strong ? 'font-semibold text-ink' : 'text-muted-foreground'}>{label}</dt>
    <dd className={strong ? 'm-0 text-xl font-bold text-ink tabular-nums' : 'm-0 text-right font-medium text-ink tabular-nums'}>{value}</dd>
  </div>
);

/**
 * When the period being bought starts: after the rest of the trial, or after the same plan already paid ahead
 * (as the server decides it); otherwise today.
 */
export const PeriodStart = (b: BillingResponseType, choice: PlanChoiceType): string | null => {
  if (!b.hasAccess || !b.currentPeriodEnd || new Date(b.currentPeriodEnd) <= new Date()) return null;
  const samePlan = b.plan.code === choice.plan && b.interval === choice.interval && b.quantity === choice.quantity;
  return b.provider === BillingProviderTypeEnum.TRIAL || samePlan ? b.currentPeriodEnd : null;
};

/** Exactly what is being bought: the plan, the price per inventory × inventories, when it starts and how it renews. */
export const OrderSummary = ({ billing, plan, choice }: Props) => {
  const each = PricePerInventory(plan, choice.interval) ?? 0;
  const total = TotalFor(plan, choice.interval, choice.quantity);
  const starts = PeriodStart(billing, choice);
  const renews = billing.checkout === CheckoutModeTypeEnum.RAZORPAY && billing.razorpayMode === RazorpayModeTypeEnum.SUBSCRIPTIONS;
  const per = PER[choice.interval];
  return (
    <aside aria-label="Order summary" className="grid gap-4 rounded-2xl border border-line bg-surface p-6 lg:sticky lg:top-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-lg font-bold text-ink">Order summary</h2>
        <Link to={`${paths.plans}?${PlanChoiceQuery(choice)}`} className="text-sm font-semibold text-ink underline underline-offset-2">
          Change
        </Link>
      </div>
      <dl className="m-0 divide-y divide-line">
        <Row label="Plan" value={`StockMotion ${plan.name}`} />
        <Row label="Billed" value={`${INTERVAL_LABEL[choice.interval]}${renews ? ', renews by itself' : ''}`} />
        <Row label="Price" value={`${FormatMoney(each, plan.currency)} × ${Inventories(choice.quantity)}`} />
        <Row label="Starts" value={starts ? `${LongDate(starts)}, after your ${billing.provider === BillingProviderTypeEnum.TRIAL ? 'free trial' : 'current period'}` : 'Today'} />
        <Row label="Due today" value={FormatMoney(total, plan.currency)} strong />
      </dl>
      <p className="m-0 text-[13px] leading-relaxed text-ink-2">
        {renews
          ? `Then ${FormatMoney(total, plan.currency)} every ${per} until you cancel.`
          : `Covers one ${per}. Nothing renews by itself — we’ll remind you before it ends.`}{' '}
        Prices in Indian rupees.
      </p>
      <p className="m-0 flex items-start gap-2.5 rounded-xl bg-sunken p-3 text-[13px] leading-relaxed text-ink-2">
        <LockKeyhole className="mt-0.5 size-4 flex-none text-ink" aria-hidden />
        <span>Payments are processed by Razorpay. Card numbers, UPI PINs and bank logins go straight to Razorpay; StockMotion never sees them.</span>
      </p>
    </aside>
  );
};
