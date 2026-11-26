import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { SegmentedControl } from '@/frontend/components/form';
import { Button as UiButton } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { CONTACT } from '@/frontend/features/landing/lib/landing-content';
import { MoveRadio } from '@/frontend/features/onboarding/lib/onboarding-options';
import { SessionGate } from '@/frontend/features/shell/components/SessionGate';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { FlowLayout } from './components/FlowLayout';
import { InventoryStepper } from './components/InventoryStepper';
import { PlanOption } from './components/PlanOption';
import { FormatMoney, Inventories, PER, TotalFor, YearlySaving } from './lib/billing-format';
import { InitialPlanChoice, NextAfterPlan, ParsePlanChoice, PlanChoiceQuery } from './lib/plan-choice';
import { billingService } from './services';
import { BillingIntervalTypeEnum, BillingProviderTypeEnum, type BillingResponseType, type PlanChoiceType } from './types';

const SCALE_ENQUIRY = `mailto:${CONTACT.email}?subject=${encodeURIComponent('StockMotion Scale')}`;

const Chooser = ({ billing }: { billing: BillingResponseType }) => {
  const navigate = useNavigate();
  const trial = billingService.useChooseTrialPlan();
  const [params] = useSearchParams();
  // Back from the payment page with its choice in the URL, or a fresh start from what the account has.
  const [choice, setChoice] = useState<PlanChoiceType>(() => ParsePlanChoice(params, billing.maxInventories) ?? InitialPlanChoice(billing));
  const set = (patch: Partial<PlanChoiceType>) => setChoice((c) => ({ ...c, ...patch }));

  const plan = billing.plans.find((p) => p.code === choice.plan) ?? billing.plans[0];
  const total = TotalFor(plan, choice.interval, choice.quantity);
  const saving = choice.interval === BillingIntervalTypeEnum.YEARLY ? YearlySaving(plan, choice.quantity) : 0;
  // The trial can be taken once, while it lasts; afterwards the only way on is to pay.
  const canTrial = billing.provider === BillingProviderTypeEnum.TRIAL && billing.hasAccess;
  const owned = billing.usage.businesses;

  const startTrial = () =>
    trial.mutate(choice, { onSuccess: (now) => navigate(NextAfterPlan(now, paths.onboarding, paths.dashboard), { replace: true }) });

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
        <div className="grid gap-2">
          <label htmlFor="plan-quantity" className="text-sm font-semibold text-ink">
            How many inventories?
          </label>
          <InventoryStepper id="plan-quantity" label="inventories" value={choice.quantity} min={Math.max(1, owned)} max={billing.maxInventories} onChange={(quantity) => set({ quantity })} />
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Billed</span>
          <SegmentedControl
            label="Billing interval"
            value={choice.interval}
            onChange={(interval) => set({ interval })}
            options={[
              { value: BillingIntervalTypeEnum.MONTHLY, label: 'Monthly' },
              { value: BillingIntervalTypeEnum.YEARLY, label: 'Yearly · 2 months free' },
            ]}
          />
        </div>
        <p className="m-0 max-w-[40ch] text-[13px] leading-relaxed text-muted-foreground">
          Each shop, café, warehouse or van you run is one inventory, with its own stock, orders and team.
          {owned > 1 && ` You have ${owned} already, so choose at least ${owned}.`}
        </p>
      </div>

      <div className="grid gap-5 pt-3 md:grid-cols-2" role="radiogroup" aria-label="Plan" onKeyDown={MoveRadio}>
        {billing.plans.map((p) => (
          <PlanOption
            key={p.code}
            plan={p}
            interval={choice.interval}
            quantity={choice.quantity}
            selected={p.code === choice.plan}
            tabbable={p.code === choice.plan}
            onSelect={() => set({ plan: p.code as PlanChoiceType['plan'] })}
          />
        ))}
      </div>

      <section aria-label="Your choice" className="rounded-2xl border border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="m-0 text-sm text-ink-2">
              {plan.name} · {Inventories(choice.quantity)} · {choice.interval === BillingIntervalTypeEnum.YEARLY ? 'yearly' : 'monthly'}
            </p>
            <p className="m-0 mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-bold tracking-tight text-ink tabular-nums">{FormatMoney(total, plan.currency)}</span>
              <span className="text-sm text-muted-foreground">/ {PER[choice.interval]}</span>
              {saving > 0 && <span className="text-sm font-semibold text-success">You save {FormatMoney(saving, plan.currency)} a year</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canTrial && (
              <Button loading={trial.isPending} onClick={startTrial}>
                Start {billing.trialDays}-day free trial
              </Button>
            )}
            <Button variant="primary" className="cta-gradient px-5" onClick={() => navigate(paths.checkout(PlanChoiceQuery(choice)))}>
              Continue to payment
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
        {canTrial && (
          <p className="m-0 mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Free trial: no payment now, all of Pro’s features for {Inventories(choice.quantity)}. When it ends, your plan is {plan.name} at{' '}
            {FormatMoney(total, plan.currency)} / {PER[choice.interval]} — you pay only when you choose to.
          </p>
        )}
      </section>

      <p className="m-0 text-sm text-ink-2">
        Need more than {billing.maxInventories} inventories, or help moving your stock across?{' '}
        <a className="font-semibold text-ink underline underline-offset-2" href={SCALE_ENQUIRY}>
          Talk to us about Scale
        </a>
        .
      </p>
    </div>
  );
};

const PlansPage = () => {
  const billing = billingService.useGetBilling();
  const inApp = Boolean(billing.data?.usage.businesses);
  return (
    <FlowLayout
      step={0}
      title="Choose your plan"
      lead="Priced per inventory, so you pay for exactly what you run. Pay monthly or yearly — or start with a free trial and decide later."
      aside={
        inApp && (
          <UiButton asChild variant="ghost" size="sm" className="text-ink-2 hover:text-ink">
            <Link to={paths.billing}>
              <ArrowLeft aria-hidden />
              Back to billing
            </Link>
          </UiButton>
        )
      }
    >
      {billing.isPending ? (
        <SkeletonRows rows={2} height={220} label="Loading plans" />
      ) : billing.isError ? (
        <ErrorState message={billing.error.message} onRetry={() => billing.refetch()} />
      ) : (
        <Chooser billing={billing.data} />
      )}
    </FlowLayout>
  );
};

export const Plans = () => {
  useDocumentTitle('Choose your plan');
  return (
    <SessionGate>
      <PlansPage />
    </SessionGate>
  );
};
