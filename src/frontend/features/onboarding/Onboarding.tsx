import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { Logo } from '@/frontend/components/logo';
import { Text } from '@/frontend/components/text';
import { Toaster } from '@/frontend/components/toast';
import { Button as UiButton } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { ArtStreaks } from '@/frontend/features/auth/components/AuthSplitLayout';
import { Inventories } from '@/frontend/features/billing/lib/billing-format';
import { billingService } from '@/frontend/features/billing/services';
import { BillingProviderTypeEnum, type BillingResponseType } from '@/frontend/features/billing/types';
import { businessesService } from '@/frontend/features/businesses/services';
import { CreateBusinessSchema, type BusinessTypeEnum, type TemplateResponseType } from '@/frontend/features/businesses/types';
import { SessionGate } from '@/frontend/features/shell/components/SessionGate';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { BusinessPreview } from './components/BusinessPreview';
import { NamesStep, type DraftInventoryType } from './components/NamesStep';
import { OnboardingSteps, STEPS } from './components/OnboardingSteps';
import { TemplateCard } from './components/TemplateCard';
import { DefaultCurrency, OTHER_CURRENCY } from './lib/onboarding-options';

/** "Café / restaurant" → "Café": the start of a template's name, for default inventory names. */
const ShortName = (t: TemplateResponseType) => t.name.split(/\s*[/&]\s*/)[0];

/** One draft per inventory, in template order, named "Café", or "Café 1", "Café 2" when there are several. */
const Drafts = (templates: TemplateResponseType[], counts: Partial<Record<BusinessTypeEnum, number>>, names: Record<string, string>): (DraftInventoryType & { type: BusinessTypeEnum })[] =>
  templates.flatMap((t) => {
    const n = counts[t.type] ?? 0;
    return Array.from({ length: n }, (_, i) => {
      const key = `${t.type}-${i}`;
      return { key, type: t.type, typeName: t.name, name: names[key] ?? (n === 1 ? ShortName(t) : `${ShortName(t)} ${i + 1}`) };
    });
  });

type WizardProps = { billing: BillingResponseType; templates: TemplateResponseType[]; hasBusinesses: boolean };

/**
 * Set up the inventories the plan covers: how many of each kind (adding up to exactly the number still to set up),
 * then a name for each and their currency. Every inventory is created in one go, then the dashboard opens.
 */
const Wizard = ({ billing, templates, hasBusinesses }: WizardProps) => {
  const navigate = useNavigate();
  const create = businessesService.useCreateBusinesses();
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [counts, setCounts] = useState<Partial<Record<BusinessTypeEnum, number>>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [previewing, setPreviewing] = useState<BusinessTypeEnum | null>(null);
  const [currencyChoice, setCurrencyChoice] = useState(DefaultCurrency);
  const [otherCurrency, setOtherCurrency] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inventories still to set up: exactly this many, or (a plan with no limit) at least one.
  const slots = billing.usage.maxBusinesses === null ? null : billing.usage.maxBusinesses - billing.usage.businesses;
  const chosen = Object.values(counts).reduce((a, n) => a + (n ?? 0), 0);
  const full = slots !== null && chosen >= slots;
  const drafts = useMemo(() => Drafts(templates, counts, names), [templates, counts, names]);
  const currency = currencyChoice === OTHER_CURRENCY ? otherCurrency : currencyChoice;
  const last = step === STEPS.length - 1;
  const firstChosen = drafts[0];
  const shown = templates.find((t) => t.type === (previewing ?? firstChosen?.type)) ?? templates[0];

  useEffect(() => {
    if (step !== 1) heading.current?.focus();
  }, [step]);

  if (slots !== null && slots <= 0) {
    return (
      <div className="mx-auto grid max-w-130 gap-4 px-5 py-16">
        <Logo className="mb-6 text-[20px]" markClassName="h-8" />
        <h1 className="m-0 text-[28px] leading-tight font-bold tracking-tight text-ink">All your inventories are set up</h1>
        <Text variant="body" tone="secondary" className="text-[15px]">
          Your plan covers {Inventories(billing.usage.maxBusinesses ?? 0)}, and you have them all. To add another, add an inventory to your plan first.
        </Text>
        <div className="flex flex-wrap gap-3">
          <UiButton asChild className="cta-gradient font-semibold">
            <Link to={paths.plans}>Add inventories</Link>
          </UiButton>
          <UiButton asChild variant="outline" className="font-semibold">
            <Link to={paths.dashboard}>Back to my business</Link>
          </UiButton>
        </div>
      </div>
    );
  }

  const setCount = (type: BusinessTypeEnum, n: number) => {
    setErrors({});
    setCounts((c) => ({ ...c, [type]: Math.max(0, n) }));
  };
  // One left to set up: a click picks that kind instead of adding to the others.
  const pick = (type: BusinessTypeEnum) => {
    if (slots === 1) return (setErrors({}), setCounts({ [type]: 1 }));
    if (!full) setCount(type, (counts[type] ?? 0) + 1);
  };

  const goTo = (next: number) => {
    setErrors({});
    setPreviewing(null);
    setStep(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (step === 0) {
      if (slots !== null && chosen !== slots) {
        return setErrors({ type: `Choose a kind for each of your ${Inventories(slots)} — ${chosen} chosen so far` });
      }
      if (chosen === 0) return setErrors({ type: 'Choose at least one kind of business' });
      return goTo(1);
    }
    const found: Record<string, string> = {};
    drafts.forEach((d, i) => {
      const parsed = CreateBusinessSchema.safeParse({ name: d.name, type: d.type, currency });
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] === 'name' ? `inventories.${i}.name` : String(issue.path[0]);
          found[key] ??= issue.message;
        }
      }
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    create.mutate(
      { currency: currency.trim().toUpperCase(), inventories: drafts.map((d) => ({ name: d.name.trim(), type: d.type })) },
      { onSuccess: () => navigate(paths.dashboard, { replace: true }) },
    );
  };

  const copy = [
    {
      title: slots === null ? 'What kinds of business do you run?' : slots === 1 ? 'What kind of business is your inventory?' : `What kinds are your ${slots} inventories?`,
      lead: 'StockMotion sets up its words, screens and live world to match each one.',
    },
    { title: drafts.length === 1 ? 'Name your inventory' : 'Name your inventories', lead: 'We’ve filled in names to start with — change them now, or any time later in Settings.' },
  ];

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
      <main className="flex min-h-dvh flex-col px-5 py-5 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <Logo className="text-[20px]" markClassName="h-8" />
          {hasBusinesses && (
            <UiButton asChild variant="ghost" size="sm" className="text-ink-2 hover:text-ink">
              <Link to={paths.dashboard}>
                <ArrowLeft aria-hidden />
                Back to my business
              </Link>
            </UiButton>
          )}
        </header>

        <div className="mx-auto w-full max-w-130 pt-[clamp(28px,10vh,104px)] pb-8">
          <OnboardingSteps step={step} onJump={goTo} />
          <h1 ref={heading} tabIndex={-1} className="m-0 mt-8 text-[28px] leading-tight font-bold tracking-tight text-ink outline-none sm:text-[32px]">
            {copy[step].title}
          </h1>
          <Text variant="body" tone="secondary" className="mt-2 mb-6 text-[15px]">
            {copy[step].lead}
          </Text>

          <form onSubmit={submit} noValidate>
            {step === 0 && (
              <div className="grid gap-3">
                {templates.map((t) => (
                  <TemplateCard
                    key={t.type}
                    template={t}
                    count={counts[t.type] ?? 0}
                    full={full}
                    onChange={(n) => setCount(t.type, n)}
                    onPick={() => pick(t.type)}
                    onPreview={(on) => setPreviewing(on ? t.type : null)}
                  />
                ))}
                <p className="m-0 text-sm text-ink-2" aria-live="polite">
                  {slots === null ? `${Inventories(chosen)} chosen` : `${chosen} of ${slots} chosen`}
                  {billing.provider === BillingProviderTypeEnum.TRIAL && slots !== null && ' — as many as your free trial covers'}
                </p>
              </div>
            )}

            {step === 1 && (
              <NamesStep
                inventories={drafts}
                currencyChoice={currencyChoice}
                otherCurrency={otherCurrency}
                errors={errors}
                onName={(key, name) => setNames((n) => ({ ...n, [key]: name }))}
                onCurrencyChoice={setCurrencyChoice}
                onOtherCurrency={setOtherCurrency}
              />
            )}

            {errors.type && (
              <p className="form-error mt-3" role="alert">
                {errors.type}
              </p>
            )}
            {create.error && (
              <p className="form-error mt-3" role="alert">
                {create.error.message}
              </p>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => goTo(step - 1)}>
                  <ArrowLeft aria-hidden />
                  Back
                </Button>
              ) : (
                <Link to={paths.plans} className="text-[13px] text-muted-foreground underline underline-offset-2 hover:text-ink">
                  Change the number of inventories
                </Link>
              )}
              <Button type="submit" variant="primary" loading={create.isPending} className="cta-gradient min-w-36 flex-none px-5 text-[15px]">
                {last ? (drafts.length === 1 ? 'Create inventory' : `Create ${drafts.length} inventories`) : 'Continue'}
                {!last && <ArrowRight aria-hidden />}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <aside aria-label="Preview of your business" className="auth-art sticky top-0 hidden h-dvh place-items-center overflow-hidden p-8 lg:grid xl:p-12">
        <ArtStreaks />
        {shown && <BusinessPreview template={shown} name={drafts.find((d) => d.type === shown.type)?.name ?? ''} currency={step > 0 ? currency : ''} />}
      </aside>
      <Toaster />
    </div>
  );
};

const Setup = () => {
  const templates = businessesService.useGetTemplates();
  const mine = businessesService.useGetMyBusinesses();
  const billing = billingService.useGetBilling();

  if (templates.isPending || mine.isPending || billing.isPending) {
    return (
      <div className="mx-auto max-w-130 p-8">
        <SkeletonRows rows={3} height={92} label="Loading" />
      </div>
    );
  }
  if (templates.isError || mine.isError || billing.isError) {
    const failed = templates.error ?? mine.error ?? billing.error;
    return (
      <div className="mx-auto max-w-130 p-8">
        <ErrorState message={failed?.message ?? 'Something went wrong'} onRetry={() => void Promise.all([templates.refetch(), mine.refetch(), billing.refetch()])} />
      </div>
    );
  }
  // A new account that hasn't chosen a plan yet starts there: the plan decides how many inventories to set up.
  if (billing.data.provider === BillingProviderTypeEnum.TRIAL && !billing.data.planChosen && !mine.data.length) {
    return <Navigate to={paths.plans} replace />;
  }
  return <Wizard billing={billing.data} templates={templates.data} hasBusinesses={mine.data.length > 0} />;
};

export const Onboarding = () => {
  useDocumentTitle('Set up your inventories');
  return (
    <SessionGate>
      <Setup />
    </SessionGate>
  );
};
