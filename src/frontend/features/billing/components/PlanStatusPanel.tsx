import { useNavigate } from 'react-router';
import { Badge } from '@/frontend/components/badge';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { ConfirmManager } from '@/frontend/components/modal';
import { ProgressBar } from '@/frontend/components/progress';
import { paths } from '@/frontend/config/paths';
import { FormatMoney, Inventories, INTERVAL_LABEL, LongDate, PER, PeriodProgress, PlanStanding, STATUS_BADGE } from '../lib/billing-format';
import { InitialPlanChoice, PlanChoiceQuery } from '../lib/plan-choice';
import { billingService } from '../services';
import { BillingProviderTypeEnum, PlanCodeEnum, SubscriptionStatusTypeEnum, type BillingResponseType } from '../types';

type Props = { billing: BillingResponseType };

const Meter = ({ label, value, max, detail }: { label: string; value: number; max: number | null; detail: string }) => (
  <div className="grid gap-1.5">
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="font-semibold text-ink">{label}</span>
      <span className="text-muted-foreground">{detail}</span>
    </div>
    {max !== null && <ProgressBar value={value} max={max} label={label} />}
  </div>
);

/** The next charge in one line: after the trial, or at the end of the paid period. */
const NextBill = ({ billing }: { billing: BillingResponseType }) => {
  const next = billing.nextBill;
  if (!next) return null;
  const amount = `${FormatMoney(next.amountMinor, next.currency)} / ${PER[next.interval]}`;
  const when = next.date ? ` from ${LongDate(next.date)}` : '';
  return (
    <p className="m-0 mt-3 rounded-xl bg-sunken px-3.5 py-2.5 text-sm text-ink">
      <span className="font-semibold">Next bill:</span> {next.plan.name}, {Inventories(next.quantity)} — {amount}
      {when}
      {billing.autoRenews ? '' : ', when you pay'}.
    </p>
  );
};

/** Where the account's plan stands: what it is, how long it runs, how much of it is used, and what to do next. */
export const PlanStatusPanel = ({ billing }: Props) => {
  const navigate = useNavigate();
  const cancel = billingService.useCancelPlan();
  const sync = billingService.useSyncBilling();
  const status = STATUS_BADGE[billing.status];
  const period = PeriodProgress(billing);
  const limit = billing.usage.maxBusinesses;
  const onTrial = billing.provider === BillingProviderTypeEnum.TRIAL;
  const sellable = billing.plan.code === PlanCodeEnum.STARTER || billing.plan.code === PlanCodeEnum.PRO;
  // A period-by-period plan (or the trial's chosen plan) is paid for from the payment page; a renewing one can be cancelled.
  const canPayNext = (onTrial ? billing.nextBill !== null : sellable && !billing.autoRenews) && billing.hasAccess;
  const canCancel = billing.autoRenews && !billing.cancelAtPeriodEnd && billing.status !== SubscriptionStatusTypeEnum.CANCELLED;
  const payNext = () => navigate(paths.checkout(PlanChoiceQuery(InitialPlanChoice(billing))));

  const askCancel = async () => {
    const ok = await ConfirmManager.Ask({
      title: `Cancel ${billing.plan.name}?`,
      message: 'It keeps working until the end of the period you’ve paid for, then your inventories become read-only. Nothing is deleted, and you can choose a plan again any time.',
      confirmLabel: 'Cancel plan',
      tone: 'danger',
    });
    if (ok) cancel.mutate();
  };

  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <p className="m-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Current plan</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <p className="m-0 text-3xl font-bold tracking-tight text-ink">{billing.plan.name}</p>
            <Badge tone={status.tone}>{status.label}</Badge>
            {!onTrial && sellable && <Badge tone="neutral">{INTERVAL_LABEL[billing.interval]}</Badge>}
          </div>
          <p className="m-0 mt-2 max-w-[56ch] text-sm leading-relaxed text-ink-2">{PlanStanding(billing)}</p>
          <NextBill billing={billing} />
          <div className="form-actions mt-4">
            {!billing.hasAccess || (onTrial && !billing.nextBill) ? (
              <Button variant="primary" onClick={() => navigate(paths.plans)}>
                Choose a plan
              </Button>
            ) : (
              canPayNext && (
                <Button variant="primary" onClick={payNext}>
                  {onTrial ? 'Pay now' : `Pay for next ${PER[billing.interval]}`}
                </Button>
              )
            )}
            {billing.hasAccess && billing.plan.code !== PlanCodeEnum.SCALE && (
              <Button onClick={() => navigate(paths.plans)}>Change plan or inventories</Button>
            )}
            {!onTrial && <Button onClick={() => navigate(paths.invoices)}>Invoices</Button>}
            {billing.provider === BillingProviderTypeEnum.RAZORPAY && (
              <Button icon="refresh" variant="ghost" loading={sync.isPending} onClick={() => sync.mutate()}>
                Refresh from Razorpay
              </Button>
            )}
            {canCancel && (
              <Button variant="ghost" loading={cancel.isPending} onClick={() => void askCancel()}>
                Cancel plan
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 rounded-xl bg-sunken p-4">
          {period && (
            <Meter
              label={onTrial ? 'Trial' : billing.interval === 'YEARLY' ? 'This year' : 'This month'}
              value={period.totalDays - period.daysLeft}
              max={period.totalDays}
              detail={`${period.daysLeft} of ${period.totalDays} days left`}
            />
          )}
          <Meter
            label="Inventories"
            value={billing.usage.businesses}
            max={limit}
            detail={limit === null ? `${billing.usage.businesses} · unlimited` : `${billing.usage.businesses} of ${limit} set up`}
          />
          <Meter
            label="Team"
            value={0}
            max={null}
            detail={billing.plan.limits.maxMembers === null ? 'Unlimited people' : billing.plan.limits.maxMembers === 1 ? 'Just you' : `Up to ${billing.plan.limits.maxMembers} per inventory`}
          />
        </div>
      </div>
    </Card>
  );
};
