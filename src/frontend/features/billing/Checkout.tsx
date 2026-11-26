import { ArrowLeft, CircleCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { describedBy, Field } from '@/frontend/components/form';
import { Button as UiButton } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { authService } from '@/frontend/features/auth/services';
import type { AccountResponseType } from '@/frontend/features/auth/types';
import { SessionGate } from '@/frontend/features/shell/components/SessionGate';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { FlowLayout } from './components/FlowLayout';
import { OrderSummary } from './components/OrderSummary';
import { IsPayableMethod, PaymentMethodPicker } from './components/PaymentMethodPicker';
import { FormatMoney, Inventories, LongDate, PER, TotalFor } from './lib/billing-format';
import { NextAfterPlan, ParsePlanChoice, PlanChoiceQuery } from './lib/plan-choice';
import { PaymentMethodEnum } from './lib/razorpay-checkout';
import { billingService } from './services';
import { CheckoutModeTypeEnum, type BillingResponseType, type PlanChoiceType } from './types';

/** An Indian mobile number: ten digits starting 6–9, with or without +91 / 0 and spaces. Returns the ten digits. */
const MobileDigits = (raw: string): string | null => {
  const digits = raw.replace(/[\s-]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

const Paid = ({ billing }: { billing: BillingResponseType }) => {
  const next = NextAfterPlan(billing, paths.onboarding, paths.dashboard);
  return (
    <div className="mx-auto grid max-w-120 justify-items-center gap-3 rounded-2xl border border-line p-8 text-center">
      <CircleCheck className="size-14 text-success" strokeWidth={1.75} aria-hidden />
      <h2 className="m-0 text-2xl font-bold text-ink">Payment received</h2>
      <p className="m-0 text-[15px] leading-relaxed text-ink-2">
        You’re on {billing.plan.name} for {Inventories(billing.quantity)}
        {billing.currentPeriodEnd ? `, paid until ${LongDate(billing.currentPeriodEnd)}` : ''}. A receipt is on its way to your email from Razorpay.
      </p>
      <UiButton asChild className="cta-gradient mt-3 h-11 px-6 text-[15px] font-semibold">
        <Link to={next} replace>
          {next === paths.onboarding ? 'Set up your inventories' : 'Go to your dashboard'}
        </Link>
      </UiButton>
    </div>
  );
};

const PaymentForm = ({ billing, account, choice }: { billing: BillingResponseType; account: AccountResponseType; choice: PlanChoiceType }) => {
  const navigate = useNavigate();
  const pay = billingService.useChoosePlan();
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState('');
  // A test platform (Razorpay test keys) can only complete a payment with Razorpay's test cards.
  const cardOnly = billing.testMode && billing.checkout === CheckoutModeTypeEnum.RAZORPAY;
  const [method, setMethod] = useState<PaymentMethodEnum>(cardOnly ? PaymentMethodEnum.CARD : PaymentMethodEnum.UPI);
  const payable = IsPayableMethod(method, cardOnly);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paid, setPaid] = useState<BillingResponseType | null>(null);

  const plan = billing.plans.find((p) => p.code === choice.plan)!;
  const total = FormatMoney(TotalFor(plan, choice.interval, choice.quantity), plan.currency);
  const manual = billing.checkout === CheckoutModeTypeEnum.MANUAL;

  if (paid) return <Paid billing={paid} />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!payable) return;
    const contact = MobileDigits(phone);
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = 'Enter the name to bill';
    if (!contact) found.phone = 'Enter a 10-digit Indian mobile number';
    if (!agreed) found.agreed = 'Tick this to confirm the amount';
    setErrors(found);
    if (Object.keys(found).length || !contact) return;
    pay.mutate(
      {
        choice,
        payer: {
          name: name.trim(),
          email: account.email,
          contact: `+91${contact}`,
          method,
        },
      },
      { onSuccess: (billingNow) => billingNow && setPaid(billingNow) },
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      {billing.checkout === CheckoutModeTypeEnum.NONE ? (
        <p className="note">Payments aren’t set up on this server yet, so plans can’t be bought here.</p>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-8">
          {billing.testMode && (
            <p className="note">
              {manual
                ? 'Development mode: no Razorpay keys are set, so paying switches the plan at once, with no charge.'
                : 'Test platform — no real money moves. Pay by Card with the test card 4100 2800 0000 1007, any future expiry and any CVV. If Razorpay asks to verify your mobile number for saved cards, skip it; on the test bank page, any 4–10 digit OTP succeeds.'}
            </p>
          )}

          <section aria-labelledby="pay-details" className="grid gap-4">
            <h2 id="pay-details" className="m-0 text-lg font-bold text-ink">
              Billing details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="pay-name" label="Name on the bill" error={errors.name}>
                <input
                  id="pay-name"
                  className="input h-11"
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy('pay-name', errors.name)}
                />
              </Field>
              <Field id="pay-phone" label="Mobile number" error={errors.phone} hint="Razorpay sends payment updates to it">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-2" aria-hidden>
                    +91
                  </span>
                  <input
                    id="pay-phone"
                    className="input h-11"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    maxLength={16}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={describedBy('pay-phone', errors.phone, true)}
                  />
                </div>
              </Field>
              <Field id="pay-email" label="Email for the receipt" hint="Your account’s email">
                <input id="pay-email" className="input h-11" value={account.email} readOnly aria-describedby={describedBy('pay-email', undefined, true)} />
              </Field>
            </div>
          </section>

          <section aria-labelledby="pay-method" className="grid gap-4">
            <h2 id="pay-method" className="m-0 text-lg font-bold text-ink">
              How would you like to pay?
            </h2>
            <PaymentMethodPicker value={method} onChange={setMethod} cardOnly={cardOnly} />
          </section>

          <div className="grid gap-4">
            <label className="flex items-start gap-3 text-sm leading-relaxed text-ink">
              <input
                type="checkbox"
                className="mt-1 size-4 flex-none accent-(--color-primary)"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                aria-invalid={Boolean(errors.agreed)}
                aria-describedby={errors.agreed ? 'pay-agreed-error' : undefined}
              />
              <span>
                I’m paying {total} for {plan.name}, {Inventories(choice.quantity)}, for one {PER[choice.interval]}.
              </span>
            </label>
            {errors.agreed && (
              <p id="pay-agreed-error" className="form-error m-0" role="alert">
                {errors.agreed}
              </p>
            )}
            {pay.error && (
              <p className="form-error m-0" role="alert">
                {pay.error.message}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary" loading={pay.isPending} disabled={!payable} className="cta-gradient h-12 min-w-48 px-6 text-[15px]">
                {manual ? `Activate ${plan.name}` : `Pay ${total}`}
              </Button>
              <Button variant="ghost" onClick={() => navigate(`${paths.plans}?${PlanChoiceQuery(choice)}`)} disabled={pay.isPending}>
                Back to plans
              </Button>
            </div>
          </div>
        </form>
      )}

      <OrderSummary billing={billing} plan={plan} choice={choice} />
    </div>
  );
};

const CheckoutPage = () => {
  const [params] = useSearchParams();
  const billing = billingService.useGetBilling();
  const account = authService.useGetSession().data;

  const body = () => {
    if (billing.isPending || !account) return <SkeletonRows rows={2} height={200} label="Loading your order" />;
    if (billing.isError) return <ErrorState message={billing.error.message} onRetry={() => billing.refetch()} />;
    const choice = ParsePlanChoice(params, billing.data.maxInventories);
    if (!choice) return <Navigate to={paths.plans} replace />;
    return <PaymentForm billing={billing.data} account={account} choice={choice} />;
  };

  return (
    <FlowLayout
      step={1}
      title="Confirm and pay"
      lead="Check your order, tell us how you’d like to pay, and Razorpay opens on that method to finish securely."
      aside={
        <UiButton asChild variant="ghost" size="sm" className="text-ink-2 hover:text-ink">
          <Link to={paths.plans}>
            <ArrowLeft aria-hidden />
            Plans
          </Link>
        </UiButton>
      }
    >
      {body()}
    </FlowLayout>
  );
};

export const Checkout = () => {
  useDocumentTitle('Confirm and pay');
  return (
    <SessionGate>
      <CheckoutPage />
    </SessionGate>
  );
};
