import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { Logo } from '@/frontend/components/logo';
import { Text } from '@/frontend/components/text';
import { Toaster } from '@/frontend/components/toast';
import { Button as UiButton } from '@/frontend/components/ui/button';
import { paths } from '@/frontend/config/paths';
import { ArtStreaks } from '@/frontend/features/auth/components/AuthSplitLayout';
import { businessesService } from '@/frontend/features/businesses/services';
import { CreateBusinessSchema, type BusinessTypeEnum } from '@/frontend/features/businesses/types';
import { SessionGate } from '@/frontend/features/shell/components/SessionGate';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { FieldErrors } from '@/frontend/lib/form';
import { BusinessPreview } from './components/BusinessPreview';
import { DetailsStep } from './components/DetailsStep';
import { OnboardingSteps, STEPS } from './components/OnboardingSteps';
import { TemplateCard } from './components/TemplateCard';
import { DefaultCurrency, MoveRadio, OTHER_CURRENCY } from './lib/onboarding-options';

const COPY = [
  { title: 'What kind of business do you run?', lead: 'StockMotion sets up its words, screens and live world to match.' },
  { title: 'Name your business', lead: 'You can change both of these later in Settings.' },
];

/** Past this the name no longer fits on the button, which then just says "Create business". */
const LONGEST_BUTTON_NAME = 28;

const Wizard = () => {
  const navigate = useNavigate();
  const templates = businessesService.useGetTemplates();
  const mine = businessesService.useGetMyBusinesses();
  const create = businessesService.useCreateBusiness();
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [type, setType] = useState<BusinessTypeEnum | null>(null);
  const [previewing, setPreviewing] = useState<BusinessTypeEnum | null>(null);
  const [name, setName] = useState('');
  const [currencyChoice, setCurrencyChoice] = useState(DefaultCurrency);
  const [otherCurrency, setOtherCurrency] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const list = templates.data ?? [];
  const shown = list.find((t) => t.type === (previewing ?? type)) ?? list[0];
  const currency = currencyChoice === OTHER_CURRENCY ? otherCurrency : currencyChoice;
  const last = step === STEPS.length - 1;
  const trimmed = name.trim();

  // The step's input takes focus by itself; elsewhere, screen readers and keyboards start from the new question.
  useEffect(() => {
    if (step !== 1) heading.current?.focus();
  }, [step]);

  const goTo = (next: number) => {
    setErrors({});
    setPreviewing(null);
    setStep(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (step === 0 && !type) return setErrors({ type: 'Choose the kind of business you run' });
    if (step === 0) return goTo(1);
    const parsed = CreateBusinessSchema.safeParse({ name, type, currency });
    if (!parsed.success) return setErrors(FieldErrors(parsed.error));
    if (!last) return goTo(step + 1);
    create.mutate(parsed.data, { onSuccess: () => navigate(paths.world, { replace: true }) });
  };

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
      <main className="flex min-h-dvh flex-col px-5 py-5 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <Logo className="text-[20px]" markClassName="h-8" />
          {mine.data?.length ? (
            <UiButton asChild variant="ghost" size="sm" className="text-ink-2 hover:text-ink">
              <Link to={paths.dashboard}>
                <ArrowLeft aria-hidden />
                Back to my business
              </Link>
            </UiButton>
          ) : null}
        </header>

        <div className="mx-auto w-full max-w-[520px] pt-[clamp(28px,10vh,104px)] pb-8">
          <OnboardingSteps step={step} onJump={goTo} />
          <h1 ref={heading} tabIndex={-1} className="m-0 mt-8 text-[28px] leading-tight font-bold tracking-tight text-ink outline-none sm:text-[32px]">
            {COPY[step].title}
          </h1>
          <Text variant="body" tone="secondary" className="mt-2 mb-6 text-[15px]">
            {COPY[step].lead}
          </Text>

          <form onSubmit={submit} noValidate>
            {step === 0 &&
              (templates.isPending ? (
                <SkeletonRows rows={3} height={92} label="Loading business types" />
              ) : templates.isError ? (
                <ErrorState message={templates.error.message} onRetry={() => templates.refetch()} />
              ) : (
                <div className="grid gap-3" role="radiogroup" aria-label="Kind of business" onKeyDown={MoveRadio}>
                  {list.map((t, i) => (
                    <TemplateCard
                      key={t.type}
                      template={t}
                      selected={t.type === type}
                      tabbable={type ? t.type === type : i === 0}
                      onSelect={() => (setType(t.type), setErrors({}))}
                      onPreview={(on) => setPreviewing(on ? t.type : null)}
                    />
                  ))}
                </div>
              ))}

            {step === 1 && (
              <DetailsStep
                name={name}
                currencyChoice={currencyChoice}
                otherCurrency={otherCurrency}
                errors={errors}
                onName={setName}
                onCurrencyChoice={setCurrencyChoice}
                onOtherCurrency={setOtherCurrency}
              />
            )}

            {errors.type && <p className="form-error mt-3" role="alert">{errors.type}</p>}
            {create.error && <p className="form-error mt-3" role="alert">{create.error.message}</p>}

            <div className="mt-7 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => goTo(step - 1)}>
                  <ArrowLeft aria-hidden />
                  Back
                </Button>
              ) : (
                <span className="text-[13px] text-muted-foreground">You can add another business any time.</span>
              )}
              <Button type="submit" variant="primary" loading={create.isPending} className="cta-gradient min-w-36 flex-none px-5 text-[15px]">
                {last ? `Create ${trimmed && trimmed.length <= LONGEST_BUTTON_NAME ? trimmed : 'business'}` : 'Continue'}
                {!last && <ArrowRight aria-hidden />}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <aside aria-label="Preview of your business" className="auth-art sticky top-0 hidden h-dvh place-items-center overflow-hidden p-8 lg:grid xl:p-12">
        <ArtStreaks />
        {shown && (
          <BusinessPreview
            template={shown}
            name={name}
            currency={step > 0 ? currency : ''}
          />
        )}
      </aside>
      <Toaster />
    </div>
  );
};

export const Onboarding = () => {
  useDocumentTitle('Set up your business');
  return (
    <SessionGate>
      <Wizard />
    </SessionGate>
  );
};
